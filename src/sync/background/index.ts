import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'

import {
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
import { AuthBackground } from 'src/authentication/background'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'
import { getLocalStorage } from 'src/util/storage'

export default class SyncBackground {
    initialSync: MemexInitialSync
    continuousSync: MemexContinuousSync
    remoteFunctions: PublicSyncInterface
    clientSyncLog: ClientSyncLogStorage
    settingStore: MemexSyncSettingStoreImplentation
    secretStore: SyncSecretStore
    syncLoggingMiddleware?: SyncLoggingMiddleware
    firstContinuousSyncPromise?: Promise<void>
    getSharedSyncLog: () => Promise<SharedSyncLog>

    readonly syncedCollections: string[] = SYNCED_COLLECTIONS

    constructor(
        private options: {
            auth: { getCurrentUser: () => { id: string | number } | null }
            storageManager: StorageManager
            signalTransportFactory: SignalTransportFactory
            getSharedSyncLog: () => Promise<SharedSyncLog>
            browserAPIs: Pick<Browser, 'storage'>
            appVersion: string
        },
    ) {
        this.getSharedSyncLog = options.getSharedSyncLog
        this.settingStore = new MemexSyncSettingStoreImplentation(options)
        this.secretStore = new SyncSecretStore({
            settingStore: this.settingStore,
        })
        this.clientSyncLog = new MemexClientSyncLogStorage({
            storageManager: options.storageManager,
        })
        this.initialSync = new MemexInitialSync({
            storageManager: options.storageManager,
            signalTransportFactory: options.signalTransportFactory,
            syncedCollections: this.syncedCollections,
            secrectStore: this.secretStore,
        })
        this.continuousSync = new MemexContinuousSync({
            frequencyInMs: INCREMENTAL_SYNC_FREQUENCY,
            auth: {
                getUserId: async () => {
                    const user = options.auth.getCurrentUser()
                    return user && user.id
                },
            },
            storageManager: options.storageManager,
            clientSyncLog: this.clientSyncLog,
            getSharedSyncLog: options.getSharedSyncLog,
            secretStore: this.secretStore,
            settingStore: this.settingStore,
            productType: 'ext',
            productVersion: this.options.appVersion,
            toggleSyncLogging: (enabed, deviceId?) => {
                if (this.syncLoggingMiddleware) {
                    this.syncLoggingMiddleware.enabled = enabed
                    if (enabed) {
                        this.syncLoggingMiddleware.deviceId = deviceId
                    }
                } else {
                    throw new Error(
                        `Tried to toggle sync logging before logging middleware was created`,
                    )
                }
            },
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

    async createSyncLoggingMiddleware() {
        this.syncLoggingMiddleware = new SyncLoggingMiddleware({
            storageManager: this.options.storageManager,
            clientSyncLog: this.clientSyncLog,
            includeCollections: this.syncedCollections,
        })
        this.syncLoggingMiddleware.enabled = false
        return this.syncLoggingMiddleware
    }
}

class MemexSyncSettingStoreImplentation implements MemexSyncSettingsStore {
    constructor(private options: { browserAPIs: Pick<Browser, 'storage'> }) { }

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
