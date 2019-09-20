import expect from 'expect'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import {
    StorageDiff,
    StorageCollectionDiff,
} from 'src/tests/storage-change-detector'
import { LoggedStorageOperation } from 'src/tests/storage-operation-logger'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest(
            'should create a list, edit its title, add an entry to it and retrieve the list and its pages',
            () => {
                const customLists = (setup: BackgroundIntegrationTestSetup) =>
                    setup.backgroundModules.customLists.remoteFunctions
                const searchModule = (setup: BackgroundIntegrationTestSetup) =>
                    setup.backgroundModules.search
                let listId!: string | number
                let listEntry!: any
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
                            expectedStorageChanges: {
                                customLists: (): StorageCollectionDiff => ({
                                    [listId]: {
                                        type: 'create',
                                        object: {
                                            id: listId,
                                            createdAt: expect.any(Date),
                                            name: 'My Custom List',
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
                                            name: 'My Custom List',
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
                                            canonicalUrl: undefined,
                                            domain: 'bla.com',
                                            fullTitle: 'bla.com title',
                                            fullUrl: 'http://www.bla.com/',
                                            hostname: 'bla.com',
                                            screenshot: undefined,
                                            text: 'home page content',
                                            url: 'bla.com',
                                        }),
                                    },
                                    'bla.com/foo': {
                                        type: 'create',
                                        object: expect.objectContaining({
                                            canonicalUrl: undefined,
                                            domain: 'bla.com',
                                            fullTitle: 'bla.com foo title',
                                            fullUrl: 'http://www.bla.com/foo',
                                            hostname: 'bla.com',
                                            screenshot: undefined,
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
                                listEntry = (await customLists(
                                    setup,
                                ).insertPageToList({
                                    id: listId,
                                    url: 'http://www.bla.com/',
                                })).object
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
                                visits: (): StorageCollectionDiff =>
                                    expect.any(Object),
                            },
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).updateListName({
                                    id: listId,
                                    name: 'Updated List Title',
                                }),
                            expectedStorageChanges: {
                                customLists: (): StorageCollectionDiff => ({
                                    [listId]: {
                                        type: 'modify',
                                        updates: {
                                            name: 'Updated List Title',
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
                                    name: 'Updated List Title',
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
                                    await setup.backgroundModules.search.remoteFunctions.search.search(
                                        {
                                            query: '',
                                            showOnlyBookmarks: false,
                                            lists: [listId.toString()],
                                        },
                                    ),
                                ).toEqual({
                                    docs: [
                                        {
                                            displayTime: expect.any(Number),
                                            favIcon: undefined,
                                            hasBookmark: false,
                                            screenshot: undefined,
                                            tags: [],
                                            title: 'bla.com title',
                                            url: 'http://www.bla.com/',
                                        },
                                    ],
                                    isBadTerm: false,
                                    resultsExhausted: false,
                                    totalCount: 1,
                                })
                            },
                        },
                    ],
                }
            },
        ),
    ],
)
