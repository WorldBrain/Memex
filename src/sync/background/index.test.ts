import uuid from 'uuid/v4'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import {
    lazyMemorySignalTransportFactory,
    createMemorySharedSyncLog,
} from './index.tests'
import { INCREMENTAL_SYNC_FREQUENCY } from './constants'
import SyncBackground from '.'
import { withEmulatedFirestoreBackend } from '@worldbrain/storex-backend-firestore/lib/index.tests'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { RUN_FIRESTORE_TESTS } from 'src/tests/constants'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { SYNC_STORAGE_AREA_KEYS } from '@worldbrain/memex-common/lib/sync/constants'
import { getStorageContents } from '@worldbrain/memex-common/lib/storage/utils'

interface TestSetup {
    setups: [BackgroundIntegrationTestSetup, BackgroundIntegrationTestSetup]
    forEachSetup: (
        f: (setup: BackgroundIntegrationTestSetup) => void,
    ) => Promise<void>
    syncModule: (
        setup: BackgroundIntegrationTestSetup,
    ) => BackgroundIntegrationTestSetup['backgroundModules']['sync']
    searchModule: (
        setup: BackgroundIntegrationTestSetup,
    ) => BackgroundIntegrationTestSetup['backgroundModules']['search']
    customLists: (
        setup: BackgroundIntegrationTestSetup,
    ) => BackgroundIntegrationTestSetup['backgroundModules']['customLists']['remoteFunctions']
    sharedSyncLog: SharedSyncLogStorage
    userId: number | string
}
export type TestFactory = (
    description: string,
    test: (setup: TestSetup) => void,
) => void

async function setupTest(options: {
    sharedSyncLog: SharedSyncLogStorage
    userId?: string
}): Promise<TestSetup> {
    const signalTransportFactory = lazyMemorySignalTransportFactory()
    const setups: [
        BackgroundIntegrationTestSetup,
        BackgroundIntegrationTestSetup
    ] = [
            await setupBackgroundIntegrationTest({
                signalTransportFactory,
                sharedSyncLog: options.sharedSyncLog,
            }),
            await setupBackgroundIntegrationTest({
                signalTransportFactory,
                sharedSyncLog: options.sharedSyncLog,
            }),
        ]
    const syncModule = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.sync
    const searchModule = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.search
    const customLists = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.customLists.remoteFunctions

    const userId: string = options.userId || uuid()
    const user: AuthenticatedUser = { ...TEST_USER, id: userId }
    setups[0].authService.setUser(user)
    setups[1].authService.setUser(user)

    const forEachSetup = async (
        f: (setup: BackgroundIntegrationTestSetup) => void,
    ) => {
        await Promise.all(setups.map(f))
    }

    return {
        setups,
        forEachSetup,
        syncModule,
        searchModule,
        customLists,
        sharedSyncLog: options.sharedSyncLog,
        userId,
    }
}

