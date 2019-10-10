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

const createPagesStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        await searchModule(setup).searchIndex.addPage({
            pageDoc: {
                url: DATA.PAGE_1.fullUrl,
                content: {},
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
                    canonicalUrl: undefined,
                    fullTitle: undefined,
                    screenshot: undefined,
                    text: undefined,
                    titleTerms: [],
                    urlTerms: [],
                    terms: [],
                },
            },
            [DATA.PAGE_2.url]: {
                type: 'create',
                object: {
                    url: DATA.PAGE_2.url,
                    fullUrl: DATA.PAGE_2.fullUrl,
                    domain: DATA.PAGE_2.domain,
                    hostname: DATA.PAGE_2.hostname,
                    canonicalUrl: undefined,
                    fullTitle: undefined,
                    screenshot: undefined,
                    text: undefined,
                    titleTerms: [],
                    urlTerms: [],
                    terms: [],
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
    title: undefined,
    url: DATA.PAGE_1.url,
}
const expectedPage2Result = {
    annotations: [],
    annotsCount: undefined,
    displayTime: DATA.VISIT_2,
    favIcon: undefined,
    hasBookmark: false,
    screenshot: undefined,
    tags: [],
    title: undefined,
    url: DATA.PAGE_2.url,
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
])
