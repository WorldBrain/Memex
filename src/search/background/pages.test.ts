import expect from 'expect'

import * as DATA from './pages.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'

const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search
const customLists = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.customLists
const tags = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.tags
const bookmarks = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.bookmarks

const createPagesStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        await searchModule(setup).searchIndex.addPage({
            pageDoc: {
                url: DATA.PAGE_1.fullUrl,
                content: { fullText: 'just some dummy test text' },
            },
            visits: [DATA.VISIT_1],
            rejectNoContent: false,
        })
        await searchModule(setup).searchIndex.addPage({
            pageDoc: {
                url: DATA.PAGE_2.fullUrl,
                content: {},
            },
            visits: [DATA.VISIT_2],
            rejectNoContent: false,
        })
    },
    expectedStorageChanges: {
        pages: (): StorageCollectionDiff => ({
            [DATA.PAGE_1.url]: {
                type: 'create',
                object: {
                    url: DATA.PAGE_1.url,
                    fullUrl: DATA.PAGE_1.fullUrl,
                    domain: DATA.PAGE_1.domain,
                    hostname: DATA.PAGE_1.hostname,
                    text: 'just some dummy test text',
                    urlTerms: [],
                    terms: ['dummy', 'test', 'text'],
                },
            },
            [DATA.PAGE_2.url]: {
                type: 'create',
                object: {
                    url: DATA.PAGE_2.url,
                    fullUrl: DATA.PAGE_2.fullUrl,
                    domain: DATA.PAGE_2.domain,
                    hostname: DATA.PAGE_2.hostname,
                    urlTerms: [],
                },
            },
        }),
        visits: (): StorageCollectionDiff => ({
            [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                type: 'create',
                object: {
                    time: DATA.VISIT_1,
                    url: DATA.PAGE_1.url,
                },
            },
            [`[${DATA.VISIT_2},"${DATA.PAGE_2.url}"]`]: {
                type: 'create',
                object: {
                    time: DATA.VISIT_2,
                    url: DATA.PAGE_2.url,
                },
            },
        }),
    },
}

