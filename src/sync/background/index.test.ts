import uuid from 'uuid/v4'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import {
    lazyMemorySignalTransportFactory,
    createMemorySharedSyncLog,
} from './index.tests'
import { SYNC_STORAGE_AREA_KEYS, INCREMENTAL_SYNC_FREQUENCY } from './constants'
import SyncBackground from '.'
import { withEmulatedFirestoreBackend } from '@worldbrain/storex-backend-firestore/lib/index.tests'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import { RUN_FIRESTORE_TESTS } from 'src/tests/constants'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

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
    setups[0].mockAuthImplementation.setCurrentUserId('<TestUser:1>')
    setups[1].mockAuthImplementation.setCurrentUserId('<TestUser:2>')

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

        // Force incremental sync

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
        await syncModule(setups[0]).firstContinuousSyncPromise

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await syncModule(setups[1]).setup()
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
                    it.skip(description, () => {})
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
