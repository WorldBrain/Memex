import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import expect from 'expect'
const wrtc = require('wrtc')
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { SignalTransportFactory } from '@worldbrain/memex-common/lib/sync'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
} from 'src/background-script/setup'
import initStorex from '../search/memory-storex'
import { TabManager } from 'src/activity-logger/background'
import {
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTest,
} from './integration-tests'
import MemoryBrowserStorage from 'src/util/tests/browser-storage'
import { StorageChangeDetector } from './storage-change-detector'
import StorageOperationLogger from './storage-operation-logger'
import { setStorex } from 'src/search/get-db'
import { registerSyncBackgroundIntegrationTests } from 'src/sync/index.tests'
import { AuthBackground } from 'src/authentication/background'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { MockFetchPageDataProcessor } from 'src/page-analysis/background/mock-fetch-page-data-processor'
import { FetchPageProcessor } from 'src/page-analysis/background/types'
import { FakeAnalytics } from 'src/analytics/mock'
import AnalyticsManager from 'src/analytics/analytics'
import { setStorageMiddleware } from 'src/storage/middleware'
import { JobDefinition } from 'src/job-scheduler/background/types'
import {
    createLazyServerStorage,
    createLazyMemoryServerStorage,
} from 'src/storage/server'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import StorageManager from '@worldbrain/storex'
import { ServerStorage } from 'src/storage/types'

export async function setupBackgroundIntegrationTest(options?: {
    customMiddleware?: StorageMiddleware[]
    tabManager?: TabManager
    signalTransportFactory?: SignalTransportFactory
    getServerStorage?: () => Promise<ServerStorage>
    browserLocalStorage?: MemoryBrowserStorage
    debugStorageOperations?: boolean
    fetchPageProcessor?: FetchPageProcessor
    includePostSyncProcessor?: boolean
    enableSyncEncyption?: boolean
}): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const browserLocalStorage =
        (options && options.browserLocalStorage) || new MemoryBrowserStorage()
    const storageManager = initStorex()

    const getServerStorage =
        options?.getServerStorage ?? createLazyMemoryServerStorage()

    const authService = new MemoryAuthService()
    const subscriptionService = new MemorySubscriptionsService()
    const auth: AuthBackground = new AuthBackground({
        authService,
        subscriptionService,
        scheduleJob: (job: JobDefinition) => {
            console['info'](
                'Running job immediately while in testing, job:',
                job,
            )
            console['info'](`Ran job ${job.name} returned:`, job.job())
        },
        getUserManagement: async () =>
            (await getServerStorage()).storageModules.userManagement,
    })
    const analyticsManager = new AnalyticsManager({
        backend: new FakeAnalytics(),
        shouldTrack: async () => true,
    })

    const backgroundModules = createBackgroundModules({
        storageManager,
        analyticsManager,
        localStorageChangesManager: null,
        getServerStorage,
        browserAPIs: {
            webNavigation: {
                onHistoryStateUpdated: { addListener: () => {} },
            },
            storage: {
                local: browserLocalStorage,
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
            alarms: {
                onAlarm: { addListener: () => {} },
            },
            tabs: {
                query: () => {},
                get: () => {},
            },
            contextMenus: {
                create: () => {},
            },
        } as any,
        tabManager: options?.tabManager,
        signalTransportFactory: options?.signalTransportFactory,
        getSharedSyncLog: async () =>
            (await getServerStorage()).storageModules.sharedSyncLog,
        includePostSyncProcessor: options?.includePostSyncProcessor,
        fetchPageDataProcessor:
            options?.fetchPageProcessor ?? new MockFetchPageDataProcessor(),
        auth,
        disableSyncEnryption: !options?.enableSyncEncyption,
    })
    backgroundModules.customLists._createPage =
        backgroundModules.search.searchIndex.createTestPage
    backgroundModules.sync.initialSync.wrtc = wrtc
    backgroundModules.sync.initialSync.debug = false

    registerBackgroundModuleCollections(storageManager, backgroundModules)

    await storageManager.finishInitialization()

    const storageOperationLogger = new StorageOperationLogger({
        enabled: false,
    })
    const storageChangeDetector = new StorageChangeDetector({
        storageManager,
        toTrack: Object.keys(storageManager.registry.collections),
    })
    const storageOperationDebugger: StorageMiddleware = {
        async process(args) {
            const result = await args.next.process({
                operation: args.operation,
            })
            // console.log('STORAGE OPERATION - ', {
            //     operation: args.operation,
            //     result,
            // })
            return result
        },
    }

    await setStorageMiddleware(storageManager, {
        syncService: backgroundModules.sync,
        storexHub: backgroundModules.storexHub,
        contentSharing: backgroundModules.contentSharing,
        modifyMiddleware: (originalMiddleware) => [
            ...((options && options.customMiddleware) || []),
            ...(options && options.debugStorageOperations
                ? [storageOperationDebugger]
                : []),
            storageOperationLogger.asMiddleware(),
            ...originalMiddleware,
        ],
    })

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
        browserLocalStorage,
        storageOperationLogger,
        storageChangeDetector,
        authService,
        subscriptionService,
        getServerStorage,
    }
}

export function registerBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
) {
    describe(test.description, () => {
        it(
            'should work on a single device' + (test.mark ? '!!!' : ''),
            async () => {
                await runBackgroundIntegrationTest(test)
            },
        )
        if (process.env.SKIP_SYNC_TESTS !== 'true') {
            registerSyncBackgroundIntegrationTests(test)
        }
    })
}

export async function runBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
) {
    const setup = await setupBackgroundIntegrationTest({
        customMiddleware: [],
    })
    const testOptions = await test.instantiate({ isSyncTest: false })

    let changeDetectorUsed = false

    let stepIndex = -1
    for (const step of testOptions.steps) {
        stepIndex += 1

        if (step.preCheck) {
            await step.preCheck({ setup })
        }
        if (step.expectedStorageChanges && !changeDetectorUsed) {
            await setup.storageChangeDetector.capture()
            changeDetectorUsed = true
        }
        if (step.expectedStorageOperations) {
            setup.storageOperationLogger.enabled = true
        }

        await step.execute({ setup })
        setup.storageOperationLogger.enabled = false

        if (step.postCheck) {
            await step.postCheck({ setup })
        }
        if (step.expectedStorageOperations) {
            const executedOperations = setup.storageOperationLogger.popOperations()
            expect(executedOperations).toEqual(step.expectedStorageOperations())
        }
        if (step.expectedStorageChanges) {
            try {
                expect(await setup.storageChangeDetector.compare()).toEqual(
                    mapValues(step.expectedStorageChanges, (getChanges) =>
                        getChanges(),
                    ),
                )
            } catch (e) {
                console.error(
                    `Unexpected storage changes in step number ${
                        stepIndex + 1
                    } (counting from 1)`,
                )
                throw e
            }
        }
    }
}
