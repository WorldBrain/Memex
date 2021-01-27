import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import expect from 'expect'
import fetchMock from 'fetch-mock'
const wrtc = require('wrtc')
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { SignalTransportFactory } from '@worldbrain/memex-common/lib/sync'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
} from 'src/background-script/setup'
import initStorex from '../search/memory-storex'
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
import { FakeAnalytics } from 'src/analytics/mock'
import AnalyticsManager from 'src/analytics/analytics'
import { setStorageMiddleware } from 'src/storage/middleware'
import { JobDefinition } from 'src/job-scheduler/background/types'
import { createLazyMemoryServerStorage } from 'src/storage/server'
import { ServerStorage } from 'src/storage/types'
import { Browser } from 'webextension-polyfill-ts'
import { TabManager } from 'src/tab-management/background/tab-manager'
import { createServices } from 'src/services'

fetchMock.restore()

export interface BackgroundIntegrationTestSetupOpts {
    customMiddleware?: StorageMiddleware[]
    tabManager?: TabManager
    signalTransportFactory?: SignalTransportFactory
    getServerStorage?: () => Promise<ServerStorage>
    browserLocalStorage?: MemoryBrowserStorage
    debugStorageOperations?: boolean
    includePostSyncProcessor?: boolean
    enableSyncEncyption?: boolean
}

export async function setupBackgroundIntegrationTest(
    options?: BackgroundIntegrationTestSetupOpts,
): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        ;(global as any)['URL'] = URL
    }

    // We want to allow tests to be able to override time
    let getTime = () => Date.now()
    const getNow = () => getTime()

    // We allow tests to control HTTP requests
    const fetch = fetchMock.sandbox()

    const browserLocalStorage =
        options?.browserLocalStorage ?? new MemoryBrowserStorage()
    const storageManager = initStorex()

    const getServerStorage =
        options?.getServerStorage ?? createLazyMemoryServerStorage()

    const services = await createServices({
        backend: 'memory',
        getServerStorage,
    })

    const auth: AuthBackground = new AuthBackground({
        authService: services.auth,
        subscriptionService: services.subscriptions,
        scheduleJob: (job: JobDefinition) => {
            console['info'](
                'Running job immediately while in testing, job:',
                job,
            )
            console['info'](`Ran job ${job.name} returned:`, job.job())
        },
        localStorageArea: browserLocalStorage,
        backendFunctions: {
            registerBetaUser: async () => {},
        },
        getUserManagement: async () =>
            (await getServerStorage()).storageModules.userManagement,
    })
    const analyticsManager = new AnalyticsManager({
        backend: new FakeAnalytics(),
        shouldTrack: async () => true,
    })

    const browserAPIs = ({
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
            query: () => [],
            get: () => null,
        },
        contextMenus: {
            create: () => {},
        },
        runtime: {
            getURL: () => '',
        },
        windows: {
            WINDOW_ID_CURRENT: 'currentWindow:testValue',
            TAB_ID_NONE: 'noneTab:testValue',
        },
    } as any) as Browser

    const fetchPageDataProcessor = options?.includePostSyncProcessor
        ? new MockFetchPageDataProcessor()
        : null

    const backgroundModules = createBackgroundModules({
        getNow,
        storageManager,
        analyticsManager,
        localStorageChangesManager: null,
        getServerStorage,
        browserAPIs,
        tabManager: options?.tabManager,
        signalTransportFactory: options?.signalTransportFactory,
        getSharedSyncLog: async () =>
            (await getServerStorage()).storageModules.sharedSyncLog,
        fetchPageDataProcessor,
        auth,
        disableSyncEnryption: !options?.enableSyncEncyption,
        services,
        fetch,
    })
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
        readwise: backgroundModules.readwise,
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
        authService: services.auth as MemoryAuthService,
        subscriptionService: services.subscriptions as MemorySubscriptionsService,
        getServerStorage,
        browserAPIs,
        fetchPageDataProcessor,
        injectTime: (injected) => (getTime = injected),
        fetch,
    }
}

export function registerBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
    options: BackgroundIntegrationTestSetupOpts = {},
) {
    const skipSyncTests = process.env.SKIP_SYNC_TESTS === 'true'
    if (skipSyncTests) {
        it(test.description, async () => {
            await runBackgroundIntegrationTest(test, options)
        })
    } else {
        describe(test.description, () => {
            it(
                'should work on a single device' + (test.mark ? '!!!' : ''),
                async () => {
                    await runBackgroundIntegrationTest(test, options)
                },
            )
            registerSyncBackgroundIntegrationTests(test, options)
        })
    }
}

export async function runBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
    options: BackgroundIntegrationTestSetupOpts = {},
) {
    const setup = await setupBackgroundIntegrationTest({
        customMiddleware: [],
        ...options,
    })
    const testOptions = await test.instantiate({ isSyncTest: false })
    testOptions.setup?.({ setup })

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
        const changes = changeDetectorUsed
            ? await setup.storageChangeDetector.compare()
            : undefined
        if (step.validateStorageChanges) {
            step.validateStorageChanges({ changes })
        }
        if (step.expectedStorageChanges) {
            try {
                expect(changes).toEqual(
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