function syncModuleTests(options: { testFactory: TestFactory }) {
    const it = options.testFactory

    it('should not do anything if not enabled', async (setup: TestSetup) => {
        const { setups, syncModule, forEachSetup } = setup
        await forEachSetup(s => syncModule(s).setup())

        expect(syncModule(setups[0]).continuousSync.enabled).toBe(false)
        expect(syncModule(setups[0]).syncLoggingMiddleware.enabled).toBe(false)
        await setups[0].backgroundModules.customLists.createCustomList({
            name: 'My list',
        })
        expect(
            await syncModule(setups[0]).clientSyncLog.getEntriesCreatedAfter(0),
        ).toEqual([])
    })

    it('should do the whole onboarding flow correctly', async (setup: TestSetup) => {
        const {
            setups,
            customLists,
            syncModule,
            searchModule,
            forEachSetup,
        } = setup
        await forEachSetup(s => syncModule(s).setup())

        // Initial data

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.customLists.insertPageToList({
            id: listId,
            url: 'http://bla.com/',
        })
        await searchModule(setups[0]).searchIndex.addPage({
            pageDoc: {
                url: 'http://www.bla.com/',
                content: {
                    fullText: 'home page content',
                    title: 'bla.com title',
                },
            },
            visits: [],
        })

        // Initial sync

        const { initialMessage } = await syncModule(
            setups[0],
        ).remoteFunctions.requestInitialSync()
        await syncModule(setups[1]).remoteFunctions.answerInitialSync({
            initialMessage,
        })

        await forEachSetup(s => syncModule(s).initialSync.waitForInitialSync())

        expect(
            await customLists(setups[1]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'My list',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: ['http://bla.com/'],
            active: true,
        })

        // Set up device IDs

        await forEachSetup(s => syncModule(s).continuousSync.initDevice())

        const getDeviceId = async (s: BackgroundIntegrationTestSetup) =>
            (await s.browserLocalStorage.get(SYNC_STORAGE_AREA_KEYS.deviceId))[
            SYNC_STORAGE_AREA_KEYS.deviceId
            ]

        const firstDeviceId = await getDeviceId(setups[0])
        expect(firstDeviceId).toBeTruthy()

        const secondDeviceId = await getDeviceId(setups[1])
        expect(secondDeviceId).toBeTruthy()

        expect(firstDeviceId).not.toEqual(secondDeviceId)

        // Enable continuous sync

        await forEachSetup(async s => {
            await syncModule(s).remoteFunctions.enableContinuousSync()
            expectIncrementalSyncScheduled(syncModule(s), {
                when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
                margin: 50,
            })
        })

        // Force incremental sync from second device back to first

        await customLists(setups[1]).updateListName({
            id: listId,
            name: 'Updated List Title',
        })

        await syncModule(setups[1]).remoteFunctions.forceIncrementalSync()
        await syncModule(setups[0]).remoteFunctions.forceIncrementalSync()

        expect(
            await customLists(setups[0]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'Updated List Title',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: ['http://bla.com/'],
            active: true,
        })

        // Force incremental sync from first device to second

        await customLists(setups[0]).updateListName({
            id: listId,
            name: 'Another Updated List Title',
        })

        await syncModule(setups[0]).remoteFunctions.forceIncrementalSync()
        await syncModule(setups[1]).remoteFunctions.forceIncrementalSync()

        expect(
            await customLists(setups[1]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'Another Updated List Title',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: ['http://bla.com/'],
            active: true,
        })
    })

    it('should enable Sync on start up if enabled', async (setup: TestSetup) => {
        const {
            setups,
            forEachSetup,
            customLists,
            syncModule,
            sharedSyncLog,
            userId,
        } = setup

        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId }),
            await sharedSyncLog.createDeviceId({ userId }),
        ]

        await setups[0].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[0],
        })
        await setups[1].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[1],
        })

        await forEachSetup(s => syncModule(s).setup())
        await forEachSetup(s => syncModule(s).firstContinuousSyncPromise)
        await forEachSetup(
            s => (syncModule(s).continuousSync.useEncryption = false),
        )

        expectIncrementalSyncScheduled(syncModule(setups[0]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
        })
        expectIncrementalSyncScheduled(syncModule(setups[1]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
        })

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await setups[1].backgroundModules.sync.continuousSync.forceIncrementalSync()

        expect(
            await customLists(setups[1]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'My list',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: [],
            active: false,
        })
    })

    it('should sync on start up if enabled', async (setup: TestSetup) => {
        const { setups, customLists, syncModule, sharedSyncLog, userId } = setup
        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId }),
            await sharedSyncLog.createDeviceId({ userId }),
        ]

        await setups[0].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[0],
        })
        await setups[1].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[1],
        })

        await syncModule(setups[0]).setup()
        syncModule(setups[0]).continuousSync.useEncryption = false
        await syncModule(setups[0]).firstContinuousSyncPromise

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await syncModule(setups[1]).setup()
        syncModule(setups[1]).continuousSync.useEncryption = false
        await syncModule(setups[1]).firstContinuousSyncPromise

        expect(
            await customLists(setups[1]).fetchListById({
                id: listId,
            }),
        ).toEqual({
            id: listId,
            name: 'My list',
            isDeletable: true,
            isNestable: true,
            createdAt: expect.any(Date),
            pages: [],
            active: false,
        })
    })

    describe('passive data filtering in initial Sync', () => {
        async function runPassiveDataTest(params: {
            setup: TestSetup
            insertDefaultPages: boolean
            insertData: (
                params: {
                    device: BackgroundIntegrationTestSetup
                },
            ) => Promise<void>
            checkData: (
                params: {
                    device: BackgroundIntegrationTestSetup
                    expectData: (
                        collections: string[],
                        expacted: object,
                    ) => Promise<void>
                },
            ) => Promise<void>
        }) {
            const {
                setups,
                customLists,
                syncModule,
                searchModule,
                forEachSetup,
            } = params.setup

            await forEachSetup(s => syncModule(s).setup())

            if (params.insertDefaultPages) {
                await searchModule(setups[0]).searchIndex.addPage({
                    pageDoc: {
                        url: 'http://www.bla.com/',
                        content: {
                            fullText: 'home page content',
                            title: 'bla.com title',
                        },
                    },
                    visits: [],
                })
                await searchModule(setups[0]).searchIndex.addPage({
                    pageDoc: {
                        url: 'http://www.bla2.com/',
                        content: {
                            fullText: 'home page content',
                            title: 'bla2.com title',
                        },
                    },
                    visits: [],
                })
            }

            await params.insertData({ device: setups[0] })

            syncModule(setups[0]).initialSync.filterPassiveData = true
            const { initialMessage } = await syncModule(
                setups[0],
            ).remoteFunctions.requestInitialSync()
            await syncModule(setups[1]).remoteFunctions.answerInitialSync({
                initialMessage,
            })
            await syncModule(setups[1]).initialSync.waitForInitialSync()

            await params.checkData({
                device: setups[1],
                expectData: async (collections, expected) => {
                    const contents = await getStorageContents(
                        setups[1].storageManager,
                        { include: new Set(collections) },
                    )
                    expect(contents).toEqual(expected)
                },
            })
        }

        it('should not include pages in filtered initial Sync unless included in a custom list', async (setup: TestSetup) => {
            const { customLists } = setup

            await runPassiveDataTest({
                setup,
                insertDefaultPages: true,
                insertData: async ({ device }) => {
                    const listId = await customLists(device).createCustomList({
                        name: 'My list',
                    })
                    await customLists(device).insertPageToList({
                        id: listId,
                        url: 'http://bla.com/',
                    })
                },
                checkData: async ({ expectData }) => {
                    await expectData(
                        ['pages', 'customLists', 'pageListEntries'],
                        {
                            pages: [
                                expect.objectContaining({
                                    fullUrl: 'http://www.bla.com/',
                                }),
                            ],
                            customLists: [
                                expect.objectContaining({
                                    name: 'My list',
                                }),
                            ],
                            pageListEntries: [
                                expect.objectContaining({
                                    pageUrl: 'bla.com',
                                }),
                            ],
                        },
                    )
                },
            })
        })
    })
}

