import mapValues from 'lodash/mapValues'
import { URL } from 'whatwg-url'
import StorageManager from '@worldbrain/storex'
import expect from 'expect'
import initStorex from '../search/memory-storex'
// import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'
// import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
} from 'src/background-script/setup'
import { setStorex } from 'src/search/get-db'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import {
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTest,
} from './integration-tests'
import { StorageChangeDetector } from './storage-change-detector'
import { TabManager } from 'src/activity-logger/background'
import StorageOperationLogger from './storage-operation-logger'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'

export async function setupBackgroundIntegrationTest(options?: {
    customMiddleware?: StorageMiddleware[]
    tabManager?: TabManager
}): Promise<BackgroundIntegrationTestSetup> {
    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const storageManager = initStorex({
        customMiddleware: options && options.customMiddleware,
    })
    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: {
            storage: {
                local: new MemoryLocalStorage(),
            },
            bookmarks: {
                onCreated: { addListener: () => { } },
                onRemoved: { addListener: () => { } },
            },
        } as any,
        tabManager: options && options.tabManager,
    })
    backgroundModules.customLists._createPage =
        backgroundModules.search.searchIndex.createTestPage
    registerBackgroundModuleCollections(storageManager, backgroundModules)
    // const clientSyncLog = new ClientSyncLogStorage({ storageManager })
    // registerModuleMapCollections(storageManager.registry, {
    //     clientSyncLog,
    // })

    await storageManager.finishInitialization()

    // const syncLoggingMiddleware = new SyncLoggingMiddleware({
    //     storageManager,
    //     clientSyncLog,
    //     includeCollections: ['customLists', 'pageListEntries'],
    // })
    // storageManager.setMiddleware([syncLoggingMiddleware])

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
    }
}

async function setupSharedSyncLog() {
    const sharedStorageManager = new StorageManager({
        backend: new DexieStorageBackend({
            dbName: 'shared',
            idbImplementation: inMemory(),
        }),
    })
    const sharedSyncLog = new SharedSyncLogStorage({
        storageManager: sharedStorageManager,
        autoPkType: 'int',
    })
    registerModuleMapCollections(sharedStorageManager.registry, {
        sharedSyncLog,
    })
    await sharedStorageManager.finishInitialization()
    return sharedSyncLog
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