const expectedPage1Result = {
    annotations: [],
    annotsCount: undefined,
    displayTime: DATA.VISIT_1,
    favIcon: undefined,
    hasBookmark: false,
    screenshot: undefined,
    tags: [],
    lists: [],
    title: undefined,
    url: DATA.PAGE_1.url,
    fullUrl: DATA.PAGE_1.fullUrl,
}
const expectedPage2Result = {
    annotations: [],
    annotsCount: undefined,
    displayTime: DATA.VISIT_2,
    favIcon: undefined,
    hasBookmark: false,
    screenshot: undefined,
    tags: [],
    lists: [],
    title: undefined,
    url: DATA.PAGE_2.url,
    fullUrl: DATA.PAGE_2.fullUrl,
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Pages', [
    backgroundIntegrationTest(
        'should create + visit two pages, visit one of them again, then retrieve them via time filtered searches',
        () => {
            return {
                steps: [
                    createPagesStep,
                    {
                        execute: async ({ setup }) => {
                            await searchModule(setup).searchIndex.addVisit(
                                DATA.PAGE_2.url,
                                DATA.VISIT_3,
                            )
                        },
                        expectedStorageChanges: {
                            visits: (): StorageCollectionDiff => ({
                                [`[${DATA.VISIT_3},"${DATA.PAGE_2.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        time: DATA.VISIT_3,
                                        url: DATA.PAGE_2.url,
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResultsA = await searchModule(
                                setup,
                            ).searchPages({ startDate: DATA.VISIT_1 })
                            const searchResultsB = await searchModule(
                                setup,
                            ).searchPages({ startDate: DATA.VISIT_2 })
                            const searchResultsC = await searchModule(
                                setup,
                            ).searchPages({ startDate: DATA.VISIT_3 })

                            const expectedPage2ResultVisit3 = {
                                ...expectedPage2Result,
                                displayTime: DATA.VISIT_3,
                            }

                            for (const results of [
                                searchResultsA,
                                searchResultsB,
                                searchResultsC,
                            ]) {
                                for (const doc of results.docs) {
                                    expect(doc.title).toBeFalsy()
                                    delete doc.title
                                }
                            }

                            expect(searchResultsA).toEqual({
                                docs: [
                                    expectedPage2ResultVisit3,
                                    expectedPage1Result,
                                ],
                                resultsExhausted: true,
                                totalCount: null,
                            })
                            expect(searchResultsB).toEqual({
                                docs: [expectedPage2ResultVisit3],
                                resultsExhausted: true,
                                totalCount: null,
                            })
                            expect(searchResultsC).toEqual({
                                docs: [expectedPage2ResultVisit3],
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
        'should create + visit two pages, delete one of them, then not be able to retrieve it via search anymore',
        () => {
            return {
                steps: [
                    createPagesStep,
                    {
                        preCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({}),
                            ).toEqual({
                                docs: [
                                    expectedPage2Result,
                                    expectedPage1Result,
                                ],
                                resultsExhausted: true,
                                totalCount: null,
                            })
                        },
                        execute: async ({ setup }) => {
                            await searchModule(setup).searchIndex.delPages([
                                DATA.PAGE_1.url,
                            ])
                        },
                        expectedStorageChanges: {
                            pages: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'delete',
                                },
                            }),
                            visits: (): StorageCollectionDiff => ({
                                [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({}),
                            ).toEqual({
                                docs: [expectedPage2Result],
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
        'should create + visit two pages, delete one of them by domain, then not be able to retrieve it via search anymore',
        () => {
            return {
                steps: [
                    createPagesStep,
                    {
                        preCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    domains: [DATA.PAGE_1.domain],
                                }),
                            ).toEqual({
                                docs: [expectedPage1Result],
                                resultsExhausted: true,
                                totalCount: null,
                            })
                        },
                        execute: async ({ setup }) => {
                            await searchModule(
                                setup,
                            ).searchIndex.delPagesByDomain(DATA.PAGE_1.domain)
                        },
                        expectedStorageChanges: {
                            pages: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'delete',
                                },
                            }),
                            visits: (): StorageCollectionDiff => ({
                                [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await setup.storageManager
                                    .collection('pages')
                                    .findObjects({ url: DATA.PAGE_1.url }),
                            ).toEqual([])

                            expect(
                                await searchModule(setup).searchPages({
                                    domains: [DATA.PAGE_1.domain],
                                }),
                            ).toEqual({
                                docs: [],
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
        "should create + visit two pages, update the text of one of them, then confirm the indexed terms still contain the old text's terms",
        () => {
            return {
                steps: [
                    createPagesStep,
                    {
                        preCheck: async ({ setup }) => {
                            const page = await setup.storageManager
                                .collection('pages')
                                .findOneObject<{ terms: string[] }>({
                                    url: DATA.PAGE_1.url,
                                })
                            expect(page.terms).toEqual(
                                expect.arrayContaining([
                                    'text',
                                    'dummy',
                                    'test',
                                ]),
                            )
                        },
                        execute: async ({ setup }) => {
                            await searchModule(setup).searchIndex.addPageTerms({
                                pageDoc: {
                                    url: DATA.PAGE_1.fullUrl,
                                    content: {
                                        fullText: 'some new updated text',
                                    },
                                },
                            })
                        },
                        expectedStorageChanges: {
                            pages: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'modify',
                                    updates: {
                                        terms: {
                                            '0': 'updated',
                                            '1': 'text',
                                            '2': 'dummy',
                                        },
                                        text: 'some new updated text',
                                    },
                                },
                            }),
                        },
                        expectedSyncLogEntries: () => [
                            expect.objectContaining({
                                collection: 'pages',
                                pk: DATA.PAGE_1.url,
                                value: {
                                    text: 'some new updated text',
                                },
                            }),
                        ],
                        postCheck: async ({ setup }) => {
                            const page = await setup.storageManager
                                .collection('pages')
                                .findOneObject<{ terms: string[] }>({
                                    url: DATA.PAGE_1.url,
                                })
                            expect(page.terms).toEqual(
                                expect.arrayContaining([
                                    'updated',
                                    'text',
                                    'dummy',
                                    'test',
                                ]),
                            )
                        },
                    },
                ],
            }
        },
    ),
    backgroundIntegrationTest(
        'should create + visit two pages, tag, star, and add one to a list, then delete that one - deleting all associated data',
        () => {
            let listId: number

            return {
                steps: [
                    createPagesStep,
                    {
                        execute: async ({ setup }) => {
                            listId = await customLists(setup).createCustomList({
                                name: 'test',
                            })
                            await customLists(setup).insertPageToList({
                                url: DATA.PAGE_1.url,
                                id: listId,
                            })
                            await bookmarks(setup).addBookmark({
                                url: DATA.PAGE_1.url,
                            })
                            await tags(setup).addTagToExistingUrl({
                                url: DATA.PAGE_1.fullUrl,
                                tag: DATA.TAG_1,
                            })
                        },
                        expectedStorageChanges: {
                            customLists: (): StorageCollectionDiff => ({
                                [listId]: {
                                    type: 'create',
                                    object: {
                                        id: listId,
                                        name: 'test',
                                        isDeletable: true,
                                        isNestable: true,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${listId},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        listId,
                                        fullUrl: DATA.PAGE_1.url,
                                        pageUrl: DATA.PAGE_1.url,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        url: DATA.PAGE_1.url,
                                        name: DATA.TAG_1,
                                    },
                                },
                            }),
                            bookmarks: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'create',
                                    object: {
                                        url: DATA.PAGE_1.url,
                                        time: expect.any(Number),
                                    },
                                },
                            }),
                        },
                    },
                    {
                        preCheck: async ({ setup }) => {
                            expect(
                                await setup.storageManager
                                    .collection('pages')
                                    .findObject({ url: DATA.PAGE_2.url }),
                            ).not.toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('pages')
                                    .findObject({ url: DATA.PAGE_1.url }),
                            ).not.toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('bookmarks')
                                    .findObject({ url: DATA.PAGE_1.url }),
                            ).not.toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('tags')
                                    .findObject({
                                        url: DATA.PAGE_1.url,
                                        name: DATA.TAG_1,
                                    }),
                            ).not.toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('pageListEntries')
                                    .findObject({
                                        pageUrl: DATA.PAGE_1.url,
                                        listId,
                                    }),
                            ).not.toBeNull()
                        },
                        execute: async ({ setup }) => {
                            await searchModule(setup).searchIndex.delPages([
                                DATA.PAGE_1.url,
                            ])
                        },
                        expectedStorageChanges: {
                            pages: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'delete',
                                },
                            }),
                            visits: (): StorageCollectionDiff => ({
                                [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${listId},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                            bookmarks: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await setup.storageManager
                                    .collection('pages')
                                    .findObject({ url: DATA.PAGE_2.url }),
                            ).not.toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('pages')
                                    .findObject({ url: DATA.PAGE_1.url }),
                            ).toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('bookmarks')
                                    .findObject({ url: DATA.PAGE_1.url }),
                            ).toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('tags')
                                    .findObject({
                                        url: DATA.PAGE_1.url,
                                        name: DATA.TAG_1,
                                    }),
                            ).toBeNull()
                            expect(
                                await setup.storageManager
                                    .collection('pageListEntries')
                                    .findObject({
                                        url: DATA.PAGE_1.url,
                                        listId,
                                    }),
                            ).toBeNull()
                        },
                    },
                ],
            }
        },
    ),
])
