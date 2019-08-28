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
import { generateSyncPatterns } from 'src/util/tests/sync-patterns'

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
        autoPkType: 'int',
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
            steps: Array<(context: TestContext) => Promise<void> | void>
            onFinish?: (context: TestContext) => Promise<void> | void
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

            it('should work when synced in various patterns across 2 devices', async () => {
                const userId = 'user'

                const testOptions = await test()
                const syncPatterns = generateSyncPatterns(
                    [0, 1],
                    testOptions.steps.length,
                )
                for (const pattern of syncPatterns) {
                    const getReadablePattern = () =>
                        pattern.map(idx => (idx === 0 ? 'A' : 'B')).join('')

                    const setups = [await setupTest(), await setupTest()]

                    const sharedSyncLog = await setupSharedSyncLog()
                    const deviceIds = [
                        await sharedSyncLog.createDeviceId({
                            userId,
                            sharedUntil: 0,
                        }),
                        await sharedSyncLog.createDeviceId({
                            userId,
                            sharedUntil: 0,
                        }),
                    ]

                    const sync = async (
                        setup: TestSetup,
                        deviceId: number | string,
                    ) => {
                        try {
                            await doSync({
                                clientSyncLog: setup.clientSyncLog,
                                sharedSyncLog,
                                storageManager: setup.storageManager,
                                reconciler: reconcileSyncLog,
                                now: '$now',
                                userId,
                                deviceId,
                            })
                        } catch (e) {
                            console.error(
                                `ERROR: Sync failed for test '${description}', pattern '${getReadablePattern()}', step ${stepIndex}`,
                            )
                            throw e
                        }
                    }

                    let stepIndex = -1
                    for (const currentDeviceIndex of pattern) {
                        stepIndex += 1
                        const currentDeviceId = deviceIds[currentDeviceIndex]
                        const currentSetup = setups[currentDeviceIndex]

                        if (stepIndex > 0) {
                            await sync(currentSetup, currentDeviceId)
                        }

                        await testOptions.steps[stepIndex]({
                            setup: currentSetup,
                        })
                        await sync(currentSetup, currentDeviceId)
                    }

                    const lastSyncedDeviceIndex = pattern[pattern.length - 1]
                    const unsyncedDeviceIndex = (lastSyncedDeviceIndex + 1) % 2

                    await sync(
                        setups[unsyncedDeviceIndex],
                        deviceIds[unsyncedDeviceIndex],
                    )

                    if (testOptions.onFinish) {
                        await testOptions.onFinish({ setup: setups[0] })
                        await testOptions.onFinish({ setup: setups[1] })
                    }
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
