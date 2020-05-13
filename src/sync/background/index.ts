import { Browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import { SyncPostReceiveProcessor } from '@worldbrain/storex-sync'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'

import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import SyncService, {
    MemexInitialSync,
    SignalTransportFactory,
} from '@worldbrain/memex-common/lib/sync'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'
import { TweetNaclSyncEncryption } from '@worldbrain/memex-common/lib/sync/secrets/tweetnacl'

import { PublicSyncInterface } from './types'
import {
    MemexExtClientSyncLogStorage,
    MemexExtSyncInfoStorage,
} from './storage'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'
import { filterSyncLog } from './sync-logging'
import { MemexExtSyncSettingStore } from './setting-store'
import { resolvablePromise } from 'src/util/promises'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { InitialSyncEvents } from '@worldbrain/storex-sync/lib/integration/initial-sync'
import { bindMethod } from 'src/util/functions'
import { Analytics } from 'src/analytics/types'
import {
    FastSyncProgress,
    FastSyncRole,
} from '@worldbrain/storex-sync/lib/fast-sync/types'

export default class SyncBackground extends SyncService {
    private analytics: Analytics
    initialSync: MemexInitialSync
    remoteFunctions: PublicSyncInterface
    firstContinuousSyncPromise?: Promise<void>
    getSharedSyncLog: () => Promise<SharedSyncLog>

    readonly syncedCollections: string[] = SYNCED_COLLECTIONS
    readonly auth: AuthService

    constructor(options: {
        auth: AuthService
        storageManager: StorageManager
        signalTransportFactory: SignalTransportFactory
        getSharedSyncLog: () => Promise<SharedSyncLog>
        getIceServers?: () => Promise<string[]>
        browserAPIs: Pick<Browser, 'storage'>
        appVersion: string
        analytics: Analytics
        disableEncryption?: boolean
        postReceiveProcessor?: SyncPostReceiveProcessor
    }) {
        super({
            ...options,
            syncFrequencyInMs: INCREMENTAL_SYNC_FREQUENCY,
            clientSyncLog: new MemexExtClientSyncLogStorage({
                storageManager: options.storageManager,
            }),
            disableEncryption: options.disableEncryption,
            syncEncryption: new TweetNaclSyncEncryption({}),
            devicePlatform: 'browser',
            syncInfoStorage: new MemexExtSyncInfoStorage({
                storageManager: options.storageManager,
            }),
            settingStore: new MemexExtSyncSettingStore(options),
            productType: 'ext',
            productVersion: options.appVersion,
            postReceiveProcessor: options.postReceiveProcessor,
            continuousSyncBatchSize: 50,
        })

        this.auth = options.auth
        this.analytics = options.analytics

        this.remoteFunctions = {
            requestInitialSync: bindMethod(
                this.initialSync,
                'requestInitialSync',
            ),
            answerInitialSync: bindMethod(
                this.initialSync,
                'answerInitialSync',
            ),
            waitForInitialSync: bindMethod(this, 'waitForInitialSync'),
            waitForInitialSyncConnected: bindMethod(
                this.initialSync,
                'waitForInitialSyncConnected',
            ),
            abortInitialSync: bindMethod(this.initialSync, 'abortInitialSync'),
            enableContinuousSync: bindMethod(
                this.continuousSync,
                'enableContinuousSync',
            ),
            forceIncrementalSync: bindMethod(
                this.continuousSync,
                'forceIncrementalSync',
            ) as () => Promise<void>,
            listDevices: bindMethod(this.syncInfoStorage, 'listDevices'),
            removeDevice: bindMethod(this.syncInfoStorage, 'removeDevice'),
        }

        this.setupSyncAnalytics()
        this.initialSync.debug = true
    }

    async waitForInitialSync() {
        try {
            await this.initialSync.waitForInitialSync()
        } catch (err) {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'failInitSync',
            })

            throw err
        }
    }

    async createSyncLoggingMiddleware() {
        const middleware = await super.createSyncLoggingMiddleware()
        middleware.changeInfoPreprocessor = filterSyncLog
        return middleware
    }

    async setup() {
        await this.continuousSync.setup()

        const authChangePromise = resolvablePromise()
        this.auth.events.once('changed', () => {
            authChangePromise.resolve()
        })

        this.firstContinuousSyncPromise = (async () => {
            const maybeSync = async () => {
                const isAuthenticated = !!(await this.auth.getCurrentUser())
                if (isAuthenticated) {
                    await this.continuousSync.forceIncrementalSync()
                }
                return isAuthenticated
            }
            if (await maybeSync()) {
                return
            }

            await Promise.race([
                authChangePromise,
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ])
            await maybeSync()
        })()
    }

    async tearDown() {
        await this.continuousSync.tearDown()
    }

    registerRemoteEmitter() {
        const remoteEmitter = remoteEventEmitter<InitialSyncEvents>('sync')

        this.initialSync.events.on('progress', (args) => {
            return remoteEmitter.emit('progress', args)
        })
        this.initialSync.events.on('roleSwitch', (args) => {
            return remoteEmitter.emit('roleSwitch', args)
        })
        this.initialSync.events.on('error', (args) => {
            return remoteEmitter.emit('error', args)
        })
        this.initialSync.events.on('finished', (args) => {
            return remoteEmitter.emit('finished', args)
        })
    }

    setupSyncAnalytics() {
        let progress: FastSyncProgress | null = null
        let role: FastSyncRole | null = null
        let progressEventCount = 0
        let stalled = false
        this.initialSync.events.on('start', () => {
            progress = null
            role = null
            progressEventCount = 0
            stalled = false

            this.analytics.trackEvent({
                category: 'Sync',
                action: 'startInitSync',
            })
        })
        this.initialSync.events.on('prepared', (event) => {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'preparedInitSync',
                value: event.syncInfo,
            })
        })
        this.initialSync.events.on('connected', () => {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'connectedInitSync',
            })
        })
        this.initialSync.events.on('progress', (event) => {
            progress = event.progress
            progressEventCount += 1
            if (stalled || progressEventCount % 100 === 0) {
                stalled = false
                this.analytics.trackEvent({
                    category: 'Sync',
                    action: 'progressInitSync',
                })
            }
        })
        this.initialSync.events.on('roleSwitch', () => {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'roleSwitchInitSync',
            })
        })
        this.initialSync.events.on('stalled', () => {
            stalled = true
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'stalledInitSync',
            })
        })
        this.initialSync.events.on('error', () => {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'errorInitSync',
                value: { progress },
            })
        })
        this.initialSync.events.on('finished', () => {
            this.analytics.trackEvent({
                category: 'Sync',
                action: 'finishInitSync',
            })
        })
    }

    _getTime = () => Date.now()
}
