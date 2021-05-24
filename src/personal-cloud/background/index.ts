import StorageManager, {
    IndexSourceField,
    StorageRegistry,
} from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import { AsyncMutex } from '@worldbrain/memex-common/lib/utils/async-mutex'
import { PersonalCloudBackend, PersonalCloudUpdateType } from './backend/types'

export class PersonalCloudBackground {
    currentSchemaVersion?: Date
    pushMutex = new AsyncMutex()
    pullMutex = new AsyncMutex()

    constructor(
        public options: {
            storageManager: StorageManager
            backend: PersonalCloudBackend
        },
    ) {}

    async setup() {
        this.currentSchemaVersion = getCurrentSchemaVersion(
            this.options.storageManager,
        )

        // This will never return, so don't await for it
        this.integrateContinuously()
    }

    async integrateContinuously() {
        for await (const updates of this.options.backend.streamUpdates()) {
            const { releaseMutex } = await this.pullMutex.lock()
            for (const update of updates) {
                if (update.type === PersonalCloudUpdateType.Overwrite) {
                    // WARNING: Keep in mind this skips all storage middleware
                    await this.options.storageManager.backend.operation(
                        'createObject',
                        update.collection,
                        update.object,
                    )
                } else if (update.type === PersonalCloudUpdateType.Delete) {
                    await this.options.storageManager.backend.operation(
                        'deleteObjects',
                        update.collection,
                        update.where,
                    )
                }
            }
            releaseMutex()
        }
    }

    async waitForSync() {
        await this.pushMutex.wait()
        await this.pullMutex.wait()
    }

    async handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        const { releaseMutex } = await this.pushMutex.lock()

        for (const change of event.info.changes) {
            if (change.type === 'create') {
                const object = await getObjectByPk(
                    this.options.storageManager,
                    change.collection,
                    change.pk,
                )
                if (!object) {
                    // Here we assume the object is already deleted again before
                    // we got the change to look at it, so just ignore the create
                    continue
                }
                await this.options.backend.pushUpdates([
                    {
                        type: PersonalCloudUpdateType.Overwrite,
                        schemaVersion: this.currentSchemaVersion!,
                        collection: change.collection,
                        object,
                    },
                ])
            } else if (change.type === 'modify') {
                const objects = await Promise.all(
                    change.pks.map((pk) =>
                        getObjectByPk(
                            this.options.storageManager,
                            change.collection,
                            pk,
                        ),
                    ),
                )
                await this.options.backend.pushUpdates(
                    objects
                        .filter((object) => !!object)
                        .map((object) => ({
                            type: PersonalCloudUpdateType.Overwrite,
                            schemaVersion: this.currentSchemaVersion!,
                            collection: change.collection,
                            object,
                        })),
                )
            } else if (change.type === 'delete') {
                const wheres = await Promise.all(
                    change.pks.map((pk) =>
                        getObjectWhereByPk(
                            this.options.storageManager.registry,
                            change.collection,
                            pk,
                        ),
                    ),
                )
                await this.options.backend.pushUpdates(
                    wheres.map((where) => ({
                        type: PersonalCloudUpdateType.Delete,
                        schemaVersion: this.currentSchemaVersion!,
                        collection: change.collection,
                        where,
                    })),
                )
            }
        }

        releaseMutex()
    }
}

function getObjectWhereByPk(
    storageRegistry: StorageRegistry,
    collection: string,
    pk: number | string | Array<number | string>,
) {
    const getPkField = (indexSourceField: IndexSourceField) => {
        return typeof indexSourceField === 'object' &&
            'relationship' in indexSourceField
            ? indexSourceField.relationship
            : indexSourceField
    }

    const collectionDefinition = storageRegistry.collections[collection]
    const pkIndex = collectionDefinition.pkIndex!
    const where: { [field: string]: number | string } = {}
    if (pkIndex instanceof Array) {
        for (const [index, indexSourceField] of pkIndex.entries()) {
            const pkField = getPkField(indexSourceField)
            where[pkField] = pk[index]
        }
    } else {
        where[getPkField(pkIndex)] = pk as number | string
    }

    return where
}

async function getObjectByPk(
    storageManager: StorageManager,
    collection: string,
    pk: number | string | Array<number | string>,
) {
    const where = getObjectWhereByPk(storageManager.registry, collection, pk)
    return storageManager.operation('findObject', collection, where)
}
