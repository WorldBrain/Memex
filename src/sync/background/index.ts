import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'

import { COLLECTION_NAMES as PAGES_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/pages/constants'
import { COLLECTION_NAMES as TAGS_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/tags/constants'
import { COLLECTION_NAMES as LISTS_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/lists/constants'
import { COLLECTION_NAMES as ANNOTATIONS_COLLECTION_NAMES } from '@worldbrain/memex-storage/lib/annotations/constants'

import { PublicSyncInterface } from './types'
import InitialSync, { SignalTransportFactory } from './initial-sync'
import ContinuousSync from './continuous-sync'
import { MemexClientSyncLogStorage } from './storage'
import { AuthBackground } from 'src/authentication/background'
import { INCREMENTAL_SYNC_FREQUENCY, SYNC_STORAGE_AREA_KEYS } from './constants'
import { SyncSecretStore } from './secrets'
import { ContinuousSyncSetting } from '@worldbrain/storex-sync/lib/integration/continuous-sync'
import { getLocalStorage } from 'src/util/storage'

export default class SyncBackground {
    initialSync: InitialSync
    continuousSync: ContinuousSync
    remoteFunctions: PublicSyncInterface
    clientSyncLog: ClientSyncLogStorage
    secretStore: SyncSecretStore
    syncLoggingMiddleware?: SyncLoggingMiddleware
    firstContinuousSyncPromise?: Promise<void>
    getSharedSyncLog: () => Promise<SharedSyncLog>

    readonly syncedCollections: string[] = [
        PAGES_COLLECTION_NAMES.bookmark,
        PAGES_COLLECTION_NAMES.page,
        PAGES_COLLECTION_NAMES.visit,
        TAGS_COLLECTION_NAMES.tag,
        LISTS_COLLECTION_NAMES.list,
        LISTS_COLLECTION_NAMES.listEntry,
        ANNOTATIONS_COLLECTION_NAMES.annotation,
        ANNOTATIONS_COLLECTION_NAMES.listEntry,
        ANNOTATIONS_COLLECTION_NAMES.bookmark,
    ]

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            signalTransportFactory: SignalTransportFactory
            getSharedSyncLog: () => Promise<SharedSyncLog>
            browserAPIs: Pick<Browser, 'storage'>
        },
    ) {
        this.getSharedSyncLog = options.getSharedSyncLog
        this.secretStore = new SyncSecretStore(options)
        this.clientSyncLog = new MemexClientSyncLogStorage({
            storageManager: options.storageManager,
        })
        this.initialSync = new InitialSync({
            storageManager: options.storageManager,
            signalTransportFactory: options.signalTransportFactory,
            syncedCollections: this.syncedCollections,
            secrectStore: this.secretStore,
        })
        this.continuousSync = new ContinuousSync({
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
            settingStore: {
                retrieveSetting: async (key: ContinuousSyncSetting) => {
                    const localStorage = options.browserAPIs.storage.local
                    return getLocalStorage(
                        SYNC_STORAGE_AREA_KEYS[key],
                        null,
                        localStorage,
                    )
                },
                storeSetting: async (
                    key: ContinuousSyncSetting,
                    value: boolean | number | string | null,
                ) => {
                    const localStorage = options.browserAPIs.storage.local
                    await localStorage.set({
                        [SYNC_STORAGE_AREA_KEYS[key]]: value,
                    })
                },
            },
            toggleSyncLogging: (enabed: boolean) => {
                if (this.syncLoggingMiddleware) {
                    this.syncLoggingMiddleware.enabled = enabed
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
