import expect from 'expect'
import { Tabs } from 'webextension-polyfill-ts'

import * as DATA from 'src/tests/common-fixtures.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import {
    StorageCollectionDiff,
    createdVisit,
} from 'src/tests/storage-change-detector'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { PAGE_1_CREATION } from 'src/tests/common-fixtures.data'

describe('bookmarks background unit tests', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        includePostSyncProcessor: true,
    })

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
            await bookmarksBG.addBookmark({ fullUrl: mockTabs[index].url })
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

    it('bookmark add should attempt to create a page via XHR if missing and no tab ID provided', async ({
        device: { backgroundModules, fetchPageDataProcessor },
    }) => {
        // const { addBookmark, fetchPageData, pages } = await setup()
        const testUrl = 'test.com'
        const testFullUrl = 'http://test.com'

        await backgroundModules.pages.addPage({
            pageDoc: { url: testUrl, content: {} },
            rejectNoContent: false,
        })

        try {
            await backgroundModules.bookmarks.addPageBookmark({
                fullUrl: testFullUrl,
            })
        } catch (err) {
        } finally {
            expect(fetchPageDataProcessor.lastProcessedUrl).toEqual(testFullUrl)
        }
    })
})

function testSetupFactory() {
    return async ({ setup }: { setup: BackgroundIntegrationTestSetup }) => {
        await injectFakeTabs({
            tabManagement: setup.backgroundModules.tabManagement,
            tabsAPI: setup.browserAPIs.tabs,
            tabs: [DATA.TEST_TAB_1],
        })
    }
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Bookmarks', [
    backgroundIntegrationTest(
        'should create a page, bookmark it, then retrieve it via a filtered search',
        () => {
            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            await setup.backgroundModules.bookmarks.addBookmark(
                                {
                                    fullUrl: DATA.PAGE_1.fullUrl,
                                    timestamp: DATA.BOOKMARK_1,
                                    tabId: DATA.TEST_TAB_1.id,
                                },
                            )
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
                            pages: (): StorageCollectionDiff => ({
                                ...PAGE_1_CREATION,
                            }),
                            visits: () =>
                                createdVisit(DATA.BOOKMARK_1, DATA.PAGE_1.url),
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
                                await setup.backgroundModules.bookmarks.storage.pageHasBookmark(
                                    DATA.PAGE_1.fullUrl,
                                ),
                            ).toBe(true)
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
        'should bookmark a page, retrieve it via a filtered search, then unbookmark it, losing searchability',
        () => {
            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            await setup.backgroundModules.bookmarks.addBookmark(
                                {
                                    fullUrl: DATA.PAGE_1.fullUrl,
                                    timestamp: DATA.BOOKMARK_1,
                                    tabId: DATA.TEST_TAB_1.id,
                                },
                            )
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
                            visits: () =>
                                createdVisit(DATA.BOOKMARK_1, DATA.PAGE_1.url),
                            pages: (): StorageCollectionDiff => ({
                                ...PAGE_1_CREATION,
                            }),
                        },
                        expectedSyncLogEntries: () => [
                            expect.objectContaining({
                                collection: 'pages',
                                operation: 'create',
                            }),
                            expect.objectContaining({
                                collection: 'visits',
                                operation: 'create',
                            }),
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
                            await setup.backgroundModules.bookmarks.delBookmark(
                                {
                                    url: DATA.PAGE_1.fullUrl,
                                },
                            )
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