describe('SyncBackground', () => {
    describe('Memory backend', () => {
        syncModuleTests({
            testFactory: (description, test) => {
                it(description, async () => {
                    await test(
                        await setupTest({
                            sharedSyncLog: await createMemorySharedSyncLog(),
                        }),
                    )
                })
            },
        })
    })

    describe('Firestore backend', () => {
        syncModuleTests({
            testFactory: (description, test) => {
                if (!RUN_FIRESTORE_TESTS) {
                    it.skip(description, () => { })
                    return
                }

                it(description, async () => {
                    const userId = 'alice'
                    await withEmulatedFirestoreBackend(
                        {
                            sharedSyncLog: ({ storageManager }) =>
                                new SharedSyncLogStorage({
                                    storageManager,
                                    autoPkType: 'string',
                                    excludeTimestampChecks: false,
                                }) as any,
                        },
                        {
                            auth: { userId },
                            printProjectId: false,
                            loadRules: true,
                        },
                        async ({ storageManager, modules }) => {
                            const sharedSyncLog = modules.sharedSyncLog as SharedSyncLogStorage
                            await test(
                                await setupTest({
                                    sharedSyncLog,
                                    userId,
                                }),
                            )
                        },
                    )
                })
            },
        })
    })
})

function expectIncrementalSyncScheduled(
    sync: SyncBackground,
    options: { when: number; margin: number },
) {
    const recurringTask = sync.continuousSync.recurringIncrementalSyncTask
    expect(recurringTask).toBeTruthy()
    expect(recurringTask.aproximateNextRun).toBeTruthy()
    const difference = recurringTask.aproximateNextRun - options.when
    expect(difference).toBeLessThan(options.margin)
}
