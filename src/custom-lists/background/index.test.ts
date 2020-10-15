import expect from 'expect'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import {
    StorageCollectionDiff,
    createdVisit,
} from 'src/tests/storage-change-detector'
import { LoggedStorageOperation } from 'src/tests/storage-operation-logger'
import * as DATA from 'src/tests/common-fixtures.data'
import {
    FakeTab,
    injectFakeTabs,
} from 'src/tab-management/background/index.tests'
import { PAGE_1 } from 'src/annotations/background/index.test.data'
import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-storage/lib/lists/constants'

const customLists = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.customLists
const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search
let listId!: any
let listEntry!: any

const TEST_TABS: Array<FakeTab & { normalized: string }> = [
    DATA.TEST_TAB_1,
    DATA.TEST_TAB_2,
]

function testSetupFactory() {
    return async ({ setup }: { setup: BackgroundIntegrationTestSetup }) => {
        await injectFakeTabs({
            tabManagement: setup.backgroundModules.tabManagement,
            tabsAPI: setup.browserAPIs.tabs,
            tabs: TEST_TABS,
        })
    }
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest('should add open tabs to list', () => {
            const testList = 'ninja'

            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            listId = await customLists(
                                setup,
                            ).remoteFunctions.createCustomList({
                                name: testList,
                            })

                            await customLists(
                                setup,
                            ).remoteFunctions.addOpenTabsToList({
                                name: testList,
                                time: 555,
                            })
                        },
                        postCheck: async ({
                            setup: { storageManager: db },
                        }) => {
                            const stored = {
                                customLists: await db
                                    .collection('customLists')
                                    .findObjects({}),
                                pageListEntries: await db
                                    .collection('pageListEntries')
                                    .findObjects({}),
                            }

                            const expectedEntries = [
                                {
                                    createdAt: expect.any(Date),
                                    fullUrl: DATA.PAGE_1.fullUrl,
                                    listId: SPECIAL_LIST_IDS.INBOX,
                                    pageUrl: DATA.PAGE_1.url,
                                },
                                {
                                    createdAt: expect.any(Date),
                                    fullUrl: DATA.PAGE_2.fullUrl,
                                    listId: SPECIAL_LIST_IDS.INBOX,
                                    pageUrl: DATA.PAGE_2.url,
                                },
                            ]

                            for (const { url, normalized } of TEST_TABS) {
                                expectedEntries.push({
                                    listId,
                                    createdAt: expect.any(Date),
                                    fullUrl: url,
                                    pageUrl: normalized,
                                })
                            }

                            expect(stored).toEqual({
                                customLists: [
                                    {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                    {
                                        id: listId,
                                        createdAt: expect.any(Date),
                                        name: testList,
                                        isDeletable: true,
                                        isNestable: true,
                                    },
                                ],
                                pageListEntries: expectedEntries,
                            })
                        },
                    },
                ],
            }
        }),
        backgroundIntegrationTest('should remove open tabs to list', () => {
            const testList = 'ninja'

            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            listId = await customLists(
                                setup,
                            ).remoteFunctions.createCustomList({
                                name: testList,
                            })

                            await customLists(
                                setup,
                            ).remoteFunctions.addOpenTabsToList({
                                name: testList,
                                time: 555,
                            })
                            await customLists(
                                setup,
                            ).remoteFunctions.removePageFromList({
                                id: listId,
                                url: TEST_TABS[1].url,
                            })
                            await customLists(
                                setup,
                            ).remoteFunctions.removeOpenTabsFromList({
                                listId,
                            })
                        },
                        postCheck: async ({
                            setup: { storageManager: db },
                        }) => {
                            const stored = {
                                customLists: await db
                                    .collection('customLists')
                                    .findObjects({}),
                                pageListEntries: await db
                                    .collection('pageListEntries')
                                    .findObjects({}),
                            }

                            expect(stored).toEqual({
                                customLists: [
                                    {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                    {
                                        id: listId,
                                        createdAt: expect.any(Date),
                                        name: testList,
                                        isDeletable: true,
                                        isNestable: true,
                                    },
                                ],
                                pageListEntries: [
                                    {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_1.url,
                                    },
                                    {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_2.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_2.url,
                                    },
                                ],
                            })
                        },
                    },
                ],
            }
        }),
        backgroundIntegrationTest(
            'should create a list, edit its title, add an entry to it and retrieve the list and its pages',
            () => {
                const TEST_LIST_1 = 'My Custom List'
                const TEST_LIST_2 = 'Updated List Title'
                return {
                    setup: testSetupFactory(),
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                listId = await customLists(
                                    setup,
                                ).createCustomList({
                                    name: TEST_LIST_1,
                                })
                            },
                            expectedStorageChanges: {
                                customLists: (): StorageCollectionDiff => ({
                                    [listId]: {
                                        type: 'create',
                                        object: {
                                            id: listId,
                                            createdAt: expect.any(Date),
                                            name: TEST_LIST_1,
                                            isDeletable: true,
                                            isNestable: true,
                                        },
                                    },
                                }),
                            },
                            expectedStorageOperations: (): LoggedStorageOperation[] => [
                                {
                                    operation: [
                                        'createObject',
                                        'customLists',
                                        {
                                            createdAt: expect.any(Date),
                                            id: listId,
                                            isDeletable: true,
                                            isNestable: true,
                                            name: TEST_LIST_1,
                                        },
                                    ],
                                    result: {
                                        object: expect.objectContaining({
                                            id: listId,
                                        }),
                                    },
                                },
                            ],
                        },
                        {
                            execute: async ({ setup }) => {
                                setup.injectTime(() => DATA.VISIT_1)
                                listEntry = (
                                    await customLists(setup).insertPageToList({
                                        id: listId,
                                        url: TEST_TABS[0].url,
                                        tabId: TEST_TABS[0].id,
                                    })
                                ).object
                            },
                            expectedStorageChanges: {
                                customLists: (): StorageCollectionDiff => ({
                                    [SPECIAL_LIST_IDS.INBOX]: {
                                        type: 'create',
                                        object: {
                                            createdAt: expect.any(Date),
                                            name: SPECIAL_LIST_NAMES.INBOX,
                                            id: SPECIAL_LIST_IDS.INBOX,
                                            isDeletable: false,
                                            isNestable: false,
                                        },
                                    },
                                }),
                                pageListEntries: (): StorageCollectionDiff => ({
                                    [listEntry &&
                                    `[${listId},"${listEntry.pageUrl}"]`]: {
                                        type: 'create',
                                        object: {
                                            listId,
                                            createdAt: expect.any(Date),
                                            fullUrl: TEST_TABS[0].url,
                                            pageUrl: TEST_TABS[0].normalized,
                                        },
                                    },
                                    [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                                        type: 'create',
                                        object: {
                                            createdAt: expect.any(Date),
                                            fullUrl: DATA.PAGE_1.fullUrl,
                                            listId: SPECIAL_LIST_IDS.INBOX,
                                            pageUrl: DATA.PAGE_1.url,
                                        },
                                    },
                                }),
                                pages: (): StorageCollectionDiff =>
                                    DATA.PAGE_1_CREATION,
                                visits: (): StorageCollectionDiff =>
                                    createdVisit(DATA.VISIT_1, DATA.PAGE_1.url),
                            },
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).updateList({
                                    id: listId,
                                    oldName: TEST_LIST_1,
                                    newName: TEST_LIST_2,
                                }),
                            expectedStorageChanges: {
                                customLists: (): StorageCollectionDiff => ({
                                    [listId]: {
                                        type: 'modify',
                                        updates: {
                                            name: TEST_LIST_2,
                                        },
                                    },
                                }),
                            },
                            postCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListById({
                                        id: listId,
                                    }),
                                ).toEqual({
                                    id: expect.any(Number),
                                    name: TEST_LIST_2,
                                    isDeletable: true,
                                    isNestable: true,
                                    createdAt: expect.any(Date),
                                    pages: [TEST_TABS[0].url],
                                    active: true,
                                })

                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[0].normalized,
                                        fullUrl: TEST_TABS[0].url,
                                        createdAt: expect.any(Date),
                                    },
                                ])

                                expect(
                                    await searchModule(setup).searchPages({
                                        lists: [listId],
                                    }),
                                ).toEqual({
                                    docs: [
                                        {
                                            annotations: [],
                                            annotsCount: undefined,
                                            displayTime: expect.any(Number),
                                            favIcon: undefined,
                                            hasBookmark: false,
                                            screenshot: undefined,
                                            lists: [
                                                SPECIAL_LIST_NAMES.INBOX,
                                                TEST_LIST_2,
                                            ],
                                            tags: [],
                                            url: TEST_TABS[0].normalized,
                                            fullUrl: TEST_TABS[0].url,
                                        },
                                    ],
                                    resultsExhausted: true,
                                    totalCount: null,
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should create a list, add an entry of an existing page to it and retrieve the list and its pages',
            () => {
                const TEST_LIST_1 = 'My Custom List'
                return {
                    setup: testSetupFactory(),
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                listId = await customLists(
                                    setup,
                                ).createCustomList({
                                    name: TEST_LIST_1,
                                })
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                await customLists(setup).insertPageToList({
                                    id: listId,
                                    url: TEST_TABS[0].url,
                                    tabId: TEST_TABS[0].id,
                                })
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.pages.addPage({
                                    pageDoc: {
                                        url: TEST_TABS[0].url,
                                        content: {
                                            fullText: 'home page content',
                                            title: 'first page title',
                                        },
                                    },
                                    visits: [],
                                })
                            },
                            postCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListById({
                                        id: listId,
                                    }),
                                ).toEqual({
                                    id: expect.any(Number),
                                    name: TEST_LIST_1,
                                    isDeletable: true,
                                    isNestable: true,
                                    createdAt: expect.any(Date),
                                    pages: [TEST_TABS[0].url],
                                    active: true,
                                })

                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[0].normalized,
                                        fullUrl: TEST_TABS[0].url,
                                        createdAt: expect.any(Date),
                                    },
                                ])

                                expect(
                                    await searchModule(setup).searchPages({
                                        lists: [listId],
                                    }),
                                ).toEqual({
                                    docs: [
                                        {
                                            annotations: [],
                                            annotsCount: undefined,
                                            displayTime: expect.any(Number),
                                            favIcon: undefined,
                                            hasBookmark: false,
                                            screenshot: undefined,
                                            lists: [
                                                SPECIAL_LIST_NAMES.INBOX,
                                                TEST_LIST_1,
                                            ],
                                            tags: [],
                                            title: 'first page title',
                                            url: TEST_TABS[0].normalized,
                                            fullUrl: TEST_TABS[0].url,
                                        },
                                    ],
                                    resultsExhausted: true,
                                    totalCount: null,
                                })
                            },
                        },
                    ],
                }
            },
        ),

        backgroundIntegrationTest(
            'should create a list, add an entry to it, then remove the list and its entries',
            () => {
                return {
                    setup: testSetupFactory(),
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                listId = await customLists(
                                    setup,
                                ).createCustomList({
                                    name: 'My Custom List',
                                })
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                await customLists(setup).insertPageToList({
                                    id: listId,
                                    url: TEST_TABS[0].url,
                                    tabId: TEST_TABS[0].id,
                                })
                            },
                        },
                        {
                            preCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListById({
                                        id: listId,
                                    }),
                                ).toEqual({
                                    id: listId,
                                    name: 'My Custom List',
                                    isDeletable: true,
                                    isNestable: true,
                                    createdAt: expect.any(Date),
                                    pages: [TEST_TABS[0].url],
                                    active: true,
                                })

                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[0].normalized,
                                        fullUrl: TEST_TABS[0].url,
                                        createdAt: expect.any(Date),
                                    },
                                ])
                            },
                            execute: async ({ setup }) => {
                                await customLists(setup).removeList({
                                    id: listId,
                                })
                            },
                            postCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListById({
                                        id: listId,
                                    }),
                                ).toEqual(null)
                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should create a list, add two entries to it, then remove one of the entries',
            () => {
                return {
                    setup: testSetupFactory(),
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                listId = await customLists(
                                    setup,
                                ).createCustomList({
                                    name: 'My Custom List',
                                })
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                await customLists(setup).insertPageToList({
                                    id: listId,
                                    url: TEST_TABS[0].url,
                                    tabId: TEST_TABS[0].id,
                                })
                                await customLists(setup).insertPageToList({
                                    id: listId,
                                    url: TEST_TABS[1].url,
                                    tabId: TEST_TABS[1].id,
                                })
                            },
                        },
                        {
                            preCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[0].normalized,
                                        fullUrl: TEST_TABS[0].url,
                                        createdAt: expect.any(Date),
                                    },
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[1].normalized,
                                        fullUrl: TEST_TABS[1].url,
                                        createdAt: expect.any(Date),
                                    },
                                ])
                            },
                            execute: async ({ setup }) => {
                                await customLists(setup).removePageFromList({
                                    id: listId,
                                    url: TEST_TABS[0].normalized,
                                })
                            },
                            postCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListPagesById(
                                        {
                                            id: listId,
                                        },
                                    ),
                                ).toEqual([
                                    {
                                        listId,
                                        pageUrl: TEST_TABS[1].normalized,
                                        fullUrl: TEST_TABS[1].url,
                                        createdAt: expect.any(Date),
                                    },
                                ])
                            },
                        },
                    ],
                }
            },
        ),
    ],
)
