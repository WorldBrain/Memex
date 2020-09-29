import expect from 'expect'
import { Tabs } from 'webextension-polyfill-ts'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { createPageStep } from 'src/tests/common-fixtures'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'

describe('bookmarks background unit tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to create a map of tab URLs to bookmark flags', async ({
        device,
    }) => {
        const { bookmarks: bookmarksBG } = device.backgroundModules

        const bmIndicies = [0, 2, 4]
        const mockTabs = [
            { url: 'https://test.com' },
            { url: 'chrome://extensions' },
            { url: 'https://test.com/1' },
            { url: 'https://test.com/2' },
            { url: 'https://test.com/3' },
            { url: 'https://worldbrain.io' },
        ] as Tabs.Tab[]

        for (const index of bmIndicies) {
            await bookmarksBG.addBookmark({ url: mockTabs[index].url })
        }

        expect(await bookmarksBG.findTabBookmarks(mockTabs)).toEqual(
            new Map(
                mockTabs.map((tab, index) => [
                    tab.url,
                    bmIndicies.includes(index),
                ]),
            ),
        )
    })
})

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
                                await setup.backgroundModules.search.searchPages(
                                    {
                                        bookmarksOnly: true,
                                    },
                                ),
                            ).toEqual({
                                docs: [],
                                totalCount: null,
                                resultsExhausted: true,
                            })
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await setup.backgroundModules.search.searchPages(
                                    {
                                        bookmarksOnly: true,
                                    },
                                ),
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
                                await setup.backgroundModules.search.searchPages(
                                    {
                                        bookmarksOnly: true,
                                    },
                                ),
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
                                await setup.backgroundModules.search.searchPages(
                                    {
                                        bookmarksOnly: true,
                                    },
                                ),
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
