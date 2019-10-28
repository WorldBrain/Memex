import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import {
    doSync,
    SyncPreSendProcessor,
    SyncSerializer,
} from '@worldbrain/storex-sync'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { RecurringTask } from 'src/util/recurring-task'
import { getLocalStorage } from 'src/util/storage'
import { AuthBackground } from 'src/authentication/background'
import { isTermsField } from 'src/storage/utils'
import { SyncSecretStore } from './secrets'
import { EncryptedSyncSerializer } from './sync-serializer'

export default class ContinuousSync {
    public recurringIncrementalSyncTask?: RecurringTask
    public deviceId: number | string
    public enabled = false
    public useEncryption = true
    private syncSerializer: SyncSerializer

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            clientSyncLog: ClientSyncLogStorage
            secretStore: SyncSecretStore
            getSharedSyncLog: () => Promise<SharedSyncLog>
            browserAPIs: {
                storage: {
                    local: Pick<Browser['storage']['local'], 'get' | 'set'>
                }
            }
            frequencyInMs: number
            toggleSyncLogging: (enabled: boolean) => void
        },
    ) {
        this.syncSerializer = new EncryptedSyncSerializer({
            secretStore: options.secretStore,
        })
    }

    async setup() {
        const enabled = await this.retrieveSetting('continuousSyncEnabled')
        if (!enabled) {
            return
        }

        this.deviceId = await this.retrieveSetting('deviceId')
        this.setupContinuousSync()
    }

    async tearDown() {
        if (this.recurringIncrementalSyncTask) {
            this.recurringIncrementalSyncTask.stop()
        }
    }

    setupRecurringTask() {
        this.recurringIncrementalSyncTask = new RecurringTask(
            () => this.maybeDoIncrementalSync(),
            {
                intervalInMs: this.options.frequencyInMs,
                onError: () => { },
            },
        )
    }

    async initDevice() {
        const existingDeviceId = await this.retrieveSetting('deviceId')
        if (existingDeviceId) {
            return
        }

        const sharedSyncLog = await this.options.getSharedSyncLog()
        const newDeviceId = await sharedSyncLog.createDeviceId({
            userId: (await this.options.auth.authService.getCurrentUser()).id,
            sharedUntil: 1,
        })
        await this.storeSetting('deviceId', newDeviceId)
        this.deviceId = newDeviceId
    }

    async enableContinuousSync() {
        await this.storeSetting('continuousSyncEnabled', true)
        await this.setupContinuousSync()
    }

    async setupContinuousSync() {
        this.options.toggleSyncLogging(true)
        this.enabled = true
        this.setupRecurringTask()
    }

    async forceIncrementalSync() {
        if (this.enabled) {
            await this.recurringIncrementalSyncTask.forceRun()
        }
    }

    async maybeDoIncrementalSync() {
        if (this.enabled) {
            await this.doIncrementalSync()
        }
    }

    private async doIncrementalSync() {
        const user = await this.options.auth.authService.getCurrentUser()

        if (!user) {
            throw new Error(`Cannot Sync without authenticated user`)
        }
        await doSync({
            clientSyncLog: this.options.clientSyncLog,
            sharedSyncLog: await this.options.getSharedSyncLog(),
            storageManager: this.options.storageManager,
            reconciler: reconcileSyncLog,
            now: Date.now(),
            userId: user.id,
            deviceId: this.deviceId,
            serializer: this.useEncryption ? this.syncSerializer : undefined,
            preSend: _preSendProcessor,
        })
    }

    async retrieveSetting(key: keyof typeof SYNC_STORAGE_AREA_KEYS) {
        const localStorage = this.options.browserAPIs.storage.local
        return getLocalStorage(SYNC_STORAGE_AREA_KEYS[key], null, localStorage)
    }

    async storeSetting(
        key: keyof typeof SYNC_STORAGE_AREA_KEYS,
        value: boolean | number | string | null,
    ) {
        const localStorage = this.options.browserAPIs.storage.local
        await localStorage.set({
            [SYNC_STORAGE_AREA_KEYS[key]]: value,
        })
    }
}

export const _preSendProcessor: SyncPreSendProcessor = async ({
    entry,
    ...params
}) => {
    if (entry.operation === 'create') {
        for (const field of Object.keys(entry.value)) {
            if (isTermsField({ field, collection: entry.collection })) {
                delete entry.value[field]
            }
        }
        if (!Object.keys(entry.value).length) {
            return { entry: null }
        } else {
            return { entry }
        }
    } else if (entry.operation === 'modify') {
        if (isTermsField(entry)) {
            return { entry: null }
        } else {
            return { entry }
        }
    } else {
        return { entry, ...params }
    }
}
