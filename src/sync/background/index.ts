import { Browser } from 'webextension-polyfill-ts'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import AuthBackground from 'src/auth/background'
import { PublicSyncInterface } from './types'
import InitialSync, { SignalTransportFactory } from './initial-sync'
import ContinuousSync from './continuous-sync'
import StorageManager from '@worldbrain/storex'
import { SYNC_STORAGE_AREA_KEYS } from './constants'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'

export default class SyncBackground {
    initialSync: InitialSync
    continuousSync: ContinuousSync
    remoteFunctions: PublicSyncInterface

    constructor(
        private options: {
            auth: AuthBackground
            storageManager: StorageManager
            signalTransportFactory: SignalTransportFactory
            clienSyncLog: ClientSyncLogStorage
            sharedSyncLog: SharedSyncLog
            browserAPIs: Pick<Browser, 'storage'>
        },
    ) {
        const syncedCollections = ['customLists', 'pageListEntries', 'pages']
        this.initialSync = new InitialSync({
            ...options,
            syncedCollections,
        })
        this.continuousSync = new ContinuousSync({
            auth: options.auth,
            storageManager: options.storageManager,
            clientSyncLog: options.clienSyncLog,
            sharedSyncLog: options.sharedSyncLog,
            browserAPIs: options.browserAPIs,
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

    async setup() {}
}
