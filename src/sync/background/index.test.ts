import fromPairs from 'lodash/fromPairs'
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
import {
    SYNC_STORAGE_AREA_KEYS,
    SYNCED_COLLECTIONS,
} from '@worldbrain/memex-common/lib/sync/constants'
import {
    getStorageContents,
    isTermsField,
    StorageContents,
} from '@worldbrain/memex-common/lib/storage/utils'
import { insertIntegrationTestData } from 'src/tests/shared-fixtures/integration'
import {
    MobileIntegrationTestSetup,
    setupMobileIntegrationTest,
} from 'src/tests/mobile-intergration-tests'
import { MemexInitialSync } from '@worldbrain/memex-common/lib/sync'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

const registerTest = it

interface TestDependencies {
    sharedSyncLog: SharedSyncLogStorage
    userId?: string
}
type WithTestDependencies = (
    callback: (depenendencies: TestDependencies) => Promise<void>,
) => Promise<void>

function makeTestFactory<TestSetup>(options: {
    skip?: boolean
    withDependencies: WithTestDependencies
    setupTest: (dependencies: TestDependencies) => Promise<TestSetup>
}) {
    return (description: string, test: (setup: TestSetup) => Promise<void>) => {
        ;(options.skip ? registerTest.skip : registerTest)(
            description,
            async () => {
                await options.withDependencies(async dependencies => {
                    await test(await options.setupTest(dependencies))
                })
            },
        )
    }
}

async function doInitialSync(devices: {
    source: { initialSync: MemexInitialSync }
    target: { initialSync: MemexInitialSync }
}) {
    const {
        initialMessage,
    } = await devices.source.initialSync.requestInitialSync()
    await devices.target.initialSync.answerInitialSync({
        initialMessage,
    })
    await devices.target.initialSync.waitForInitialSync()
    await devices.source.initialSync.waitForInitialSync()
}

