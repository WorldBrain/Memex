import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'

import SyncService, {
    MemexInitialSync,
    MemexContinuousSync,
    SignalTransportFactory,
    SyncSecretStore,
} from '@worldbrain/memex-common/lib/sync'
import { MemexSyncSettingsStore } from '@worldbrain/memex-common/lib/sync/settings'
import { MemexSyncSetting } from '@worldbrain/memex-common/lib/sync/types'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'
import { SYNC_STORAGE_AREA_KEYS } from '@worldbrain/memex-common/lib/sync/constants'

import { PublicSyncInterface } from './types'
import { MemexClientSyncLogStorage } from './storage'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'
import { getLocalStorage } from 'src/util/storage'
import { filterBlobsFromSyncLog } from './sync-logging'
import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'

export default class SyncBackground extends SyncService {
    remoteFunctions: PublicSyncInterface
    firstContinuousSyncPromise?: Promise<void>
    getSharedSyncLog: () => Promise<SharedSyncLog>

    readonly syncedCollections: string[] = SYNCED_COLLECTIONS

    constructor(options: {
        auth: AuthService
        storageManager: StorageManager
        signalTransportFactory: SignalTransportFactory
        getSharedSyncLog: () => Promise<SharedSyncLog>
        browserAPIs: Pick<Browser, 'storage'>
        appVersion: string
    }) {
        super({
            ...options,
            syncFrequencyInMs: INCREMENTAL_SYNC_FREQUENCY,
            clientSyncLog: new MemexClientSyncLogStorage({
                storageManager: options.storageManager,
            }),
            settingStore: new MemexSyncSettingStoreImplentation(options),
            productType: 'ext',
            productVersion: options.appVersion,
        })

        const bound = <Target, Key extends keyof Target>(
            object: Target,
            key: Key,
        ): Target[Key] => (object[key] as any).bind(object)
        this.remoteFunctions = {
            requestInitialSync: bound(this.initialSync, 'requestInitialSync'),
            answerInitialSync: bound(this.initialSync, 'answerInitialSync'),
            waitForInitialSync: bound(this.initialSync, 'waitForInitialSync'),
            enableContinuousSync: bound(
                this.continuousSync,
                'enableContinuousSync',
            ),
            forceIncrementalSync: bound(
                this.continuousSync,
                'forceIncrementalSync',
            ),
        }
    }

    async setup() {
        await this.continuousSync.setup()
        this.firstContinuousSyncPromise = this.continuousSync.forceIncrementalSync()
    }

    async tearDown() {
        await this.continuousSync.tearDown()
    }
}

class MemexSyncSettingStoreImplentation implements MemexSyncSettingsStore {
    constructor(private options: { browserAPIs: Pick<Browser, 'storage'> }) {}

    async retrieveSetting(key: MemexSyncSetting) {
        const localStorage = this.options.browserAPIs.storage.local
        return getLocalStorage(SYNC_STORAGE_AREA_KEYS[key], null, localStorage)
    }
    async storeSetting(
        key: MemexSyncSetting,
        value: boolean | number | string | null,
    ) {
        const localStorage = this.options.browserAPIs.storage.local
        await localStorage.set({
            [SYNC_STORAGE_AREA_KEYS[key]]: value,
        })
    }
}
