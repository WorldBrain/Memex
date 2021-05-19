import StorageManager, { IndexSourceField } from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import { AsyncMutex } from '@worldbrain/memex-common/lib/utils/async-mutex'
import { PersonalCloudBackend } from './backend/types'

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
        for await (const { objects } of this.options.backend.streamObjects()) {
            const { releaseMutex } = await this.pullMutex.lock()
            for (const objectInfo of objects) {
                await this.options.storageManager.operation(
                    'createObject',
                    objectInfo.collection,
                    objectInfo.object,
                )
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
                await this.options.backend.pushObject({
                    schemaVersion: this.currentSchemaVersion!,
                    collection: change.collection,
                    object,
                })
            }
        }

        releaseMutex()
    }
}

async function getObjectByPk(
    storageManager: StorageManager,
    collection: string,
    pk: number | string | { [field: string]: number | string },
) {
    const getPkField = (indexSourceField: IndexSourceField) => {
        return typeof indexSourceField === 'object' &&
            'relationship' in indexSourceField
            ? indexSourceField.relationship
            : indexSourceField
    }

    const collectionDefinition = storageManager.registry.collections[collection]
    const pkIndex = collectionDefinition.pkIndex!
    const where: { [field: string]: number | string } =
        pkIndex instanceof Array
            ? (pk as { [field: string]: number | string })
            : { [getPkField(pkIndex)]: pk as number | string }

    return storageManager.operation('findObject', collection, where)
}
