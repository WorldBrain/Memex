import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import { doSync } from '@worldbrain/storex-sync'
import AuthBackground from 'src/auth/background'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'

export default class ContinuousSync {
    private deviceId: number | string

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            clientSyncLog: ClientSyncLogStorage
            sharedSyncLog: SharedSyncLog
            browserAPIs: Pick<Browser, 'storage'>
        },
    ) {}

    async initDevice() {
        const localStorage = this.options.browserAPIs.storage.local

        const existingDeviceId = (await localStorage.get(
            SYNC_STORAGE_AREA_KEYS.deviceId,
        ))[SYNC_STORAGE_AREA_KEYS.deviceId]
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

    async enableContinuousSync(): Promise<void> {}

    async forceIncrementalSync(): Promise<void> {
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
            now: '$now',
            userId: user.id,
            deviceId: this.deviceId,
        })
    }
}
