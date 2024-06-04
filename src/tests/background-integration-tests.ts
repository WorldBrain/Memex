import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import expect from 'expect'
import fetchMock from 'fetch-mock'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
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
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { FakeAnalytics } from 'src/analytics/mock'
import AnalyticsManager from 'src/analytics/analytics'
import { setStorageMiddleware } from 'src/storage/middleware'
import { createMemoryServerStorage } from 'src/storage/server.tests'
import { ServerStorage } from 'src/storage/types'
import { Browser } from 'webextension-polyfill'
import { createServices } from 'src/services'
import {
    PersonalCloudBackend,
    PersonalCloudMediaBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { createPersistentStorageManager } from 'src/storage/persistent-storage'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { ContentSharingBackend } from '@worldbrain/memex-common/lib/content-sharing/backend'
import {
    PersonalCloudHub,
    StorexPersonalCloudBackend,
    StorexPersonalCloudMediaBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { clearRemotelyCallableFunctions } from 'src/util/webextensionRPC'
import { AuthServices, Services } from 'src/services/types'
import { PersonalDeviceType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { createAuthServices } from 'src/services/local-services'
import { MockPushMessagingService } from './push-messaging'
import type { PageDataResult } from '@worldbrain/memex-common/lib/page-indexing/fetch-page-data/types'
import type { ExtractedPDFData } from 'src/search'
import { CloudflareImageSupportBackend } from '@worldbrain/memex-common/lib/image-support/backend'
import type {
    ExceptionCapturer,
    FunctionsConfigGetter,
} from '@worldbrain/memex-common/lib/firebase-backend/types'

export const DEF_PAGE = {
    url: 'test.com',
    domain: 'test.com',
    hostname: 'test.com',
    fullTitle: 'Test',
    fullUrl: 'http://test.com',
    tags: [],
    terms: [],
    urlTerms: [],
    titleTerms: [],
    text: 'test',
}

fetchMock.restore()
export interface BackgroundIntegrationTestSetupOpts {
    customMiddleware?: StorageMiddleware[]
    serverStorage?: ServerStorage
    fetchPageData?: (fullPageUrl: string) => Promise<PageDataResult>
    fetchPdfData?: (fullPageUrl: string) => Promise<ExtractedPDFData>
    personalCloudBackend?: PersonalCloudBackend
    personalCloudMediaBackend?: PersonalCloudMediaBackend
    browserLocalStorage?: MemoryBrowserStorage
    debugStorageOperations?: boolean
    enableSyncEncyption?: boolean
    startWithSyncDisabled?: boolean
    useDownloadTranslationLayer?: boolean
    services?: Services
    pushMessagingService?: MockPushMessagingService
    authServices?: AuthServices
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

    const serverStorage =
        options?.serverStorage ?? (await createMemoryServerStorage())

    const authServices =
        options?.authServices ??
        createAuthServices({
            backend: 'memory',
        })
    const services =
        options?.services ??
        createServices({
            backend: 'memory',
            serverStorage,
            authService: authServices.auth,
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
            create: () => null,
            clear: () => null,
        },
        tabs: {
            query: () => [],
            get: () => null,
            onUpdated: { addListener: () => {} },
            onRemoved: { addListener: () => {} },
        },
        contextMenus: {
            create: () => {},
            update: () => {},
            onClicked: { addListener: () => {} },
        },
        runtime: {
            getURL: () => '',
            onStartup: { addListener: () => {} },
            onMessage: { addListener: () => {} },
            onMessageExternal: { addListener: () => {} },
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

    const analyticsManager = new AnalyticsManager({
        backend: new FakeAnalytics(),
        shouldTrack: async () => true,
    })

    let callFirebaseFunction = async (name: string, ...args: any[]) => {
        console.error(
            `Tried to call Firebase function, but no mock was for that`,
        )
    }

    // TODO: Move these defaults somewhere - find a more elegant way of handling data fetch in tests
    const fetchPDFData =
        options?.fetchPdfData ??
        (async (url) => ({
            fullText: DEF_PAGE.text,
            title: DEF_PAGE.fullTitle,
            pdfPageTexts: [DEF_PAGE.text],
            pdfMetadata: {
                fingerprints: ['test-fingerprint'],
                memexIncludedPages: 1,
                memexTotalPages: 1,
            },
        }))
    const fetchPageData =
        options?.fetchPageData ??
        (async (url) => ({
            content: {
                canonicalUrl: DEF_PAGE.fullUrl,
                fullText: DEF_PAGE.text,
                title: DEF_PAGE.fullTitle,
            },
        }))

    const getConfig: FunctionsConfigGetter = () => ({
        content_sharing: { opengraph_app_id: 'test-og-app-id' },
        deployment: { environment: 'staging' },
    })
    const captureException: ExceptionCapturer = async (err) => {
        console.warn('Got error in content sharing backend', err.message)
    }

    const pushMessagingService =
        options?.pushMessagingService ?? new MockPushMessagingService()
    let nextServerId = 1337
    // const userMessages = new MemoryUserMessageService()
    const getUserId = async () =>
        (await backgroundModules.auth.authService.getCurrentUser())?.id
    const personalCloudHub = new PersonalCloudHub()
    const backgroundModules = createBackgroundModules({
        manifestVersion: '3',
        getNow,
        storageManager,
        persistentStorageManager,
        analyticsManager,
        localStorageChangesManager: null,
        captureException,
        serverStorage,
        browserAPIs,
        services,
        authServices,
        fetch,
        // userMessageService: userMessages,
        callFirebaseFunction: async (name, ...args) => {
            return callFirebaseFunction(name, ...args) as any
        },
        personalCloudMediaBackend:
            options?.personalCloudMediaBackend ??
            new StorexPersonalCloudMediaBackend({
                getNow,
                getUserId,
                storageManager: serverStorage.manager,
                view: personalCloudHub.getView(),
            }),
        personalCloudBackend:
            options?.personalCloudBackend ??
            new StorexPersonalCloudBackend({
                fetch: fetch as any,
                getNow,
                getConfig,
                getUserId,
                services: {
                    activityStreams: services.activityStreams,
                    pushMessaging: new MockPushMessagingService(),
                },
                storageManager: serverStorage.manager,
                storageModules: serverStorage.modules,
                clientSchemaVersion: STORAGE_VERSIONS[38].version,
                view: personalCloudHub.getView(),
                useDownloadTranslationLayer:
                    options?.useDownloadTranslationLayer ?? true,
                getDeviceId: async () =>
                    backgroundModules.personalCloud.options.settingStore.get(
                        'deviceId',
                    ),
                clientDeviceType: PersonalDeviceType.DesktopBrowser,
                captureException,
            }),
        contentSharingBackend: new ContentSharingBackend({
            fetch: fetch as any,
            normalizeUrl,
            fetchPDFData,
            secretPlainText: 'test-secret',
            storageManager: serverStorage.manager,
            storageModules: serverStorage.modules,
            sendPrivateListEmailInvite: async (emailAddress, details) => ({
                status: 'failure',
            }),
            fbAuth: () => ({
                getUser: async () => null,
                getUsers: async () => ({ users: [], notFound: [] }),
            }),
            getConfig,
            captureException,
            getCurrentUserId: getUserId,
            services: { pushMessaging: pushMessagingService },
        }),
        generateServerId: () => nextServerId++,
        fetchPageData,
        fetchPDFData,
        imageSupportBackend: new CloudflareImageSupportBackend({
            env:
                process.env.NODE_ENV === 'production'
                    ? 'production'
                    : 'staging',
        }),
        backendEnv:
            process.env.NODE_ENV === 'production' ? 'production' : 'staging',
    })

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

    setStorageMiddleware(storageManager, backgroundModules, {
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
        pushMessagingService,
        persistentStorageManager,
        backgroundModules,
        browserLocalStorage,
        storageOperationLogger,
        storageChangeDetector,
        authService: authServices.auth as MemoryAuthService,
        subscriptionService: authServices.subscriptions as MemorySubscriptionsService,
        serverStorage,
        browserAPIs,
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
        await runBackgroundIntegrationTest(test, {
            ...options,
            ...(test.customTestOpts ?? {}),
        })
    })
    const skipSyncTests = process.env.SKIP_SYNC_TESTS === 'true'
    if (!skipSyncTests && !test.skipSyncTests) {
        registerSyncBackgroundIntegrationTests(test, {
            ...options,
            ...(test.customTestOpts ?? {}),
        })
    }
}

export async function runBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
    options: BackgroundIntegrationTestSetupOpts = {},
) {
    const testOptions = test.instantiate({ isSyncTest: false })
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
