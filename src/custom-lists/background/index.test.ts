import expect from 'expect'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'
import { LoggedStorageOperation } from 'src/tests/storage-operation-logger'
import * as DATA from 'src/direct-linking/background/index.test.data'

const customLists = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.customLists
const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search
let listId!: any
let listEntry!: any

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest(
            'should create a list, edit its title, add an entry to it and retrieve the list and its pages',
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
