import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import { doSync } from '@worldbrain/storex-sync'
import AuthBackground from 'src/auth/background'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { RecurringTask } from 'src/util/recurring-task'
import { getLocalStorage } from 'src/util/storage'

export default class ContinuousSync {
    public recurringIncrementalSyncTask?: RecurringTask
    public deviceId: number | string
    public enabled = false

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            clientSyncLog: ClientSyncLogStorage
            sharedSyncLog: SharedSyncLog
            browserAPIs: {
                storage: {
                    local: Pick<Browser['storage']['local'], 'get' | 'set'>
                }
            }
            frequencyInMs: number
            toggleSyncLogging: (enabled: boolean) => void
        },
    ) {}

    async setup() {
        const localStorage = this.options.browserAPIs.storage.local

        const enabled = await getLocalStorage(
            SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled,
            null,
            localStorage,
        )
        if (!enabled) {
            return
        }

        this.deviceId = await getLocalStorage(
            SYNC_STORAGE_AREA_KEYS.deviceId,
            null,
            localStorage,
        )
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
                onError: () => {},
            },
        )
    }

    async initDevice() {
        const localStorage = this.options.browserAPIs.storage.local

        const existingDeviceId = await getLocalStorage(
            SYNC_STORAGE_AREA_KEYS.deviceId,
            null,
            localStorage,
        )
        if (existingDeviceId) {
            return
        }

        const newDeviceId = await this.options.sharedSyncLog.createDeviceId({
            userId: this.options.auth.getCurrentUser().id,
            sharedUntil: 0,
        })
        await localStorage.set({
            [SYNC_STORAGE_AREA_KEYS.deviceId]: newDeviceId,
        })
        this.deviceId = newDeviceId
    }

    async enableContinuousSync() {
        const localStorage = this.options.browserAPIs.storage.local
        await localStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
        })

        await this.setupContinuousSync()
    }

    async setupContinuousSync() {
        this.options.toggleSyncLogging(true)
        this.enabled = true
        this.setupRecurringTask()
    }

    async forceIncrementalSync() {
        await this.recurringIncrementalSyncTask.forceRun()
    }

    async maybeDoIncrementalSync() {
        if (this.enabled) {
            await this.doIncrementalSync()
        }
    }

    private async doIncrementalSync() {
        const { auth } = this.options
        const user = auth.getCurrentUser()
        if (!user) {
            throw new Error(`Cannot Sync without authenticated user`)
        }
        await doSync({
            clientSyncLog: this.options.clientSyncLog,
            sharedSyncLog: this.options.sharedSyncLog,
            storageManager: this.options.storageManager,
            reconciler: reconcileSyncLog,
            now: Date.now(),
            userId: user.id,
            deviceId: this.deviceId,
        })
    }
}
