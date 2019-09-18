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

    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: {
            storage: {
                local: browserLocalStorage,
            },
            bookmarks: {
                onCreated: { addListener: () => { } },
                onRemoved: { addListener: () => { } },
            },
        } as any,
        tabManager: options && options.tabManager,
        authBackground: {
            userId: 1,
            getCurrentUser: () => ({ id: 1 }),
        },
        signalTransportFactory: options && options.signalTransportFactory,
        sharedSyncLog: options && options.sharedSyncLog,
    })
    backgroundModules.customLists._createPage =
        backgroundModules.search.searchIndex.createTestPage
    backgroundModules.sync.initialSync.wrtc = wrtc

    registerBackgroundModuleCollections(storageManager, backgroundModules)

    await storageManager.finishInitialization()

    if (needsSync) {
        storageManager.setMiddleware([
            ...((options && options.customMiddleware) || []),
            await backgroundModules.sync.createSyncLoggingMiddleware(),
        ])
    }

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
        browserLocalStorage,
    }
}

export function registerBackgroundIntegrationTest(
    test: BackgroundIntegrationTest,
) {
    it(test.description, async () => {
        const storageOperationLogger = new StorageOperationLogger({
            enabled: false,
        })
        const setup = await setupBackgroundIntegrationTest({
            customMiddleware: [storageOperationLogger.asMiddleware()],
        })
        const testOptions = await test.instantiate()

        const changeDetector = new StorageChangeDetector({
            storageManager: setup.storageManager,
            toTrack: Object.keys(setup.storageManager.registry.collections),
        })
        let changeDetectorUsed = false

        let stepIndex = -1
        for (const step of testOptions.steps) {
            stepIndex += 1

            if (step.preCheck) {
                await step.preCheck({ setup })
            }
            if (step.expectedStorageChanges && !changeDetectorUsed) {
                await changeDetector.capture()
                changeDetectorUsed = true
            }
            if (step.expectedStorageOperations) {
                storageOperationLogger.enabled = true
            }

            await step.execute({ setup })
            storageOperationLogger.enabled = false

            if (step.postCheck) {
                await step.postCheck({ setup })
            }
            if (step.expectedStorageOperations) {
                const executedOperations = storageOperationLogger.popOperations()
                expect(executedOperations).toEqual(
                    step.expectedStorageOperations(),
                )
            }
            if (step.expectedStorageChanges) {
                try {
                    expect(await changeDetector.compare()).toEqual(
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
    })
}
