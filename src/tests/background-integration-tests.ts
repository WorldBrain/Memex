import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import expect from 'expect'
const wrtc = require('wrtc')
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
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
import { SignalTransportFactory } from 'src/sync/background/initial-sync'
import { StorageChangeDetector } from './storage-change-detector'
import StorageOperationLogger from './storage-operation-logger'
import { setStorex } from 'src/search/get-db'
import { registerSyncBackgroundIntegrationTests } from 'src/sync/index.tests'
import { AuthBackground } from 'src/authentication/background/auth-background'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'
import { AuthService } from 'src/authentication/background/auth-service'

export async function setupBackgroundIntegrationTest(options?: {
    customMiddleware?: StorageMiddleware[]
    tabManager?: TabManager
    signalTransportFactory?: SignalTransportFactory
    sharedSyncLog?: SharedSyncLog
    browserLocalStorage?: MemoryBrowserStorage
}): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const needsSync = !!(options && options.sharedSyncLog)

    const browserLocalStorage =
        (options && options.browserLocalStorage) || new MemoryBrowserStorage()
    const storageManager = initStorex()

    const mockAuthImplementation = new MockAuthImplementation()
    const authBackground: AuthBackground = new AuthBackground(
        new AuthService(mockAuthImplementation),
        {
            getCheckoutLink: async () => '',
            getManageLink: async () => '',
        },
        {
            refreshUserClaims: async () => true,
            getCustomLoginToken: async () => '',
        },
    )

    const backgroundModules = createBackgroundModules({
        storageManager,
        localStorageChangesManager: null,
        browserAPIs: {
            storage: {
                local: browserLocalStorage,
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
        } as any,
        tabManager: options && options.tabManager,
        signalTransportFactory: options && options.signalTransportFactory,
        getSharedSyncLog: async () => options && options.sharedSyncLog,
    })
    backgroundModules.customLists._createPage =
        backgroundModules.search.searchIndex.createTestPage
    backgroundModules.sync.initialSync.wrtc = wrtc
    backgroundModules.auth = authBackground

    registerBackgroundModuleCollections(storageManager, backgroundModules)

    await storageManager.finishInitialization()

    const storageOperationLogger = new StorageOperationLogger({
        enabled: false,
    })
    const storageChangeDetector = new StorageChangeDetector({
        storageManager,
        toTrack: Object.keys(storageManager.registry.collections),
    })

    const middleware: StorageMiddleware[] = [
        ...((options && options.customMiddleware) || []),
        storageOperationLogger.asMiddleware(),
        await backgroundModules.sync.createSyncLoggingMiddleware(),
    ]
    storageManager.setMiddleware(middleware)

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
        browserLocalStorage,
        storageOperationLogger,
        storageChangeDetector,
        mockAuthImplementation,
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
        registerSyncBackgroundIntegrationTests(test)
    })
}

export async function runBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
) {
    const setup = await setupBackgroundIntegrationTest({
        customMiddleware: [],
    })
    const testOptions = await test.instantiate()

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
                    mapValues(step.expectedStorageChanges, getChanges =>
                        getChanges(),
                    ),
                )
            } catch (e) {
                console.error(
                    `Unexpected storage changes in step number ${stepIndex +
                        1} (counting from 1)`,
                )
                throw e
            }
        }
    }
}
