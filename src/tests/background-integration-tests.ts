import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import expect from 'expect'
import fetchMock from 'fetch-mock'
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
import { registerSyncBackgroundIntegrationTests } from 'src/personal-cloud/background/index.tests'
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
import { MemoryUserMessageService } from '@worldbrain/memex-common/lib/user-messages/service/memory'
import { PersonalCloudBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { NullPersonalCloudBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/null'
import { createPersistentStorageManager } from 'src/storage/persistent-storage'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import {
    PersonalCloudHub,
    StorexPersonalCloudBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { clearRemotelyCallableFunctions } from 'src/util/webextensionRPC'
import { Services } from 'src/services/types'
import { PersonalDeviceType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

fetchMock.restore()

export interface BackgroundIntegrationTestSetupOpts {
    customMiddleware?: StorageMiddleware[]
    tabManager?: TabManager
    signalTransportFactory?: SignalTransportFactory
    getServerStorage?: () => Promise<ServerStorage>
    personalCloudBackend?: PersonalCloudBackend
    browserLocalStorage?: MemoryBrowserStorage
    debugStorageOperations?: boolean
    includePostSyncProcessor?: boolean
    enableSyncEncyption?: boolean
    startWithSyncDisabled?: boolean
    useDownloadTranslationLayer?: boolean
    services?: Services
}

export async function setupBackgroundIntegrationTest(
    options?: BackgroundIntegrationTestSetupOpts,
): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        ;(global as any)['URL'] = URL
    }

    clearRemotelyCallableFunctions()

    // We want to allow tests to be able to override time
    let getTime = () => Date.now()
    const getNow = () => getTime()

    // We allow tests to control HTTP requests
    const fetch = fetchMock.sandbox()

    const browserLocalStorage =
        options?.browserLocalStorage ?? new MemoryBrowserStorage()
    const storageManager = initStorex()
    const persistentStorageManager = createPersistentStorageManager({
        idbImplementation: inMemory(),
    })

    const getServerStorage =
        options?.getServerStorage ?? createLazyMemoryServerStorage()
    const serverStorage = await getServerStorage()

    const services =
        options?.services ??
        (await createServices({
            backend: 'memory',
            getServerStorage,
        }))

    const auth: AuthBackground = new AuthBackground({
        authService: services.auth,
        subscriptionService: services.subscriptions,
        remoteEmitter: { emit: async () => {} },
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
        extension: {
            getURL: () => '',
        },
        windows: {
            WINDOW_ID_CURRENT: 'currentWindow:testValue',
            TAB_ID_NONE: 'noneTab:testValue',
        },
        webRequest: {
            onBeforeRequest: {
                addListener: () => {},
            },
        },
    } as any) as Browser

    const fetchPageDataProcessor = options?.includePostSyncProcessor
        ? new MockFetchPageDataProcessor()
        : null

    let callFirebaseFunction = async (name: string, ...args: any[]) => {
        throw new Error(
            `Tried to call Firebase function, but no mock was for that`,
        )
    }

    let nextServerId = 1337
    const userMessages = new MemoryUserMessageService()
    const backgroundModules = createBackgroundModules({
        getNow,
        storageManager,
        persistentStorageManager,
        analyticsManager,
        localStorageChangesManager: null,
        getServerStorage,
        browserAPIs,
        tabManager: options?.tabManager,
        signalTransportFactory: options?.signalTransportFactory,
        fetchPageDataProcessor,
        auth,
        disableSyncEnryption: !options?.enableSyncEncyption,
        services,
        fetch,
        userMessageService: userMessages,
        callFirebaseFunction: (name, ...args) => {
            return callFirebaseFunction(name, ...args)
        },
        personalCloudBackend:
            options?.personalCloudBackend ??
            new StorexPersonalCloudBackend({
                storageManager: serverStorage.storageManager,
                storageModules: serverStorage.storageModules,
                services,
                clientSchemaVersion: STORAGE_VERSIONS[25].version,
                view: new PersonalCloudHub().getView(),
                getUserId: async () =>
                    (await backgroundModules.auth.authService.getCurrentUser())
                        ?.id,
                getNow,
                useDownloadTranslationLayer:
                    options?.useDownloadTranslationLayer ?? true,
                getDeviceId: async () =>
                    backgroundModules.personalCloud.deviceId,
                clientDeviceType: PersonalDeviceType.DesktopBrowser,
            }),
        contentSharingBackend: new ContentSharingBackend({
            storageManager: serverStorage.storageManager,
            activityFollows: serverStorage.storageModules.activityFollows,
            contentSharing: serverStorage.storageModules.contentSharing,
            getCurrentUserId: async () =>
                (await auth.authService.getCurrentUser()).id,
            userMessages,
        }),
        generateServerId: () => nextServerId++,
    })
    backgroundModules.sync.initialSync.debug = false

    registerBackgroundModuleCollections({
        storageManager,
        persistentStorageManager,
        backgroundModules,
    })

    await storageManager.finishInitialization()
    await persistentStorageManager.finishInitialization()

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
        storexHub: backgroundModules.storexHub,
        contentSharing: backgroundModules.contentSharing,
        personalCloud: backgroundModules.personalCloud,
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
        persistentStorageManager,
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
        services,
        injectCallFirebaseFunction: (injected) => {
            callFirebaseFunction = injected
        },
        fetch,
    }
}

export function registerBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
    options: BackgroundIntegrationTestSetupOpts = {},
) {
    it(test.description + ' - single device', async () => {
        await runBackgroundIntegrationTest(test, options)
    })
    const skipSyncTests = process.env.SKIP_SYNC_TESTS === 'true'
    if (!skipSyncTests && !test.skipSyncTests) {
        registerSyncBackgroundIntegrationTests(test, options)
    }
}

export async function runBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
    options: BackgroundIntegrationTestSetupOpts = {},
) {
    const testOptions = await test.instantiate({ isSyncTest: false })
    const setupOptions: BackgroundIntegrationTestSetupOpts = {
        customMiddleware: [],
        ...options,
        ...(testOptions.getSetupOptions?.() ?? {}),
    }
    const setup = await setupBackgroundIntegrationTest(setupOptions)
    await testOptions.setup?.({ setup })

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
        // if (step.expectedStorageOperations) {
        //     setup.storageOperationLogger.enabled = true
        // }

        await step.execute({ setup })
        setup.storageOperationLogger.enabled = false

        if (step.postCheck) {
            await step.postCheck({ setup })
        }
        // if (step.expectedStorageOperations) {
        //     const executedOperations = setup.storageOperationLogger.popOperations()
        //     expect(executedOperations).toEqual(step.expectedStorageOperations())
        // }
        const changes = changeDetectorUsed
            ? await setup.storageChangeDetector.compare()
            : undefined
        if (changes) {
            delete changes.personalCloudAction
        }

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
