import expect from 'expect'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Tags', [
    backgroundIntegrationTest(
        'should create a page, tag it, retrieve it via a filtered search, and untag it',
        () => {
            const tags = (setup: BackgroundIntegrationTestSetup) =>
                setup.backgroundModules.tags
            const searchModule = (setup: BackgroundIntegrationTestSetup) =>
                setup.backgroundModules.search

            return {
                steps: [
                    {
                        execute: async ({ setup }) => {
                            await searchModule(setup).searchIndex.addPage({
                                pageDoc: {
                                    url: DATA.PAGE_1.fullUrl,
                                    content: {},
                                },
                                visits: [DATA.VISIT_1],
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
                            }),
                            visits: (): StorageCollectionDiff => ({
                                [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        time: DATA.VISIT_1,
                                        url: DATA.PAGE_1.url,
                                    },
                                },
                            }),
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await tags(setup).addTag({
                                tag: DATA.TAG_1,
                                url: DATA.PAGE_1.fullUrl,
                            })
                        },
                        expectedStorageChanges: {
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        url: DATA.PAGE_1.url,
                                        name: DATA.TAG_1,
                                    },
                                },
                            }),
                        },
                        preCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    tagsInc: [DATA.TAG_1],
                                }),
                            ).toEqual({
                                docs: [],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    tagsInc: [DATA.TAG_1],
                                }),
                            ).toEqual({
                                docs: [
                                    {
                                        annotations: [],
                                        annotsCount: undefined,
                                        displayTime: DATA.VISIT_1,
                                        favIcon: undefined,
                                        hasBookmark: false,
                                        screenshot: undefined,
                                        tags: [DATA.TAG_1],
                                        title: undefined,
                                        url: DATA.PAGE_1.url,
                                    },
                                ],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await tags(setup).delTag({
                                tag: DATA.TAG_1,
                                url: DATA.PAGE_1.fullUrl,
                            })
                        },
                        expectedStorageChanges: {
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${DATA.PAGE_1.url}"]`]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    tagsInc: [DATA.TAG_1],
                                }),
                            ).toEqual({
                                docs: [],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                    },
                ],
            }
        },
    ),
])
