import expect from 'expect'

import * as DATA from './index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'
import {
    FakeTab,
    injectFakeTabs,
} from 'src/tab-management/background/index.tests'
import { object } from '@storybook/addon-knobs'
import {
    PAGE_1_CREATION,
    PAGE_2_CREATION,
} from 'src/tests/common-fixtures.data'
import {
    SPECIAL_LIST_IDS,
    SPECIAL_LIST_NAMES,
} from '@worldbrain/memex-storage/lib/lists/constants'

const directLinking = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.directLinking
const customLists = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.customLists
const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search

let annotUrl!: string

function testSetupFactory() {
    return async ({ setup }: { setup: BackgroundIntegrationTestSetup }) => {
        await injectFakeTabs({
            tabManagement: setup.backgroundModules.tabManagement,
            tabsAPI: setup.browserAPIs.tabs,
            tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
        })
    }
}

const createAnnotationStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        annotUrl = await directLinking(setup).createAnnotation(
            { tab: DATA.TEST_TAB_1 },
            DATA.ANNOT_1 as any,
        )
    },
    expectedStorageChanges: {
        annotations: (): StorageCollectionDiff => ({
            [annotUrl]: {
                type: 'create',
                object: {
                    url: annotUrl,
                    pageUrl: DATA.PAGE_1.url,
                    pageTitle: DATA.ANNOT_1.title,
                    comment: DATA.ANNOT_1.comment,
                    _comment_terms: ['test', 'comment'],
                    _pageTitle_terms: ['test'],
                    body: undefined,
                    selector: undefined,
                    createdWhen: expect.any(Date),
                    lastEdited: expect.any(Date),
                },
            },
        }),
        pages: (): StorageCollectionDiff => PAGE_1_CREATION,
        visits: (): StorageCollectionDiff => expect.anything(),
        customLists: (): StorageCollectionDiff => ({
            [SPECIAL_LIST_IDS.INBOX]: {
                type: 'create',
                object: {
                    createdAt: expect.any(Date),
                    name: SPECIAL_LIST_NAMES.INBOX,
                    id: SPECIAL_LIST_IDS.INBOX,
                    searchableName: SPECIAL_LIST_NAMES.INBOX,
                    nameTerms: [SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase()],
                    isDeletable: false,
                    isNestable: false,
                },
            },
        }),
        pageListEntries: (): StorageCollectionDiff => ({
            [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                type: 'create',
                object: {
                    createdAt: expect.any(Date),
                    fullUrl: DATA.PAGE_1.fullUrl,
                    listId: SPECIAL_LIST_IDS.INBOX,
                    pageUrl: DATA.PAGE_1.url,
                },
            },
        }),
    },
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite('Annotations', [
    backgroundIntegrationTest(
        'should create a page, create a highlight, then retrieve it via a search',
        () => {
            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            annotUrl = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_1 },
                                DATA.HIGHLIGHT_1 as any,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrl,
                                        pageUrl: DATA.PAGE_1.url,
                                        pageTitle: DATA.HIGHLIGHT_1.title,
                                        _pageTitle_terms: ['test'],
                                        body: DATA.HIGHLIGHT_1.body,
                                        _body_terms: ['test', 'body'],
                                        comment: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [SPECIAL_LIST_IDS.INBOX]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        searchableName:
                                            SPECIAL_LIST_NAMES.INBOX,
                                        nameTerms: [
                                            SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase(),
                                        ],
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_1.url,
                                    },
                                },
                            }),
                            pages: (): StorageCollectionDiff => PAGE_1_CREATION,
                            visits: (): StorageCollectionDiff =>
                                expect.anything(),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchAnnotations({
                                    query: 'body',
                                }),
                            ).toEqual({
                                docs: [
                                    {
                                        annotations: [
                                            {
                                                url: annotUrl,
                                                _body_terms: ['test', 'body'],
                                                _pageTitle_terms: ['test'],
                                                body: 'test body',
                                                comment: undefined,
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                        annotsCount: 1,
                                        displayTime: expect.any(Number),
                                        favIcon: undefined,
                                        hasBookmark: false,
                                        pageId: 'lorem.com',
                                        screenshot: undefined,
                                        tags: [],
                                        lists: [SPECIAL_LIST_NAMES.INBOX],
                                        title: undefined,
                                        url: 'lorem.com',
                                        fullUrl: DATA.PAGE_1.fullUrl,
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
        'should create a page, create an annotation, edit its note, then retrieve it via a search',
        () => {
            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).editAnnotation(
                                {},
                                annotUrl,
                                'updated comment',
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'modify',
                                    updates: {
                                        comment: 'updated comment',
                                        _comment_terms: expect.any(Object),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await searchModule(setup).searchAnnotations({
                                    query: 'comment',
                                }),
                            ).toEqual({
                                docs: [
                                    {
                                        annotations: [
                                            {
                                                url: annotUrl,
                                                _comment_terms: [
                                                    'updated',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'updated comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                        annotsCount: 1,
                                        displayTime: expect.any(Number),
                                        favIcon: undefined,
                                        hasBookmark: false,
                                        pageId: 'lorem.com',
                                        screenshot: undefined,
                                        tags: [],
                                        lists: [SPECIAL_LIST_NAMES.INBOX],
                                        title: undefined,
                                        url: 'lorem.com',
                                        fullUrl: DATA.PAGE_1.fullUrl,
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
        'should create a page, create an annotation, edit its note, then retrieve it via a filtered search on edit time',
        () => {
            const runFilteredTimeSearch = (setup) =>
                searchModule(setup).searchAnnotations({
                    startDate: DATA.ANNOT_1.createdWhen.getTime() + 1000,
                })

            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        preCheck: async ({ setup }) => {
                            const searchResults = await runFilteredTimeSearch(
                                setup,
                            )

                            expect(searchResults).toEqual({
                                annotsByDay: {},
                                docs: [],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            })
                        },
                        execute: async ({ setup }) => {
                            await directLinking(setup).editAnnotation(
                                {},
                                annotUrl,
                                'updated comment',
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'modify',
                                    updates: {
                                        comment: 'updated comment',
                                        _comment_terms: expect.any(Object),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResults = await runFilteredTimeSearch(
                                setup,
                            )

                            const firstDay = Object.keys(
                                searchResults['annotsByDay'],
                            )[0]

                            expect(searchResults).toEqual({
                                annotsByDay: {
                                    [firstDay]: {
                                        ['lorem.com']: [
                                            {
                                                url: annotUrl,
                                                _comment_terms: [
                                                    'updated',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'updated comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
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
        'should create a page, create an annotation, tag it, retrieve it via a filtered search, then untag it, no longer being able to retrieve it via the same search',
        () => {
            const runFilteredTagSearch = (setup) =>
                searchModule(setup).searchAnnotations({
                    tagsInc: [DATA.TAG_1],
                })

            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).addTagForAnnotation(
                                {},
                                { tag: DATA.TAG_1, url: annotUrl },
                            )
                        },
                        expectedStorageChanges: {
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${annotUrl}"]`]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrl,
                                        name: DATA.TAG_1,
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResults = await runFilteredTagSearch(
                                setup,
                            )

                            const firstDay = Object.keys(
                                searchResults['annotsByDay'],
                            )[0]
                            expect(searchResults).toEqual({
                                annotsByDay: {
                                    [firstDay]: {
                                        ['lorem.com']: [
                                            {
                                                url: annotUrl,
                                                _comment_terms: [
                                                    'test',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'test comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [DATA.TAG_1],
                                            },
                                        ],
                                    },
                                },
                                docs: [
                                    {
                                        annotations: [expect.anything()],
                                        annotsCount: 1,
                                        displayTime: expect.any(Number),
                                        favIcon: undefined,
                                        hasBookmark: false,
                                        pageId: 'lorem.com',
                                        screenshot: undefined,
                                        tags: [],
                                        lists: [SPECIAL_LIST_NAMES.INBOX],
                                        title: undefined,
                                        url: 'lorem.com',
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                    },
                                ],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            })
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).delTagForAnnotation(
                                {},
                                { tag: DATA.TAG_1, url: annotUrl },
                            )
                        },
                        expectedStorageChanges: {
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${annotUrl}"]`]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResults = await runFilteredTagSearch(
                                setup,
                            )

                            expect(searchResults).toEqual({
                                resultsExhausted: true,
                                isAnnotsSearch: true,
                                totalCount: null,
                                annotsByDay: {},
                                docs: [],
                            })
                        },
                    },
                ],
            }
        },
    ),
    backgroundIntegrationTest(
        'should create a page, create an annotation, bookmark it, then retrieve it via a filtered search',
        () => {
            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).toggleAnnotBookmark(
                                {},
                                {
                                    url: annotUrl,
                                },
                            )
                        },
                        expectedStorageChanges: {
                            annotBookmarks: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrl,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResults = await searchModule(
                                setup,
                            ).searchAnnotations({
                                bookmarksOnly: true,
                            })

                            const firstDay = Object.keys(
                                searchResults['annotsByDay'],
                            )[0]
                            expect(searchResults).toEqual({
                                annotsByDay: {
                                    [firstDay]: {
                                        'lorem.com': [
                                            {
                                                url: annotUrl,
                                                _comment_terms: [
                                                    'test',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'test comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: true,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                    },
                                },
                                docs: [
                                    {
                                        annotations: [expect.anything()],
                                        annotsCount: 1,
                                        displayTime: expect.any(Number),
                                        favIcon: undefined,
                                        hasBookmark: false,
                                        pageId: 'lorem.com',
                                        screenshot: undefined,
                                        tags: [],
                                        lists: [SPECIAL_LIST_NAMES.INBOX],
                                        title: undefined,
                                        url: 'lorem.com',
                                        fullUrl: 'https://www.lorem.com',
                                    },
                                ],
                                isAnnotsSearch: true,
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
        'should create a page, create an annotation, tag+star+add it to list, then delete it - deleting all assoc. data',
        () => {
            let listId: number
            const findAllObjects = (collection, setup) =>
                setup.storageManager.collection(collection).findObjects({})

            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).toggleAnnotBookmark(
                                {},
                                {
                                    url: annotUrl,
                                },
                            )
                            await directLinking(setup).addTagForAnnotation(
                                {},
                                { tag: DATA.TAG_1, url: annotUrl },
                            )
                            listId = await customLists(setup).createCustomList({
                                name: 'test',
                            })
                            await directLinking(setup).insertAnnotToList(
                                {},
                                {
                                    listId,
                                    url: annotUrl,
                                },
                            )
                        },
                        expectedStorageChanges: {
                            annotBookmarks: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrl,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${annotUrl}"]`]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrl,
                                        name: DATA.TAG_1,
                                    },
                                },
                            }),
                            annotListEntries: (): StorageCollectionDiff => ({
                                [`[${listId},"${annotUrl}"]`]: {
                                    type: 'create',
                                    object: {
                                        listId,
                                        url: annotUrl,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [listId]: {
                                    type: 'create',
                                    object: {
                                        id: listId,
                                        name: 'test',
                                        searchableName: 'test',
                                        nameTerms: ['test'],
                                        isDeletable: true,
                                        isNestable: true,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).deleteAnnotation(
                                {},
                                annotUrl,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'delete',
                                },
                            }),
                            annotBookmarks: (): StorageCollectionDiff => ({
                                [annotUrl]: {
                                    type: 'delete',
                                },
                            }),
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${annotUrl}"]`]: {
                                    type: 'delete',
                                },
                            }),
                            annotListEntries: (): StorageCollectionDiff => ({
                                [`[${listId},"${annotUrl}"]`]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await findAllObjects('annotations', setup),
                            ).toEqual([])
                            expect(
                                await findAllObjects('annotBookmarks', setup),
                            ).toEqual([])
                            expect(
                                await findAllObjects('annotListEntries', setup),
                            ).toEqual([])
                            expect(await findAllObjects('tags', setup)).toEqual(
                                [],
                            )
                        },
                    },
                ],
            }
        },
    ),
    backgroundIntegrationTest(
        'should create a page, create 2 annotations, then delete one of them, leaving the other',
        () => {
            let annotAUrl: string
            let annotBUrl: string

            const { url, ...testAnnot } = DATA.ANNOT_1

            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            annotAUrl = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_1 },
                                testAnnot,
                            )
                            annotBUrl = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_1 },
                                testAnnot,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotAUrl]: {
                                    type: 'create',
                                    object: {
                                        url: annotAUrl,
                                        pageUrl: DATA.PAGE_1.url,
                                        pageTitle: testAnnot.title,
                                        comment: testAnnot.comment,
                                        _comment_terms: ['test', 'comment'],
                                        _pageTitle_terms: ['test'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                                [annotBUrl]: {
                                    type: 'create',
                                    object: {
                                        url: annotBUrl,
                                        pageUrl: DATA.PAGE_1.url,
                                        pageTitle: testAnnot.title,
                                        comment: testAnnot.comment,
                                        _comment_terms: ['test', 'comment'],
                                        _pageTitle_terms: ['test'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [SPECIAL_LIST_IDS.INBOX]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        searchableName:
                                            SPECIAL_LIST_NAMES.INBOX,
                                        nameTerms: [
                                            SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase(),
                                        ],
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_1.url,
                                    },
                                },
                            }),
                            pages: (): StorageCollectionDiff => PAGE_1_CREATION,
                            visits: (): StorageCollectionDiff =>
                                expect.anything(),
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).deleteAnnotation(
                                {},
                                annotAUrl,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotAUrl]: {
                                    type: 'delete',
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            expect(
                                await setup.storageManager
                                    .collection('annotations')
                                    .findObjects({}),
                            ).toEqual([
                                {
                                    url: annotBUrl,
                                    pageUrl: DATA.PAGE_1.url,
                                    pageTitle: testAnnot.title,
                                    comment: testAnnot.comment,
                                    _comment_terms: ['test', 'comment'],
                                    _pageTitle_terms: ['test'],
                                    body: undefined,
                                    selector: undefined,
                                    createdWhen: expect.any(Date),
                                    lastEdited: expect.any(Date),
                                },
                            ])
                        },
                    },
                ],
            }
        },
    ),
    backgroundIntegrationTest(
        "should create a page, create an annotation, add page to a list, then retrieve page's annotation via a filtered search",
        () => {
            let listId: number

            return {
                setup: testSetupFactory(),
                steps: [
                    createAnnotationStep,
                    {
                        execute: async ({ setup }) => {
                            listId = await customLists(setup).createCustomList({
                                name: 'test',
                            })
                            await customLists(setup).insertPageToList({
                                id: listId,
                                url: DATA.PAGE_1.fullUrl,
                                tabId: DATA.TEST_TAB_1.id,
                            })
                        },
                        expectedStorageChanges: {
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${listId},"${DATA.ANNOT_1.pageUrl}"]`]: {
                                    type: 'create',
                                    object: {
                                        listId,
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        pageUrl: DATA.ANNOT_1.pageUrl,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [listId]: {
                                    type: 'create',
                                    object: {
                                        id: listId,
                                        name: 'test',
                                        searchableName: 'test',
                                        nameTerms: ['test'],
                                        isDeletable: true,
                                        isNestable: true,
                                        createdAt: expect.any(Date),
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResults = await searchModule(
                                setup,
                            ).searchAnnotations({
                                lists: [listId],
                            })

                            const firstDay = Object.keys(
                                searchResults['annotsByDay'],
                            )[0]

                            expect(searchResults).toEqual({
                                annotsByDay: {
                                    [firstDay]: {
                                        'lorem.com': [
                                            {
                                                url: annotUrl,
                                                _comment_terms: [
                                                    'test',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'test comment',
                                                createdWhen: expect.any(Date),
                                                lastEdited: expect.any(Date),
                                                hasBookmark: false,
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
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
        'should create a page, create 2 annotations, tag them differently, then retrieve them with a mix of filtered tag searches',
        () => {
            let annotUrlA: string
            let annotUrlB: string

            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            annotUrlA = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_1 },
                                DATA.ANNOT_1,
                            )
                            annotUrlB = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_2 },
                                DATA.ANNOT_2,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrlA]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrlA,
                                        pageUrl: DATA.ANNOT_1.pageUrl,
                                        pageTitle: DATA.ANNOT_1.title,
                                        comment: DATA.ANNOT_1.comment,
                                        _comment_terms: ['test', 'comment'],
                                        _pageTitle_terms: ['test'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                                [annotUrlB]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrlB,
                                        pageUrl: DATA.ANNOT_2.pageUrl,
                                        pageTitle: DATA.ANNOT_2.title,
                                        comment: DATA.ANNOT_2.comment,
                                        _comment_terms: ['test', 'text'],
                                        _pageTitle_terms: ['annotation'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [SPECIAL_LIST_IDS.INBOX]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        searchableName:
                                            SPECIAL_LIST_NAMES.INBOX,
                                        nameTerms: [
                                            SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase(),
                                        ],
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_1.url,
                                    },
                                },
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_2.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_2.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_2.url,
                                    },
                                },
                            }),
                            pages: (): StorageCollectionDiff => ({
                                ...PAGE_1_CREATION,
                                ...PAGE_2_CREATION,
                            }),
                            visits: (): StorageCollectionDiff =>
                                expect.anything(),
                        },
                    },
                    {
                        execute: async ({ setup }) => {
                            await directLinking(setup).addTagForAnnotation(
                                {},
                                { tag: DATA.TAG_1, url: annotUrlA },
                            )
                            await directLinking(setup).addTagForAnnotation(
                                {},
                                { tag: DATA.TAG_2, url: annotUrlB },
                            )
                        },
                        expectedStorageChanges: {
                            tags: (): StorageCollectionDiff => ({
                                [`["${DATA.TAG_1}","${annotUrlA}"]`]: {
                                    type: 'create',
                                    object: {
                                        name: DATA.TAG_1,
                                        url: annotUrlA,
                                    },
                                },
                                [`["${DATA.TAG_2}","${annotUrlB}"]`]: {
                                    type: 'create',
                                    object: {
                                        name: DATA.TAG_2,
                                        url: annotUrlB,
                                    },
                                },
                            }),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResultsA = await searchModule(
                                setup,
                            ).searchAnnotations({
                                tagsInc: [DATA.TAG_1],
                            })
                            const searchResultsB = await searchModule(
                                setup,
                            ).searchAnnotations({
                                tagsInc: [DATA.TAG_2],
                            })
                            const searchResultsC = await searchModule(
                                setup,
                            ).searchAnnotations({
                                tagsExc: [DATA.TAG_1],
                            })
                            const searchResultsD = await searchModule(
                                setup,
                            ).searchAnnotations({
                                tagsExc: [DATA.TAG_2],
                            })

                            const firstDay = Object.keys(
                                searchResultsA['annotsByDay'],
                            )[0]

                            const expectedResultAnnotA = {
                                annotsByDay: {
                                    [firstDay]: {
                                        ['lorem.com']: [
                                            {
                                                url: annotUrlA,
                                                _comment_terms: [
                                                    'test',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'test comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [DATA.TAG_1],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            }

                            const expectedResultAnnotB = {
                                annotsByDay: {
                                    [firstDay]: {
                                        ['test.com']: [
                                            {
                                                url: annotUrlB,
                                                _comment_terms: [
                                                    'test',
                                                    'text',
                                                ],
                                                _pageTitle_terms: [
                                                    'annotation',
                                                ],
                                                body: undefined,
                                                comment: 'some test text',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'annotation',
                                                pageUrl: 'test.com',
                                                selector: undefined,
                                                tags: [DATA.TAG_2],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            }

                            expect(searchResultsA).toEqual(expectedResultAnnotA)
                            expect(searchResultsB).toEqual(expectedResultAnnotB)
                            expect(searchResultsC).toEqual(expectedResultAnnotB)
                            expect(searchResultsD).toEqual(expectedResultAnnotA)
                        },
                    },
                ],
            }
        },
    ),
    backgroundIntegrationTest(
        'should create 2 pages on different domains, create an annotation for each, then retrieve them via a mix of filtered domain searches',
        () => {
            let annotUrlA: string
            let annotUrlB: string

            return {
                setup: testSetupFactory(),
                steps: [
                    {
                        execute: async ({ setup }) => {
                            annotUrlA = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_1 },
                                DATA.ANNOT_1,
                            )
                            annotUrlB = await directLinking(
                                setup,
                            ).createAnnotation(
                                { tab: DATA.TEST_TAB_2 },
                                DATA.ANNOT_2,
                            )
                        },
                        expectedStorageChanges: {
                            annotations: (): StorageCollectionDiff => ({
                                [annotUrlA]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrlA,
                                        pageUrl: DATA.PAGE_1.url,
                                        pageTitle: DATA.ANNOT_1.title,
                                        comment: DATA.ANNOT_1.comment,
                                        _comment_terms: ['test', 'comment'],
                                        _pageTitle_terms: ['test'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                                [annotUrlB]: {
                                    type: 'create',
                                    object: {
                                        url: annotUrlB,
                                        pageUrl: DATA.PAGE_2.url,
                                        pageTitle: DATA.ANNOT_2.title,
                                        comment: DATA.ANNOT_2.comment,
                                        _comment_terms: ['test', 'text'],
                                        _pageTitle_terms: ['annotation'],
                                        body: undefined,
                                        selector: undefined,
                                        createdWhen: expect.any(Date),
                                        lastEdited: expect.any(Date),
                                    },
                                },
                            }),
                            customLists: (): StorageCollectionDiff => ({
                                [SPECIAL_LIST_IDS.INBOX]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        name: SPECIAL_LIST_NAMES.INBOX,
                                        id: SPECIAL_LIST_IDS.INBOX,
                                        searchableName:
                                            SPECIAL_LIST_NAMES.INBOX,
                                        nameTerms: [
                                            SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase(),
                                        ],
                                        isDeletable: false,
                                        isNestable: false,
                                    },
                                },
                            }),
                            pageListEntries: (): StorageCollectionDiff => ({
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_1.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_1.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_1.url,
                                    },
                                },
                                [`[${SPECIAL_LIST_IDS.INBOX},"${DATA.PAGE_2.url}"]`]: {
                                    type: 'create',
                                    object: {
                                        createdAt: expect.any(Date),
                                        fullUrl: DATA.PAGE_2.fullUrl,
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        pageUrl: DATA.PAGE_2.url,
                                    },
                                },
                            }),
                            pages: (): StorageCollectionDiff => ({
                                ...PAGE_1_CREATION,
                                ...PAGE_2_CREATION,
                            }),
                            visits: (): StorageCollectionDiff =>
                                expect.anything(),
                        },
                        postCheck: async ({ setup }) => {
                            const searchResultsA = await searchModule(
                                setup,
                            ).searchAnnotations({
                                domains: [DATA.PAGE_1.url],
                            })
                            const searchResultsB = await searchModule(
                                setup,
                            ).searchAnnotations({
                                domains: [DATA.PAGE_2.url],
                            })
                            const searchResultsC = await searchModule(
                                setup,
                            ).searchAnnotations({
                                domainsExclude: [DATA.PAGE_1.url],
                            })
                            const searchResultsD = await searchModule(
                                setup,
                            ).searchAnnotations({
                                domainsExclude: [DATA.PAGE_2.url],
                            })

                            const firstDay = Object.keys(
                                searchResultsA['annotsByDay'],
                            )[0]

                            const expectedResultAnnotA = {
                                annotsByDay: {
                                    [firstDay]: {
                                        ['lorem.com']: [
                                            {
                                                url: annotUrlA,
                                                _comment_terms: [
                                                    'test',
                                                    'comment',
                                                ],
                                                _pageTitle_terms: ['test'],
                                                body: undefined,
                                                comment: 'test comment',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'test',
                                                pageUrl: 'lorem.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            }

                            const expectedResultAnnotB = {
                                annotsByDay: {
                                    [firstDay]: {
                                        ['test.com']: [
                                            {
                                                url: annotUrlB,
                                                _comment_terms: [
                                                    'test',
                                                    'text',
                                                ],
                                                _pageTitle_terms: [
                                                    'annotation',
                                                ],
                                                body: undefined,
                                                comment: 'some test text',
                                                createdWhen: expect.any(Date),
                                                hasBookmark: false,
                                                lastEdited: expect.any(Date),
                                                pageTitle: 'annotation',
                                                pageUrl: 'test.com',
                                                selector: undefined,
                                                tags: [],
                                            },
                                        ],
                                    },
                                },
                                docs: [expect.any(Object)],
                                isAnnotsSearch: true,
                                resultsExhausted: true,
                                totalCount: null,
                            }

                            expect(searchResultsA).toEqual(expectedResultAnnotA)
                            expect(searchResultsB).toEqual(expectedResultAnnotB)
                            expect(searchResultsC).toEqual(expectedResultAnnotB)
                            expect(searchResultsD).toEqual(expectedResultAnnotA)
                        },
                    },
                ],
            }
        },
    ),
])
