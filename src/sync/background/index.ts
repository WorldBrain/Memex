import AuthBackground from 'src/auth/background'
import { PublicSyncInterface } from './types'
import InitialSync, { SignalTransportFactory } from './initial-sync'
import ContinuousSync from './continuous-sync'
import StorageManager from '@worldbrain/storex'

export default class SyncBackground {
    initialSync: InitialSync
    continuousSync: ContinuousSync
    remoteFunctions: PublicSyncInterface

    constructor(options: {
        auth: AuthBackground
        storageManager: StorageManager
        signalTransportFactory: SignalTransportFactory
    }) {
        const syncedCollections = ['customLists', 'pageListEntries', 'pages']
        this.initialSync = new InitialSync({
            ...options,
            syncedCollections,
        })
        this.continuousSync = new ContinuousSync()

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

    async initDevice() {}
}
