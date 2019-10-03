import expect from 'expect'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { createPageStep, searchModule } from 'src/tests/common-fixtures'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Bookmarks', [
    backgroundIntegrationTest(
        'should create a page, bookmark it, retrieve it via a filtered search, and unbookmark it',
        () => {
            const bookmarks = (setup: BackgroundIntegrationTestSetup) =>
                setup.backgroundModules.bookmarks

            return {
                steps: [
                    createPageStep,
                    {
                        execute: async ({ setup }) => {
                            await bookmarks(setup).addBookmark({
                                url: DATA.PAGE_1.fullUrl,
                                time: DATA.BOOKMARK_1,
                            })
                        },
                        expectedStorageChanges: {
                            bookmarks: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: {
                                    type: 'create',
                                    object: {
                                        url: DATA.PAGE_1.url,
                                        time: DATA.BOOKMARK_1,
                                    },
                                },
                            }),
                        },
                        preCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    bookmarksOnly: true,
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
                                    bookmarksOnly: true,
                                }),
                            ).toEqual({
                                docs: [
                                    {
                                        annotations: [],
                                        annotsCount: undefined,
                                        displayTime: DATA.BOOKMARK_1,
                                        favIcon: undefined,
                                        hasBookmark: true,
                                        screenshot: undefined,
                                        tags: [],
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
                            await bookmarks(setup).delBookmark({
                                url: DATA.PAGE_1.fullUrl,
                            })
                        },
                        expectedStorageChanges: {
                            bookmarks: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: { type: 'delete' },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchPages({
                                    bookmarksOnly: true,
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
