import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import {
    lazyMemorySignalTransportFactory,
    createMemorySharedSyncLog,
} from './index.tests'
import { SYNC_STORAGE_AREA_KEYS, INCREMENTAL_SYNC_FREQUENCY } from './constants'
import SyncBackground from '.'

async function setupTest() {
    const signalTransportFactory = lazyMemorySignalTransportFactory()
    const sharedSyncLog = await createMemorySharedSyncLog()
    const setups = [
        await setupBackgroundIntegrationTest({
            signalTransportFactory,
            sharedSyncLog,
        }),
        await setupBackgroundIntegrationTest({
            signalTransportFactory,
            sharedSyncLog,
        }),
    ]
    const syncModule = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.sync
    const searchModule = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.search
    const customLists = (setup: BackgroundIntegrationTestSetup) =>
        setup.backgroundModules.customLists.remoteFunctions

    return { setups, syncModule, searchModule, customLists, sharedSyncLog }
}

describe('SyncBackground', () => {
    it('should not do anything if not enabled', async () => {
        const { setups, syncModule } = await setupTest()
        await syncModule(setups[0]).setup()
        await syncModule(setups[1]).setup()

        expect(syncModule(setups[0]).continuousSync.enabled).toBe(false)
        expect(syncModule(setups[0]).syncLoggingMiddleware.enabled).toBe(false)
        await setups[0].backgroundModules.customLists.createCustomList({
            name: 'My list',
        })
        expect(
            await syncModule(setups[0]).clientSyncLog.getEntriesCreatedAfter(0),
        ).toEqual([])
    })

    it('should do the whole onboarding flow correctly', async () => {
        const {
            setups,
            customLists,
            syncModule,
            searchModule,
        } = await setupTest()

        await syncModule(setups[0]).setup()
        await syncModule(setups[1]).setup()

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

        await syncModule(setups[0]).initialSync.waitForInitialSync()
        await syncModule(setups[1]).initialSync.waitForInitialSync()

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

        await syncModule(setups[0]).continuousSync.initDevice()
        await syncModule(setups[1]).continuousSync.initDevice()

        const getDeviceId = async (setup: BackgroundIntegrationTestSetup) =>
            (await setup.browserLocalStorage.get(
                SYNC_STORAGE_AREA_KEYS.deviceId,
            ))[SYNC_STORAGE_AREA_KEYS.deviceId]

        const firstDeviceId = await getDeviceId(setups[0])
        expect(firstDeviceId).toBeTruthy()

        const secondDeviceId = await getDeviceId(setups[1])
        expect(secondDeviceId).toBeTruthy()

        expect(firstDeviceId).not.toEqual(secondDeviceId)

        // Enable continuous sync

        await syncModule(setups[0]).remoteFunctions.enableContinuousSync()
        expectIncrementalSyncScheduled(syncModule(setups[0]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
        })

        await syncModule(setups[1]).remoteFunctions.enableContinuousSync()
        expectIncrementalSyncScheduled(syncModule(setups[1]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
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

    it('should enable Sync on start up if enabled', async () => {
        const {
            setups,
            customLists,
            syncModule,
            sharedSyncLog,
        } = await setupTest()
        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId: 1 }),
            await sharedSyncLog.createDeviceId({ userId: 1 }),
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
        await syncModule(setups[1]).setup()
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

    it('should sync on start up if enabled', async () => {
        const {
            setups,
            customLists,
            syncModule,
            sharedSyncLog,
        } = await setupTest()
        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId: 1 }),
            await sharedSyncLog.createDeviceId({ userId: 1 }),
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

        const listId = await setups[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await setups[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await syncModule(setups[1]).setup()

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
