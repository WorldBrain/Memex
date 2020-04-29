import expect from 'expect'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'
import { LoggedStorageOperation } from 'src/tests/storage-operation-logger'

const customLists = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.customLists
const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search
let listId!: any
let listEntry!: any

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest('should add open tabs to list', () => {
            const testList = 'ninja'
            const testTabs = [
                {
                    tabId: 1,
                    url: 'http://www.bar.com/eggs',
                    normalized: 'bar.com/eggs',
                },
                {
                    tabId: 2,
                    url: 'http://www.foo.com/spam',
                    normalized: 'foo.com/spam',
                },
            ]

            return {
                steps: [
                    {
                        execute: async ({ setup }) => {
                            customLists(setup)._createPage =
                                setup.backgroundModules.search.searchIndex.createTestPage

                            for (const { url } of testTabs) {
                                await setup.backgroundModules.search.searchIndex.createTestPage(
                                    { url },
                                )
                            }

                            listId = await customLists(
                                setup,
                            ).remoteFunctions.createCustomList({
                                name: testList,
                            })

                            await customLists(
                                setup,
                            ).remoteFunctions.addOpenTabsToList({
                                name: testList,
                                tabs: testTabs,
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

                            const expectedEntries = []

                            for (const { url, normalized } of testTabs) {
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
        backgroundIntegrationTest(
            'should create a list, edit its title, add an entry to it and retrieve the list and its pages',
            () => {
                const TEST_LIST_1 = 'My Custom List'
                const TEST_LIST_2 = 'Updated List Title'
                return {
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
                                await searchModule(setup).searchIndex.addPage({
                                    pageDoc: {
                                        url: 'http://www.bla.com/',
                                        content: {
                                            fullText: 'home page content',
                                            title: 'bla.com title',
                                        },
                                    },
                                    visits: [],
                                })
                                await searchModule(setup).searchIndex.addPage({
                                    pageDoc: {
                                        url: 'http://www.bla.com/foo',
                                        content: {
                                            fullText: 'foo page content',
                                            title: 'bla.com foo title',
                                        },
                                    },
                                    visits: [],
                                })
                            },
                            expectedStorageChanges: {
                                pages: (): StorageCollectionDiff => ({
                                    'bla.com': {
                                        type: 'create',
                                        object: expect.objectContaining({
                                            domain: 'bla.com',
                                            fullTitle: 'bla.com title',
                                            titleTerms: ['bla', 'title'],
                                            fullUrl: 'http://www.bla.com/',
                                            hostname: 'bla.com',
                                            text: 'home page content',
                                            terms: ['home', 'page', 'content'],
                                            url: 'bla.com',
                                            urlTerms: [],
                                        }),
                                    },
                                    'bla.com/foo': {
                                        type: 'create',
                                        object: expect.objectContaining({
                                            domain: 'bla.com',
                                            fullTitle: 'bla.com foo title',
                                            fullUrl: 'http://www.bla.com/foo',
                                            hostname: 'bla.com',
                                            text: 'foo page content',
                                            url: 'bla.com/foo',
                                        }),
                                    },
                                }),
                                visits: (): StorageCollectionDiff =>
                                    expect.any(Object),
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                listEntry = (
                                    await customLists(setup).insertPageToList({
                                        id: listId,
                                        url: 'http://www.bla.com/',
                                    })
                                ).object
                            },
                            expectedStorageChanges: {
                                pageListEntries: (): StorageCollectionDiff => ({
                                    [listEntry &&
                                    `[${listId},"${listEntry.pageUrl}"]`]: {
                                        type: 'create',
                                        object: {
                                            listId,
                                            createdAt: expect.any(Date),
                                            fullUrl: 'http://www.bla.com/',
                                            pageUrl: 'bla.com',
                                        },
                                    },
                                }),
                            },
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).updateList({
                                    id: listId,
                                    name: TEST_LIST_2,
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
                                    pages: ['http://www.bla.com/'],
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
                                        pageUrl: 'bla.com',
                                        fullUrl: 'http://www.bla.com/',
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
                                            lists: [TEST_LIST_2],
                                            tags: [],
                                            title: 'bla.com title',
                                            url: 'bla.com',
                                            fullUrl: 'http://www.bla.com/',
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
                                    url: 'http://www.bla.com/',
                                })
                            },
                        },
                        {
                            execute: async ({ setup }) => {
                                await searchModule(setup).searchIndex.addPage({
                                    pageDoc: {
                                        url: 'http://www.bla.com/',
                                        content: {
                                            fullText: 'home page content',
                                            title: 'bla.com title',
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
                                    pages: ['http://www.bla.com/'],
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
                                        pageUrl: 'bla.com',
                                        fullUrl: 'http://www.bla.com/',
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
                                            lists: [TEST_LIST_1],
                                            tags: [],
                                            title: 'bla.com title',
                                            url: 'bla.com',
                                            fullUrl: 'http://www.bla.com/',
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
                                    url: 'http://www.bla.com/',
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
                                    pages: ['http://www.bla.com/'],
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
                                        pageUrl: 'bla.com',
                                        fullUrl: 'http://www.bla.com/',
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
                                    url: 'http://www.bla.com/',
                                })
                                await customLists(setup).insertPageToList({
                                    id: listId,
                                    url: 'http://www.test.com/',
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
                                        pageUrl: 'bla.com',
                                        fullUrl: 'http://www.bla.com/',
                                        createdAt: expect.any(Date),
                                    },
                                    {
                                        listId,
                                        pageUrl: 'test.com',
                                        fullUrl: 'http://www.test.com/',
                                        createdAt: expect.any(Date),
                                    },
                                ])
                            },
                            execute: async ({ setup }) => {
                                await customLists(setup).removePageFromList({
                                    id: listId,
                                    url: 'test.com',
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
                                        pageUrl: 'bla.com',
                                        fullUrl: 'http://www.bla.com/',
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
