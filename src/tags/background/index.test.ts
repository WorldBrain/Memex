import expect from 'expect'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { createPageStep, searchModule } from 'src/tests/common-fixtures'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'

const tags = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.tags

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Tags', [
    backgroundIntegrationTest(
        'should create a page, tag it, then retrieve it via a filtered search',
        () => {
            return {
                steps: [
                    createPageStep,
                    {
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
                        execute: async ({ setup }) => {
                            await tags(
                                setup,
                            ).remoteFunctions.addTagToExistingUrl({
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
                                        lists: [],
                                        title: undefined,
                                        url: DATA.PAGE_1.url,
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                    },
                                ],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                    },
                ],
            }
        },
    ),

    backgroundIntegrationTest(
        'should create a page, tag it, retrieve it via a filtered search, then untag it, losing searchability',
        () => {
            return {
                steps: [
                    createPageStep,
                    {
                        execute: async ({ setup }) => {
                            await tags(
                                setup,
                            ).remoteFunctions.addTagToExistingUrl({
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
                    },
                    {
                        preCheck: async ({ setup }) => {
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
                                        lists: [],
                                        title: undefined,
                                        url: DATA.PAGE_1.url,
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                    },
                                ],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                        execute: async ({ setup }) => {
                            await tags(setup).remoteFunctions.delTag({
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

    backgroundIntegrationTest('should add tags to open tabs', () => {
        return {
            steps: [
                {
                    execute: async ({ setup }) => {
                        tags(setup)._createPageFromTab =
                            setup.backgroundModules.search.searchIndex.createTestPage
                        await tags(setup).remoteFunctions.addTagsToOpenTabs({
                            name: 'ninja',
                            tabs: [
                                { tabId: 1, url: 'http://www.bar.com/eggs' },
                                { tabId: 2, url: 'http://www.foo.com/spam' },
                            ],
                            time: 555,
                        })
                    },
                    postCheck: async ({ setup }) => {
                        const stored = {
                            pages: await setup.storageManager
                                .collection('pages')
                                .findObjects({}, { order: [['url', 'asc']] }),
                            tags: await setup.storageManager
                                .collection('tags')
                                .findObjects({}, { order: [['url', 'asc']] }),
                            visits: await setup.storageManager
                                .collection('visits')
                                .findObjects({}, { order: [['url', 'asc']] }),
                        }
                        expect(stored).toEqual({
                            pages: [
                                expect.objectContaining({
                                    url: 'bar.com/eggs',
                                }),
                                expect.objectContaining({
                                    url: 'foo.com/spam',
                                }),
                            ],
                            tags: [
                                expect.objectContaining({
                                    name: 'ninja',
                                    url: 'bar.com/eggs',
                                }),
                                expect.objectContaining({
                                    name: 'ninja',
                                    url: 'foo.com/spam',
                                }),
                            ],
                            visits: [
                                expect.objectContaining({
                                    url: 'bar.com/eggs',
                                    time: 555,
                                }),
                                expect.objectContaining({
                                    url: 'foo.com/spam',
                                    time: 555,
                                }),
                            ],
                        })
                    },
                },
            ],
        }
    }),
])
