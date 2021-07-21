import StorageManager, {
    IndexSourceField,
    StorageRegistry,
} from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import {
    getCurrentSchemaVersion,
    isTermsField,
} from '@worldbrain/memex-common/lib/storage/utils'
import { AsyncMutex } from '@worldbrain/memex-common/lib/utils/async-mutex'
import ActionQueue from '@worldbrain/memex-common/lib/action-queue'
import {
    PersonalCloudBackend,
    PersonalCloudUpdateType,
    PersonalCloudUpdateBatch,
    PersonalCloudClientInstructionType,
    PersonalCloudClientStorageType,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import {
    PersonalCloudAction,
    PersonalCloudActionType,
    PersonalCloudSettings,
    PersonalCloudDeviceID,
} from './types'
import { PERSONAL_CLOUD_ACTION_RETRY_INTERVAL } from './constants'
import {
    ActionExecutor,
    ActionPreprocessor,
} from '@worldbrain/memex-common/lib/action-queue/types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { SettingStore } from 'src/util/settings'
import { getObjectByPk, getObjectWhereByPk } from 'src/storage/utils'
import { blobToJson, blobToString } from 'src/util/blob-utils'

export interface PersonalCloudBackgroundOptions {
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    backend: PersonalCloudBackend
    getUserId(): Promise<string | number | null>
    userIdChanges(): AsyncIterableIterator<void>
    settingStore: SettingStore<PersonalCloudSettings>
    createDeviceId(userId: number | string): Promise<PersonalCloudDeviceID>
    writeIncomingData(params: {
        storageType: PersonalCloudClientStorageType
        collection: string
        where?: { [key: string]: any }
        updates: { [key: string]: any }
    }): Promise<void>
}

export class PersonalCloudBackground {
    currentSchemaVersion?: Date
    actionQueue: ActionQueue<PersonalCloudAction>
    pushMutex = new AsyncMutex()
    pullMutex = new AsyncMutex()
    deviceId?: string | number
    reportExecutingAction?: (action: PersonalCloudAction) => void

    constructor(public options: PersonalCloudBackgroundOptions) {
        this.actionQueue = new ActionQueue({
            storageManager: options.storageManager,
            collectionName: 'personalCloudAction',
            versions: { initial: STORAGE_VERSIONS[25].version },
            retryIntervalInMs: PERSONAL_CLOUD_ACTION_RETRY_INTERVAL,
            executeAction: this.executeAction,
            preprocessAction: this.preprocessAction,
        })
    }

    async setup() {
        this.currentSchemaVersion = getCurrentSchemaVersion(
            this.options.storageManager,
        )
        await this.actionQueue.setup({ paused: true })
        await this.loadDeviceId()

        // These will never return, so don't await for it
        this.observeAuthChanges()
        this.integrateContinuously()
    }

    async observeAuthChanges() {
        for await (const _ of this.options.userIdChanges()) {
            await this.loadDeviceId()
        }
    }

    async loadDeviceId() {
        const userId = await this.options.getUserId()
        if (userId) {
            this.deviceId = await this.options.settingStore.get('deviceId')
            if (!this.deviceId) {
                this.deviceId = await this.options.createDeviceId(userId)
                await this.options.settingStore.set('deviceId', this.deviceId!)
            }
            this.actionQueue.unpause()
        } else {
            this.actionQueue.pause()
            delete this.deviceId
        }
    }

    async integrateContinuously() {
        for await (const updates of this.options.backend.streamUpdates()) {
            await this.integrateUpdates(updates)
        }
    }

    async integrateUpdates(updates: PersonalCloudUpdateBatch) {
        const { releaseMutex } = await this.pullMutex.lock()
        for (const update of updates) {
            // console.log('processing update', update)
            const { collection } = update
            const storageManager =
                update.storage === 'persistent'
                    ? this.options.persistentStorageManager
                    : this.options.storageManager

            if (update.type === PersonalCloudUpdateType.Overwrite) {
                const object = update.object
                preprocessPulledObject({
                    storageRegistry: storageManager.registry,
                    collection,
                    object,
                })
                if (update.media) {
                    await Promise.all(
                        Object.entries(update.media).map(
                            async ([fieldName, { path, type }]) => {
                                let fieldValue:
                                    | Blob
                                    | string = await this.options.backend.downloadFromMedia(
                                    { path },
                                )
                                if (type === 'text' || type === 'json') {
                                    if (fieldValue instanceof Blob) {
                                        fieldValue = await blobToString(
                                            fieldValue,
                                        )
                                    }
                                }
                                if (type === 'json') {
                                    fieldValue = JSON.parse(
                                        fieldValue as string,
                                    )
                                }

                                object[fieldName] = fieldValue
                            },
                        ),
                    )
                }

                await this.options.writeIncomingData({
                    storageType:
                        update.storage ?? PersonalCloudClientStorageType.Normal,
                    collection: update.collection,
                    updates: update.object,
                    where: update.where,
                })
            } else if (update.type === PersonalCloudUpdateType.Delete) {
                await storageManager.backend.operation(
                    'deleteObjects',
                    update.collection,
                    update.where,
                )
            }
        }
        releaseMutex()
    }

    async waitForSync() {
        await this.pushMutex.wait()
        await this.pullMutex.wait()
        await this.actionQueue.waitForSync()
    }

    async handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        const { releaseMutex } = await this.pushMutex.lock()

        for (const change of event.info.changes) {
            const { collection } = change
            if (change.type === 'create') {
                const object = await getObjectByPk(
                    this.options.storageManager,
                    collection,
                    change.pk,
                )
                if (!object) {
                    // Here we assume the object is already deleted again before
                    // we got the change to look at it, so just ignore the create
                    continue
                }
                await this.actionQueue.scheduleAction(
                    {
                        type: PersonalCloudActionType.PushObject,
                        updates: [
                            {
                                type: PersonalCloudUpdateType.Overwrite,
                                schemaVersion: this.currentSchemaVersion!,
                                deviceId: this.deviceId,
                                collection,
                                object: this.preprocessObjectForPush({
                                    collection,
                                    object,
                                }),
                            },
                        ],
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            } else if (change.type === 'modify') {
                const objects = await Promise.all(
                    change.pks.map((pk) =>
                        getObjectByPk(
                            this.options.storageManager,
                            collection,
                            pk,
                        ),
                    ),
                )
                await this.actionQueue.scheduleAction(
                    {
                        type: PersonalCloudActionType.PushObject,
                        updates: objects
                            .filter((object) => !!object)
                            .map((object) => ({
                                type: PersonalCloudUpdateType.Overwrite,
                                schemaVersion: this.currentSchemaVersion!,
                                deviceId: this.deviceId,
                                collection,
                                object,
                            })),
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            } else if (change.type === 'delete') {
                const wheres = await Promise.all(
                    change.pks.map((pk) =>
                        getObjectWhereByPk(
                            this.options.storageManager.registry,
                            collection,
                            pk,
                        ),
                    ),
                )
                await this.actionQueue.scheduleAction(
                    {
                        type: PersonalCloudActionType.PushObject,
                        updates: wheres.map((where) => ({
                            type: PersonalCloudUpdateType.Delete,
                            schemaVersion: this.currentSchemaVersion!,
                            deviceId: this.deviceId,
                            collection,
                            where,
                        })),
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            }
        }

        releaseMutex()
    }

    preprocessObjectForPush({
        collection,
        object,
    }: {
        collection: string
        object: any
    }) {
        for (const field of Object.keys(object)) {
            if (isTermsField({ collection, field })) {
                delete object[field]
            }
        }
        if (collection === 'pages') {
            delete object.text
        }
        if (collection === 'favIcons') {
            delete object.favIcon
        }
        return object
    }

    executeAction: ActionExecutor<PersonalCloudAction> = async ({ action }) => {
        if (!this.deviceId) {
            return { pauseAndRetry: true }
        }
        // console.log('executing action', action)

        // For automated tests
        this.reportExecutingAction?.(action)

        if (action.type === PersonalCloudActionType.PushObject) {
            const {
                clientInstructions,
            } = await this.options.backend.pushUpdates(
                action.updates.map((update) => ({
                    ...update,
                    deviceId: update.deviceId ?? this.deviceId,
                })),
            )
            if (clientInstructions.length) {
                await this.actionQueue.scheduleAction(
                    {
                        type: PersonalCloudActionType.ExecuteClientInstructions,
                        clientInstructions,
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            }
        } else if (
            action.type === PersonalCloudActionType.ExecuteClientInstructions
        ) {
            const { clientInstructions } = action
            await Promise.all(
                clientInstructions.map(async (instruction) => {
                    if (
                        instruction.type ===
                        PersonalCloudClientInstructionType.UploadToStorage
                    ) {
                        const storageManager =
                            instruction.storage === 'persistent'
                                ? this.options.persistentStorageManager
                                : this.options.storageManager
                        const dbObject = await storageManager
                            .collection(instruction.collection)
                            .findObject(instruction.uploadWhere)
                        if (!dbObject) {
                            return
                        }
                        let storageObject = dbObject[instruction.uploadField]
                        if (instruction.uploadAsJson) {
                            storageObject = new Blob(
                                [JSON.stringify(storageObject)],
                                {
                                    type:
                                        instruction.uploadContentType ??
                                        'application/json',
                                },
                            )
                        }
                        if (
                            !storageObject ||
                            (typeof storageObject !== 'string' &&
                                !(storageObject instanceof Blob))
                        ) {
                            return
                        }
                        try {
                            await this.options.backend.uploadToMedia({
                                deviceId: this.deviceId,
                                mediaPath: instruction.uploadPath,
                                mediaObject: storageObject,
                                changeInfo: instruction.changeInfo,
                                contentType: instruction.uploadContentType,
                            })
                        } catch (e) {
                            console.error(
                                'Could not execute client instruction',
                                instruction,
                            )
                            console.error(e)
                        }
                    }
                }),
            )
        }
    }

    preprocessAction: ActionPreprocessor<PersonalCloudAction> = () => {
        return { valid: true }
    }
}

export function preprocessPulledObject(params: {
    storageRegistry: StorageRegistry
    collection: string
    object: any
}) {
    const collectionDefinition =
        params.storageRegistry.collections[params.collection]
    if (!collectionDefinition) {
        throw new Error(
            `Got pulled object for non-existing collection: ${params.collection}`,
        )
    }

    for (const [fieldName, fieldDefinition] of Object.entries(
        collectionDefinition.fields,
    )) {
        if (
            fieldDefinition.type === 'datetime' &&
            typeof params.object[fieldName] === 'number'
        ) {
            params.object[fieldName] = new Date(params.object[fieldName])
        }
    }
}