function extensionSyncTests(suiteOptions: {
    withDependencies: WithTestDependencies
    skip?: boolean
}) {
    interface TestSetup {
        devices: [
            BackgroundIntegrationTestSetup,
            BackgroundIntegrationTestSetup
        ]
        forEachDevice: (
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

    const expectedDeviceInfo = [
        {
            createdWhen: expect.any(Number),
            deviceId: '1',
            productType: 'ext',
            devicePlatform: 'browser',
        },
        {
            createdWhen: expect.any(Number),
            deviceId: '2',
            productType: 'ext',
            devicePlatform: 'browser',
        },
    ]

    async function setupTest(options: TestDependencies): Promise<TestSetup> {
        const signalTransportFactory = lazyMemorySignalTransportFactory()
        const devices: [
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

        const forEachDevice = async (
            f: (setup: BackgroundIntegrationTestSetup) => void,
        ) => {
            await Promise.all(devices.map(f))
        }

        return {
            devices,
            forEachDevice,
            syncModule,
            searchModule,
            customLists,
            sharedSyncLog: options.sharedSyncLog,
            userId,
        }
    }

    const it = makeTestFactory({
        ...suiteOptions,
        setupTest,
    })

    it('should not do anything if not enabled', async (setup: TestSetup) => {
        const { devices, syncModule, forEachDevice: forEachSetup } = setup
        await forEachSetup(s => syncModule(s).setup())

        expect(syncModule(devices[0]).continuousSync.enabled).toBe(false)
        await devices[0].backgroundModules.customLists.createCustomList({
            name: 'My list',
        })
        expect(
            await syncModule(devices[0]).clientSyncLog.getEntriesCreatedAfter(
                0,
            ),
        ).toEqual([])
    })

    it('should do the whole onboarding flow correctly', async (setup: TestSetup) => {
        const {
            devices,
            customLists,
            syncModule,
            searchModule,
            forEachDevice: forEachSetup,
            userId,
        } = setup

        devices[0].authService.setUser({ ...TEST_USER, id: userId as string })

        await forEachSetup(s => syncModule(s).setup())

        // Initial data

        const listId = await devices[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await devices[0].backgroundModules.customLists.insertPageToList({
            id: listId,
            url: 'http://bla.com/',
        })
        await searchModule(devices[0]).searchIndex.addPage({
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

        await doInitialSync({
            source: devices[0].backgroundModules.sync,
            target: devices[1].backgroundModules.sync,
        })
        expect(
            await customLists(devices[1]).fetchListById({
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

        const firstDeviceId = await getDeviceId(devices[0])
        expect(firstDeviceId).toBeTruthy()

        const secondDeviceId = await getDeviceId(devices[1])
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

        await customLists(devices[1]).updateListName({
            id: listId,
            name: 'Updated List Title',
        })

        await syncModule(devices[1]).remoteFunctions.forceIncrementalSync()
        await syncModule(devices[0]).remoteFunctions.forceIncrementalSync()

        expect(
            await customLists(devices[0]).fetchListById({
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

        await customLists(devices[0]).updateListName({
            id: listId,
            name: 'Another Updated List Title',
        })

        await syncModule(devices[0]).remoteFunctions.forceIncrementalSync()
        await syncModule(devices[1]).remoteFunctions.forceIncrementalSync()

        expect(
            await customLists(devices[1]).fetchListById({
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

    it('should enable sync on start up if enabled', async (setup: TestSetup) => {
        const {
            devices,
            forEachDevice: forEachSetup,
            customLists,
            syncModule,
            sharedSyncLog,
            userId,
        } = setup

        devices[0].authService.setUser({ ...TEST_USER, id: userId as string })
        devices[1].authService.setUser({ ...TEST_USER, id: userId as string })

        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId }),
            await sharedSyncLog.createDeviceId({ userId }),
        ]

        await devices[0].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[0],
        })
        await devices[1].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[1],
        })

        await forEachSetup(s => syncModule(s).setup())
        await forEachSetup(s => syncModule(s).firstContinuousSyncPromise)
        // await forEachSetup(
        //     s => (syncModule(s).continuousSync.useEncryption = false),
        // )

        expectIncrementalSyncScheduled(syncModule(devices[0]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
        })
        expectIncrementalSyncScheduled(syncModule(devices[1]), {
            when: Date.now() + INCREMENTAL_SYNC_FREQUENCY,
            margin: 50,
        })

        const listId = await devices[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await devices[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await devices[1].backgroundModules.sync.continuousSync.forceIncrementalSync()

        expect(
            await customLists(devices[1]).fetchListById({
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
        const {
            devices,
            customLists,
            syncModule,
            sharedSyncLog,
            userId,
        } = setup

        devices[0].authService.setUser({ ...TEST_USER, id: userId as string })
        devices[1].authService.setUser({ ...TEST_USER, id: userId as string })

        const deviceIds = [
            await sharedSyncLog.createDeviceId({ userId }),
            await sharedSyncLog.createDeviceId({ userId }),
        ]

        await devices[0].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[0],
        })
        await devices[1].browserLocalStorage.set({
            [SYNC_STORAGE_AREA_KEYS.continuousSyncEnabled]: true,
            [SYNC_STORAGE_AREA_KEYS.deviceId]: deviceIds[1],
        })

        await syncModule(devices[0]).setup()
        // syncModule(devices[0]).initialSync.useEncryption = false
        // syncModule(devices[0]).continuousSync.useEncryption = false
        await syncModule(devices[0]).firstContinuousSyncPromise

        const listId = await devices[0].backgroundModules.customLists.createCustomList(
            {
                name: 'My list',
            },
        )
        await devices[0].backgroundModules.sync.continuousSync.forceIncrementalSync()
        await syncModule(devices[1]).setup()
        // syncModule(devices[1]).continuousSync.useEncryption = false
        await syncModule(devices[1]).firstContinuousSyncPromise

        expect(
            await customLists(devices[1]).fetchListById({
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

    it('should merge data if do an initial sync to a device which already has some data', async (setup: TestSetup) => {
        const {
            syncModule,
            forEachDevice: forEachSetup,
            devices,
            userId,
        } = setup
        await forEachSetup(s => syncModule(s).setup())

        devices[0].authService.setUser({ ...TEST_USER, id: userId as string })

        await insertIntegrationTestData(devices[0])
        const storageContents = await getStorageContents(
            devices[0].storageManager,
        )
        storageContents['pages'][0].screenshot = null

        await doInitialSync({
            source: devices[0].backgroundModules.sync,
            target: devices[1].backgroundModules.sync,
        })
        expect(await getStorageContents(devices[1].storageManager)).toEqual({
            ...storageContents,
            syncDeviceInfo: expectedDeviceInfo,
        })

        await doInitialSync({
            source: devices[0].backgroundModules.sync,
            target: devices[1].backgroundModules.sync,
        })
        expect(await getStorageContents(devices[1].storageManager)).toEqual({
            ...storageContents,
            syncDeviceInfo: expectedDeviceInfo,
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
                devices,
                customLists,
                syncModule,
                searchModule,
                forEachDevice: forEachSetup,
                userId,
            } = params.setup

            await forEachSetup(s => syncModule(s).setup())
            devices[0].authService.setUser({
                ...TEST_USER,
                id: userId as string,
            })

            if (params.insertDefaultPages) {
                await searchModule(devices[0]).searchIndex.addPage({
                    pageDoc: {
                        url: 'http://www.bla.com/',
                        content: {
                            fullText: 'home page content',
                            title: 'bla.com title',
                        },
                    },
                    visits: [],
                })
                await searchModule(devices[0]).searchIndex.addPage({
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

            await params.insertData({ device: devices[0] })

            syncModule(devices[0]).initialSync.filterPassiveData = true
            await doInitialSync({
                source: devices[0].backgroundModules.sync,
                target: devices[1].backgroundModules.sync,
            })

            await params.checkData({
                device: devices[1],
                expectData: async (collections, expected) => {
                    const contents = await getStorageContents(
                        devices[1].storageManager,
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

function mobileSyncTests(suiteOptions: {
    withDependencies: WithTestDependencies
    skip?: boolean
}) {
    interface TestSetup {
        devices: {
            extension: BackgroundIntegrationTestSetup
            mobile: MobileIntegrationTestSetup
        }
    }

    const expectedDeviceInfo = [
        {
            createdWhen: expect.any(Number),
            deviceId: '1',
            productType: 'app',
            devicePlatform: 'integration-tests',
        },
        {
            createdWhen: expect.any(Number),
            deviceId: '2',
            productType: 'ext',
            devicePlatform: 'browser',
        },
    ]

    async function setupTest(
        dependencies: TestDependencies,
    ): Promise<TestSetup> {
        const signalTransportFactory = lazyMemorySignalTransportFactory()
        const devices: TestSetup['devices'] = {
            extension: await setupBackgroundIntegrationTest({
                signalTransportFactory,
                sharedSyncLog: dependencies.sharedSyncLog,
            }),
            mobile: await setupMobileIntegrationTest({
                signalTransportFactory,
                sharedSyncLog: dependencies.sharedSyncLog,
            }),
        }
        const userId: string = dependencies.userId || uuid()
        devices.extension.authService.setUser({
            ...TEST_USER,
            id: userId as string,
        })
        // devices.app.backgroundModules.auth.userId = userId

        return { devices }
    }

    const removeUnsyncedCollectionFromStorageContents = async (
        storageContents: StorageContents,
    ) => {
        for (const [collectionName, objects] of Object.entries(
            storageContents,
        )) {
            if (SYNCED_COLLECTIONS.indexOf(collectionName) === -1) {
                delete storageContents[collectionName]
            }
        }
    }

    function removeTermFieldsFromStorageContents(
        storageContents: StorageContents,
    ) {
        for (const [collectionName, objects] of Object.entries(
            storageContents,
        )) {
            for (const object of objects) {
                for (const [fieldName, fieldValue] of Object.entries(object)) {
                    if (
                        isTermsField({
                            collection: collectionName,
                            field: fieldName,
                        })
                    ) {
                        delete object[fieldName]
                    }
                }
            }
        }
    }

    const it = makeTestFactory({
        ...suiteOptions,
        setupTest,
    })

    it('should do an initial sync from extension to mobile', async (setup: TestSetup) => {
        const { devices } = setup

        await insertIntegrationTestData(devices.extension)
        const extensionStorageContents = await getStorageContents(
            devices.extension.storageManager,
        )
        await removeUnsyncedCollectionFromStorageContents(
            extensionStorageContents,
        )
        await removeTermFieldsFromStorageContents(extensionStorageContents)

        await doInitialSync({
            source: devices.extension.backgroundModules.sync,
            target: devices.mobile.services.sync,
        })
        const mobileStorageContents = await getStorageContents(
            devices.mobile.storage.manager,
        )
        await removeUnsyncedCollectionFromStorageContents(mobileStorageContents)
        expect(mobileStorageContents).toEqual({
            ...extensionStorageContents,
            syncDeviceInfo: expectedDeviceInfo,
        })
    })

    it('should merge during initial sync from extension to mobile', async (setup: TestSetup) => {
        const { devices } = setup

        await insertIntegrationTestData(devices.extension)
        const extensionStorageContents = await getStorageContents(
            devices.extension.storageManager,
        )
        await removeUnsyncedCollectionFromStorageContents(
            extensionStorageContents,
        )
        await removeTermFieldsFromStorageContents(extensionStorageContents)

        await doInitialSync({
            source: devices.extension.backgroundModules.sync,
            target: devices.mobile.services.sync,
        })
        const mobileStorageContentsBeforeMerge = await getStorageContents(
            devices.mobile.storage.manager,
        )
        await removeUnsyncedCollectionFromStorageContents(
            mobileStorageContentsBeforeMerge,
        )
        expect(mobileStorageContentsBeforeMerge).toEqual({
            ...extensionStorageContents,
            syncDeviceInfo: expectedDeviceInfo,
        })

        await doInitialSync({
            source: devices.extension.backgroundModules.sync,
            target: devices.mobile.services.sync,
        })
        const mobileStorageContentsAfterMerge = await getStorageContents(
            devices.mobile.storage.manager,
        )
        await removeUnsyncedCollectionFromStorageContents(
            mobileStorageContentsAfterMerge,
        )
        expect(mobileStorageContentsAfterMerge).toEqual(
            mobileStorageContentsBeforeMerge,
        )
    })
}

describe('SyncBackground', () => {
    function syncTests(options: {
        withDependencies: WithTestDependencies
        skip?: boolean
    }) {
        extensionSyncTests(options)
        mobileSyncTests(options)
    }

    describe('Memory backend', () => {
        syncTests({
            withDependencies: async body => {
                await body({
                    sharedSyncLog: await createMemorySharedSyncLog(),
                })
            },
        })
    })

    describe('Firestore backend', () => {
        syncTests({
            skip: !RUN_FIRESTORE_TESTS,
            withDependencies: async body => {
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
                        await body({
                            sharedSyncLog,
                            userId,
                        })
                    },
                )
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
