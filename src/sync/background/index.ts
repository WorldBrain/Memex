import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SyncPostReceiveProcessor } from '@worldbrain/storex-sync'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'

import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import SyncService, {
    MemexInitialSync,
    SignalTransportFactory,
} from '@worldbrain/memex-common/lib/sync'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'

import { PublicSyncInterface } from './types'
import {
    MemexExtClientSyncLogStorage,
    MemexExtSyncInfoStorage,
} from './storage'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'
import { filterBlobsFromSyncLog } from './sync-logging'
import { MemexExtSyncSettingStore } from './setting-store'

export default class SyncBackground extends SyncService {
    initialSync: MemexInitialSync
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
        postReceiveProcessor?: SyncPostReceiveProcessor
    }) {
        super({
            ...options,
            syncFrequencyInMs: INCREMENTAL_SYNC_FREQUENCY,
            clientSyncLog: new MemexExtClientSyncLogStorage({
                storageManager: options.storageManager,
            }),
            disableEncryption: true,
            devicePlatform: 'browser',
            syncInfoStorage: new MemexExtSyncInfoStorage({
                storageManager: options.storageManager,
            }),
            settingStore: new MemexExtSyncSettingStore(options),
            productType: 'ext',
            productVersion: options.appVersion,
            postReceiveProcessor: options.postReceiveProcessor,
        })

        const bound = <Target, Key extends keyof Target>(
            object: Target,
            key: Key,
        ): Target[Key] => (object[key] as any).bind(object)

        this.remoteFunctions = {
            requestInitialSync: bound(this.initialSync, 'requestInitialSync'),
            answerInitialSync: bound(this.initialSync, 'answerInitialSync'),
            waitForInitialSync: bound(this.initialSync, 'waitForInitialSync'),
            waitForInitialSyncConnected: bound(
                this.initialSync,
                'waitForInitialSyncConnected',
            ),
            enableContinuousSync: bound(
                this.continuousSync,
                'enableContinuousSync',
            ),
            forceIncrementalSync: bound(
                this.continuousSync,
                'forceIncrementalSync',
            ),
            listDevices: bound(this.syncInfoStorage, 'listDevices'),
        }
    }

    async createSyncLoggingMiddleware() {
        const middleware = await super.createSyncLoggingMiddleware()
        middleware.operationPreprocessor = filterBlobsFromSyncLog
        return middleware
    }

    async setup() {
        await this.continuousSync.setup()
        this.firstContinuousSyncPromise = this.continuousSync.forceIncrementalSync()
    }

    async tearDown() {
        await this.continuousSync.tearDown()
    }
}
