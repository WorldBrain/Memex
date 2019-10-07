import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'
import AuthBackground from 'src/auth/background'
import { PublicSyncInterface } from './types'
import InitialSync, { SignalTransportFactory } from './initial-sync'
import ContinuousSync from './continuous-sync'
import { MemexClientSyncLogStorage } from './storage'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'

export default class SyncBackground {
    initialSync: InitialSync
    continuousSync: ContinuousSync
    remoteFunctions: PublicSyncInterface
    clientSyncLog: ClientSyncLogStorage
    syncLoggingMiddleware?: SyncLoggingMiddleware
    firstContinuousSyncPromise?: Promise<void>
    readonly syncedCollections: string[] = [
        'bookmarks',
        'customLists',
        'pageListEntries',
        'pages',
        'visits',
        'tags',
    ]

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            signalTransportFactory: SignalTransportFactory
            sharedSyncLog: SharedSyncLog
            browserAPIs: Pick<Browser, 'storage'>
        },
    ) {
        this.clientSyncLog = new MemexClientSyncLogStorage({
            storageManager: options.storageManager,
        })
        this.initialSync = new InitialSync({
            storageManager: options.storageManager,
            signalTransportFactory: options.signalTransportFactory,
            syncedCollections: this.syncedCollections,
        })
        this.continuousSync = new ContinuousSync({
            frequencyInMs: INCREMENTAL_SYNC_FREQUENCY,
            auth: options.auth,
            storageManager: options.storageManager,
            clientSyncLog: this.clientSyncLog,
            sharedSyncLog: options.sharedSyncLog,
            browserAPIs: options.browserAPIs,
            toggleSyncLogging: (enabed: true) => {
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
