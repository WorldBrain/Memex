import { URL } from 'whatwg-url'
import expect from 'expect'
import StorageManager from '@worldbrain/storex'
import initStorex from '../search/memory-storex'
import { SyncLoggingMiddleware } from '@worldbrain/storex-sync/lib/logging-middleware'
import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { doSync } from '@worldbrain/storex-sync'
import {
    createBackgroundModules,
    registerBackgroundModuleCollections,
    BackgroundModules,
} from 'src/background-script/setup'
import { setStorex } from 'src/search/get-db'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'

interface TestSetup {
    storageManager: StorageManager
    backgroundModules: BackgroundModules
    clientSyncLog: ClientSyncLogStorage
}
interface TestContext {
    setup: TestSetup
}

async function setupTest(): Promise<TestSetup> {
    if (typeof window === 'undefined') {
        global['URL'] = URL
    }

    const storageManager = initStorex()
    const backgroundModules = createBackgroundModules({
        storageManager,
        browserAPIs: {
            storage: {
                local: new MemoryLocalStorage(),
            },
            bookmarks: {
                onCreated: { addListener: () => {} },
                onRemoved: { addListener: () => {} },
            },
        } as any,
    })
    registerBackgroundModuleCollections(storageManager, backgroundModules)
    const clientSyncLog = new ClientSyncLogStorage({ storageManager })
    registerModuleMapCollections(storageManager.registry, {
        clientSyncLog,
    })

    await storageManager.finishInitialization()

    const syncLoggingMiddleware = new SyncLoggingMiddleware({
        storageManager,
        clientSyncLog,
        includeCollections: ['customLists', 'pageListEntries'],
    })
    storageManager.setMiddleware([syncLoggingMiddleware])

    setStorex(storageManager)

    return {
        storageManager,
        backgroundModules,
        clientSyncLog,
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
    })
    registerModuleMapCollections(sharedStorageManager.registry, {
        sharedSyncLog,
    })
    await sharedStorageManager.finishInitialization()
    return sharedSyncLog
}

describe('Sync integration tests', () => {
    // const it = makeTestFactory()

    function integrationTest(
        description: string,
        test: () => {
            steps: Array<
                (context: { setup: TestSetup }) => Promise<void> | void
            >
            onFinish?: (context: { setup: TestSetup }) => Promise<void> | void
        },
    ) {
        describe(description, () => {
            it('should work on a single device', async () => {
                const setup = await setupTest()
                const testOptions = await test()
                for (const step of testOptions.steps) {
                    await step({ setup })
                }
                if (testOptions.onFinish) {
                    testOptions.onFinish({ setup })
                }
            })

            it('should work when synced step by step across two devices in pattern ABABAB...', async () => {
                const userId = 'user'

                const firstSetup = await setupTest()
                const secondSetup = await setupTest()
                const sharedSyncLog = await setupSharedSyncLog()
                const firstDeviceId = await sharedSyncLog.createDeviceId({
                    userId,
                    sharedUntil: 0,
                })
                const secondDeviceId = await sharedSyncLog.createDeviceId({
                    userId,
                    sharedUntil: 0,
                })

                const sync = async (
                    setup: TestSetup,
                    deviceId: number | string,
                ) => {
                    await doSync({
                        clientSyncLog: setup.clientSyncLog,
                        sharedSyncLog,
                        storageManager: setup.storageManager,
                        reconciler: reconcileSyncLog,
                        now: Date.now(),
                        userId,
                        deviceId,
                    })
                }

                const testOptions = await test()
                for (const [stepIndexAsString, step] of Object.entries(
                    testOptions.steps,
                )) {
                    const stepIndex = parseInt(stepIndexAsString, 10)
                    const currentSetup =
                        stepIndex % 2 === 0 ? firstSetup : secondSetup
                    const deviceId =
                        stepIndex % 2 === 0 ? firstDeviceId : secondDeviceId

                    if (stepIndex > 0) {
                        await sync(currentSetup, deviceId)
                    }
                    await step({ setup: currentSetup })
                    await sync(currentSetup, deviceId)
                }

                const lastSyncedDeviceId =
                    testOptions.steps.length % 2 === 0
                        ? secondDeviceId
                        : firstDeviceId
                const unsyncedDeviceId =
                    lastSyncedDeviceId === firstDeviceId
                        ? secondDeviceId
                        : firstDeviceId
                await sync(
                    unsyncedDeviceId === firstDeviceId
                        ? firstSetup
                        : secondSetup,
                    unsyncedDeviceId,
                )

                if (testOptions.onFinish) {
                    await testOptions.onFinish({ setup: firstSetup })
                    await testOptions.onFinish({ setup: secondSetup })
                }
            })
        })
    }

    integrationTest(
        'should create a list, edit its title and retrieve it',
        () => {
            const customLists = (setup: TestSetup) =>
                setup.backgroundModules.customLists
            let listId!: number
            return {
                steps: [
                    async ({ setup }) => {
                        listId = await customLists(setup).createCustomList({
                            name: 'My Custom List',
                        })
                    },
                    ({ setup }) =>
                        customLists(setup).insertPageToList({
                            id: listId,
                            url: 'http://www.bla.com/',
                        }),
                    ({ setup }) =>
                        customLists(setup).updateList({
                            id: listId,
                            name: 'Updated List Title',
                        }),
                ],
                onFinish: async ({ setup }) => {
                    expect(
                        await customLists(setup).fetchListById({ id: listId }),
                    ).toEqual({
                        id: expect.any(Number),
                        name: 'Updated List Title',
                        isDeletable: true,
                        isNestable: true,
                        createdAt: expect.any(Date),
                        pages: ['http://www.bla.com/'],
                        active: true,
                    })
                },
            }
        },
    )
})
