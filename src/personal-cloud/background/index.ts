import StorageManager from '@worldbrain/storex'
import { getObjectByPk, getObjectWhereByPk } from '@worldbrain/storex/lib/utils'
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
    PersonalCloudUpdate,
    PersonalCloudOverwriteUpdate,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { preprocessPulledObject } from '@worldbrain/memex-common/lib/personal-cloud/utils'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import {
    PersonalCloudAction,
    PersonalCloudActionType,
    PersonalCloudSettings,
    PersonalCloudDeviceID,
    PersonalCloudRemoteInterface,
} from './types'
import {
    PERSONAL_CLOUD_ACTION_RETRY_INTERVAL,
    PASSIVE_DATA_CUTOFF_DATE,
} from './constants'
import {
    ActionExecutor,
    ActionPreprocessor,
} from '@worldbrain/memex-common/lib/action-queue/types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { wipePassiveData } from 'src/storage/passive-data-wipe'
import { SettingStore } from 'src/util/settings'
import { blobToString } from 'src/util/blob-utils'
import * as Raven from 'src/util/raven'
import delay from 'src/util/delay'

export interface PersonalCloudBackgroundOptions {
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    backend: PersonalCloudBackend
    getUserId(): Promise<string | number | null>
    userIdChanges(): AsyncIterableIterator<AuthenticatedUser>
    settingStore: SettingStore<PersonalCloudSettings>
    createDeviceId(userId: number | string): Promise<PersonalCloudDeviceID>
    writeIncomingData(params: {
        storageType: PersonalCloudClientStorageType
        collection: string
        where?: { [key: string]: any }
        updates: { [key: string]: any }
    }): Promise<void>
    getServerStorageManager(): Promise<StorageManager>
}

export class PersonalCloudBackground {
    currentSchemaVersion?: Date
    actionQueue: ActionQueue<PersonalCloudAction>
    pushMutex = new AsyncMutex()
    pullMutex = new AsyncMutex()
    deviceId?: string | number
    reportExecutingAction?: (action: PersonalCloudAction) => void
    remoteFunctions: PersonalCloudRemoteInterface
    debug = false

    constructor(public options: PersonalCloudBackgroundOptions) {
        this.actionQueue = new ActionQueue({
            storageManager: options.storageManager,
            collectionName: 'personalCloudAction',
            versions: { initial: STORAGE_VERSIONS[25].version },
            retryIntervalInMs: PERSONAL_CLOUD_ACTION_RETRY_INTERVAL,
            executeAction: this.executeAction,
            preprocessAction: this.preprocessAction,
        })

        this.remoteFunctions = {
            isPassiveDataRemovalNeeded: this.isPassiveDataRemovalNeeded,
            runPassiveDataClean: () =>
                wipePassiveData({
                    db: options.storageManager.backend['dexie'],
                }),
            runDataDump: () => delay(2000),
            runDataMigration: () => delay(2000),
            runDataMigrationPreparation: () => delay(2000),
        }
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
        try {
            for await (const updates of this.options.backend.streamUpdates()) {
                try {
                    await this.integrateUpdates(updates)
                } catch (err) {
                    console.error(`Error integrating update from cloud`, err)
                    Raven.captureException(err)
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    async integrateUpdates(updates: PersonalCloudUpdateBatch) {
        const { releaseMutex } = await this.pullMutex.lock()
        for (const update of updates) {
            await this.integrateUpdate(update)
        }
        releaseMutex()
    }

    async integrateUpdate(update: PersonalCloudUpdate) {
        this._debugLog('Processing update', update)

        const { collection } = update
        const storageManager =
            update.storage === 'persistent'
                ? this.options.persistentStorageManager
                : this.options.storageManager

        if (update.type === PersonalCloudUpdateType.Overwrite) {
            preprocessPulledObject({
                storageRegistry: storageManager.registry,
                collection,
                object: update.object,
            })
            if (update.media) {
                try {
                    await this.downloadMedia(update)
                } catch (err) {
                    const errorMsg = `Error while downloading media for update`
                    console.error(`${errorMsg}:`, err)
                    Raven.captureBreadcrumb({ update })
                    Raven.captureException(new Error(err))
                }
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

    async downloadMedia(
        update: Pick<PersonalCloudOverwriteUpdate, 'media' | 'object'>,
    ) {
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
                            fieldValue = await blobToString(fieldValue)
                        }
                    }
                    if (type === 'json') {
                        fieldValue = JSON.parse(fieldValue as string)
                    }

                    update.object[fieldName] = fieldValue
                },
            ),
        )
    }

    async waitForSync() {
        await this.pushMutex.wait()
        await this.pullMutex.wait()
        await this.actionQueue.waitForSync()
    }

    async handlePostStorageChange(event: StorageOperationEvent<'post'>) {
        this._debugLog('Process storage change:', event)

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
        this._debugLog('Executing action', action)

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

                        if (
                            !storageManager.registry.collections[
                                instruction.collection
                            ]
                        ) {
                            const errorMsg = `Non-existing collection in clientInstruction:`
                            console.error(errorMsg, instruction)
                            Raven.captureBreadcrumb({
                                clientInstruction: instruction,
                            })
                            Raven.captureException(new Error(errorMsg))
                            return
                        }

                        let dbObject
                        try {
                            dbObject = await storageManager
                                .collection(instruction.collection)
                                .findObject(instruction.uploadWhere)
                        } catch (err) {
                            console.error(
                                `Could not fetch dbObject for instruction`,
                                instruction,
                                err,
                            )
                            Raven.captureBreadcrumb({
                                clientInstruction: instruction,
                            })
                            Raven.captureException(err)
                            return
                        }
                        if (!dbObject) {
                            this._debugLog(
                                'Could not find dbObject for clientInstruction:',
                                instruction,
                            )
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
                            const errorMsg = `Don't know how to store object for instruction`
                            console.error(errorMsg, instruction)
                            Raven.captureBreadcrumb({
                                clientInstruction: instruction,
                            })
                            Raven.captureException(new Error(errorMsg))
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
                            Raven.captureBreadcrumb({
                                clientInstruction: instruction,
                            })
                            Raven.captureException(e)
                        }
                    }
                }),
            )
        }
    }

    preprocessAction: ActionPreprocessor<PersonalCloudAction> = (action) => {
        this._debugLog('Scheduling action:', action)
        return { valid: true }
    }

    async getBlockStats(): Promise<{ usedBlocks: number }> {
        const userId = await this.options.getUserId()
        if (!userId) {
            throw new Error(`Cannot get block stats if not authenticated`)
        }

        const serverStorageManager = await this.options.getServerStorageManager()
        const blockStats = await serverStorageManager.operation(
            'findObject',
            'personalBlockStats',
            {
                user: userId,
            },
        )
        if (!blockStats) {
            return { usedBlocks: 0 }
        }
        return blockStats.usedBlocks
    }

    _debugLog(...args: any[]) {
        if (this.debug) {
            console['log']('Personal Cloud -', ...args)
        }
    }

    private isPassiveDataRemovalNeeded: () => Promise<boolean> = async () => {
        const { storageManager } = this.options

        const oldVisits = await storageManager
            .collection('visits')
            .findAllObjects({
                time: { $lte: PASSIVE_DATA_CUTOFF_DATE.getTime() },
            })
        return oldVisits.length > 0
    }
}
