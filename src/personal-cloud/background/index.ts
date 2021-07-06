import StorageManager, {
    IndexSourceField,
    StorageRegistry,
} from '@worldbrain/storex'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { getCurrentSchemaVersion } from '@worldbrain/memex-common/lib/storage/utils'
import { AsyncMutex } from '@worldbrain/memex-common/lib/utils/async-mutex'
import ActionQueue from '@worldbrain/memex-common/lib/action-queue'
import {
    PersonalCloudBackend,
    PersonalCloudUpdateType,
    PersonalCloudUpdateBatch,
    PersonalCloudClientInstructionType,
    ClientStorageType,
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

export interface PersonalCloudBackgroundOptions {
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    backend: PersonalCloudBackend
    getUserId(): Promise<string | number | null>
    userIdChanges(): AsyncIterableIterator<void>
    settingStore: SettingStore<PersonalCloudSettings>
    createDeviceId(userId: number | string): Promise<PersonalCloudDeviceID>
    writeIncomingData(params: {
        storageType: ClientStorageType
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
            const storageManager =
                update.storage === 'persistent'
                    ? this.options.persistentStorageManager
                    : this.options.storageManager

            if (update.type === PersonalCloudUpdateType.Overwrite) {
                const object = update.object
                if (update.media) {
                    await Promise.all(
                        Object.entries(update.media).map(
                            async ([key, path]) => {
                                object[
                                    key
                                ] = await this.options.backend.downloadFromMedia(
                                    { path },
                                )
                            },
                        ),
                    )
                }

                await this.options.writeIncomingData({
                    storageType: update.storage ?? 'normal',
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
                await this.actionQueue.scheduleAction(
                    {
                        type: PersonalCloudActionType.PushObject,
                        updates: [
                            {
                                type: PersonalCloudUpdateType.Overwrite,
                                schemaVersion: this.currentSchemaVersion!,
                                deviceId: this.deviceId,
                                collection: change.collection,
                                object,
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
                            change.collection,
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
                                collection: change.collection,
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
                            change.collection,
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
                            collection: change.collection,
                            where,
                        })),
                    },
                    { queueInteraction: 'queue-and-return' },
                )
            }
        }

        releaseMutex()
    }

    executeAction: ActionExecutor<PersonalCloudAction> = async ({ action }) => {
        if (!this.deviceId) {
            return { pauseAndRetry: true }
        }

        if (action.type === PersonalCloudActionType.PushObject) {
            const {
                clientInstructions,
            } = await this.options.backend.pushUpdates(
                action.updates.map((update) => ({
                    ...update,
                    deviceId: update.deviceId ?? this.deviceId,
                })),
            )
            await this.actionQueue.scheduleAction(
                {
                    type: PersonalCloudActionType.ExecuteClientInstructions,
                    clientInstructions,
                },
                { queueInteraction: 'queue-and-return' },
            )
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
                        const storageObject = dbObject[instruction.uploadField]
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
