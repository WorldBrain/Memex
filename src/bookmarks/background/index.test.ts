import expect from 'expect'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { createPageStep, searchModule } from 'src/tests/common-fixtures'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'

const bookmarks = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.bookmarks

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Bookmarks', [
    backgroundIntegrationTest(
        'should create a page, bookmark it, then retrieve it via a filtered search',
        () => {
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
        'should create a page, bookmark it, retrieve it via a filtered search, then unbookmark it, losing searchability',
        () => {
            return {
                steps: [
                    {
                        ...createPageStep,
                        // debug: true,
                    },
                    {
                        // debug: true,
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
                        expectedStorageOperations: () => [
                            (expect as any).objectContaining({
                                operation: [
                                    'createObject',
                                    'bookmarks',
                                    {
                                        url: DATA.PAGE_1.url,
                                        time: DATA.BOOKMARK_1,
                                    },
                                ],
                            }),
                        ],
                        expectedSyncLogEntries: () => [
                            expect.objectContaining({
                                collection: 'bookmarks',
                                operation: 'create',
                                pk: 'lorem.com',
                                value: {
                                    time: expect.any(Number),
                                },
                            }),
                        ],
                    },
                    {
                        // debug: true,
                        preCheck: async ({ setup }) => {
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
                            await bookmarks(setup).delBookmark({
                                url: DATA.PAGE_1.fullUrl,
                            })
                        },
                        expectedStorageChanges: {
                            bookmarks: (): StorageCollectionDiff => ({
                                [DATA.PAGE_1.url]: { type: 'delete' },
                            }),
                        },
                        expectedSyncLogEntries: () => [
                            expect.objectContaining({
                                collection: 'bookmarks',
                                operation: 'delete',
                                pk: 'lorem.com',
                            }),
                        ],
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
