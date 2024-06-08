import fromPairs from 'lodash/fromPairs'
import { FakeAnalytics } from 'src/analytics/mock'
import { SidebarContainerLogic, INIT_FORM_STATE } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
    insertBackgroundFunctionTab,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { PageAnnotationsCache } from 'src/annotations/cache'
import * as cacheUtils from 'src/annotations/cache/utils'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    generateAnnotationCardInstanceId,
    initAnnotationCardInstance,
    initListInstance,
} from './utils'
import { generateAnnotationUrl } from 'src/annotations/utils'
import type { AnnotationCardMode } from './types'
import type {
    AnnotationSharingState,
    AnnotationSharingStates,
} from 'src/content-sharing/background/types'
import { createPageLinkListTitle } from 'src/content-sharing/utils'
import { theme } from 'src/common-ui/components/design-library/theme'
import { WindowMock } from 'src/util/window-api-mock'
import { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import { HighlightRenderer } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/renderer'

const mapLocalListIdsToUnified = (
    localListIds: number[],
    cache: PageAnnotationsCache,
): string[] =>
    localListIds.map(
        (localListId) =>
            Object.values(cache.lists.byId).find(
                (list) => list.localId === localListId,
            )?.unifiedId ?? `cached list not found for ID: ${localListId}`,
    )

const mapLocalAnnotIdsToUnified = (
    localAnnotIds: string[],
    cache: PageAnnotationsCache,
): string[] =>
    localAnnotIds.map(
        (localAnnotId) =>
            Object.values(cache.annotations.byId).find(
                (annot) => annot.localId === localAnnotId,
            )?.unifiedId ?? `cached annot not found for ID: ${localAnnotId}`,
    )

const setupLogicHelper = async ({
    device,
    withAuth,
    fullPageUrl = DATA.TAB_URL_1,
    skipTestData = false,
    skipInitEvent = false,
    focusEditNoteForm = () => undefined,
    focusCreateForm = () => undefined,
    copyToClipboard = () => undefined,
}: {
    device: UILogicTestDevice
    fullPageUrl?: string
    skipTestData?: boolean
    withAuth?: boolean
    skipInitEvent?: boolean
    focusEditNoteForm?: (annotationId: string) => void
    focusCreateForm?: () => void
    copyToClipboard?: (text: string) => Promise<boolean>
}) => {
    const { backgroundModules, browserAPIs } = device

    const annotationsBG = insertBackgroundFunctionTab(
        device.backgroundModules.directLinking.remoteFunctions,
    ) as any

    const annotationsCache = new PageAnnotationsCache({})

    const emittedEvents: Array<{ event: string; args: any }> = []
    const fakeEmitter = {
        emit: (event: string, args: any) => emittedEvents.push({ event, args }),
    }

    if (withAuth) {
        await device.backgroundModules.auth.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
        await device.backgroundModules.auth.remoteFunctions.updateUserProfile(
            TEST_USER,
        )
    }

    if (!skipTestData) {
        await setupTestData(device)
    }

    const windowAPI = new WindowMock({ fullPageUrl })

    const analytics = new FakeAnalytics()
    const sidebarLogic = new SidebarContainerLogic({
        theme: theme({ variant: 'dark' }),
        fullPageUrl,
        sidebarContext: 'in-page',
        shouldHydrateCacheOnInit: true,
        analyticsBG: backgroundModules.analyticsBG,
        authBG: backgroundModules.auth.remoteFunctions,
        subscription: backgroundModules.auth.subscriptionService,
        copyPasterBG: backgroundModules.copyPaster.remoteFunctions,
        bgScriptBG: insertBackgroundFunctionTab(
            backgroundModules.bgScript.remoteFunctions,
        ) as any,
        pkmSyncBG: backgroundModules.pkmSyncBG.remoteFunctions,
        highlighter: null,
        summarizeBG: insertBackgroundFunctionTab(
            backgroundModules.summarizeBG.remoteFunctions,
        ) as any,
        browserAPIs: device.browserAPIs,
        windowAPI,
        customListsBG: backgroundModules.customLists.remoteFunctions,
        contentSharingBG: backgroundModules.contentSharing.remoteFunctions,
        contentSharingByTabsBG: insertBackgroundFunctionTab(
            backgroundModules.contentSharing.remoteFunctionsByTab,
        ) as any,
        pageActivityIndicatorBG:
            backgroundModules.pageActivityIndicator.remoteFunctions,
        contentScriptsBG: insertBackgroundFunctionTab(
            backgroundModules.contentScripts.remoteFunctions,
        ) as any,
        contentConversationsBG:
            backgroundModules.contentConversations.remoteFunctions,
        syncSettingsBG: backgroundModules.syncSettings,
        pageIndexingBG: {
            getOriginalUrlForPdfPage:
                backgroundModules.pages.getOriginalUrlForPdfPage,
            setEntityOrder: backgroundModules.pages.setEntityOrder,
            fetchPageMetadataByDOI:
                backgroundModules.pages.fetchPageMetadataByDOI,
            updatePageMetadata: backgroundModules.pages.updatePageMetadata,
            getPageMetadata: backgroundModules.pages.getPageMetadata,
            updatePageTitle: backgroundModules.pages.updatePageTitle,
            getTitleForPage: backgroundModules.pages.getTitleForPage,
            getFirstAccessTimeForPage:
                backgroundModules.pages.getFirstAccessTimeForPage,
            initContentIdentifier:
                backgroundModules.pages.initContentIdentifier,
            waitForContentIdentifier:
                backgroundModules.pages.waitForContentIdentifier,
        },
        getCurrentUser: () => (withAuth ? DATA.CREATOR_1 : null),
        annotationsBG: annotationsBG,
        events: fakeEmitter as any,
        runtimeAPI: browserAPIs.runtime,
        storageAPI: browserAPIs.storage,
        annotationsCache,
        analytics,
        initialState: 'hidden',
        searchResultLimit: 10,
        focusEditNoteForm,
        focusCreateForm,
        copyToClipboard,
        imageSupportBG: insertBackgroundFunctionTab(
            backgroundModules.imageSupport.remoteFunctions,
        ) as any,
        getRootElement: null,
    })

    const sidebar = device.createElement(sidebarLogic)

    if (!skipInitEvent) {
        await sidebar.init()
    }
    return { sidebar, sidebarLogic, analytics, annotationsCache, emittedEvents }
}

async function setupTestData({
    storageManager,
    serverStorage,
}: UILogicTestDevice) {
    const { manager: serverStorageManager } = serverStorage
    for (const entry of DATA.SHARED_ANNOTATION_LIST_ENTRIES) {
        await serverStorageManager
            .collection('sharedAnnotationListEntry')
            .createObject(entry)
    }
    for (const annot of DATA.SHARED_ANNOTATIONS) {
        await serverStorageManager
            .collection('sharedAnnotation')
            .createObject(annot)
    }
    for (const page of DATA.PAGES) {
        await storageManager.collection('pages').createObject(page)
    }
    for (const annot of DATA.LOCAL_ANNOTATIONS) {
        await storageManager.collection('annotations').createObject(annot)
    }
    for (const annotMetadata of DATA.ANNOT_METADATA) {
        await storageManager
            .collection('sharedAnnotationMetadata')
            .createObject(annotMetadata)
    }
    for (const privacyLevel of DATA.ANNOT_PRIVACY_LVLS) {
        await storageManager
            .collection('annotationPrivacyLevels')
            .createObject(privacyLevel)
    }
    for (const list of DATA.LOCAL_LISTS) {
        await storageManager.collection('customLists').createObject(list)
    }
    for (const description of DATA.LIST_DESCRIPTIONS) {
        await storageManager
            .collection('customListDescriptions')
            .createObject(description)
    }
    for (const listMetadata of DATA.TEST_LIST_METADATA) {
        await storageManager
            .collection('sharedListMetadata')
            .createObject(listMetadata)
    }
    for (const entry of DATA.PAGE_LIST_ENTRIES) {
        await storageManager.collection('pageListEntries').createObject(entry)
    }
    for (const entry of DATA.ANNOT_LIST_ENTRIES) {
        await storageManager.collection('annotListEntries').createObject(entry)
    }
    for (const list of DATA.FOLLOWED_LISTS) {
        await storageManager.collection('followedList').createObject(list)
    }
    for (const entry of DATA.FOLLOWED_LIST_ENTRIES) {
        await storageManager.collection('followedListEntry').createObject(entry)
    }
}

describe('SidebarContainerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        // includePostSyncProcessor: true,
    })

    describe('misc sidebar functionality', () => {
        // TODO: Fix this test BG
        it(
            'should be able to trigger annotation sorting',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                })
                const testPageUrl = 'testurl'
                expect(4).toBe(2)

                const dummyAnnots = [
                    { url: 'test1', createdWhen: 1, pageUrl: testPageUrl },
                    { url: 'test2', createdWhen: 2, pageUrl: testPageUrl },
                    { url: 'test3', createdWhen: 3, pageUrl: testPageUrl },
                    { url: 'test4', createdWhen: 4, pageUrl: testPageUrl },
                ] as any

                for (const annot of dummyAnnots) {
                    await device.storageManager
                        .collection('annotations')
                        .createObject(annot)
                }

                expect(4).toBe(2)
                // await annotationsCache.load(testPageUrl)

                const projectUrl = (a) => a.url

                await sidebar.processEvent('sortAnnotations', {
                    sortingFn: (a, b) => +a.createdWhen - +b.createdWhen,
                })
                // expect(sidebar.state.annotations.map(projectUrl)).toEqual([
                //     'test1',
                //     'test2',
                //     'test3',
                //     'test4',
                // ])

                // await sidebar.processEvent('sortAnnotations', {
                //     sortingFn: (a, b) => +b.createdWhen - +a.createdWhen,
                // })
                // expect(sidebar.state.annotations.map(projectUrl)).toEqual([
                //     'test4',
                //     'test3',
                //     'test2',
                //     'test1',
                // ])
            },
            { shouldSkip: true },
        )

        it('should be able to toggle sidebar lock', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.isLocked).toBe(false)
            await sidebar.processEvent('lock', null)
            expect(sidebar.state.isLocked).toBe(true)
            await sidebar.processEvent('unlock', null)
            expect(sidebar.state.isLocked).toBe(false)
        })

        it(
            'should be able to copy note and page links',
            async ({ device }) => {
                let clipboard = ''
                const { sidebar, analytics } = await setupLogicHelper({
                    device,
                    copyToClipboard: async (text) => {
                        clipboard = text
                        return true
                    },
                })

                expect(clipboard).toEqual('')
                expect(analytics.popNew()).toEqual([])

                await sidebar.processEvent('copyNoteLink', { link: 'test' })

                expect(clipboard).toEqual('test')
                expect(analytics.popNew()).toEqual([
                    {
                        eventArgs: {
                            category: 'ContentSharing',
                            action: 'copyNoteLink',
                        },
                    },
                ])

                await sidebar.processEvent('copyPageLink', {
                    link: 'test again',
                })

                expect(clipboard).toEqual('test again')
                expect(analytics.popNew()).toEqual([
                    {
                        eventArgs: {
                            category: 'ContentSharing',
                            action: 'copyPageLink',
                        },
                    },
                ])
            },
            { shouldSkip: true },
        )

        // TODO: check storage as well
        it(
            'should be able to create page links for the current page',
            async ({ device }) => {
                const fullPageUrl = 'https://memex.garden'
                const normalizedPageUrl = 'memex.garden'
                const listName = createPageLinkListTitle()

                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                    skipTestData: true,
                    fullPageUrl,
                })

                // expect(sidebar.state.pageLinkCreateState).toEqual('pristine')
                expect(annotationsCache.lists.byId).toEqual(
                    initNormalizedState().byId,
                )

                // TODO: Update this test
                // await sidebar.processEvent('createPageLink', null)

                // expect(sidebar.state.pageLinkCreateState).toEqual('success')
                expect(annotationsCache.lists.byId).toEqual({
                    [annotationsCache.lists.allIds[0]]: {
                        unifiedId: expect.anything(),
                        type: 'page-link',
                        name: listName,
                        remoteId: expect.anything(),
                        localId: expect.any(Number),
                        collabKey: expect.any(String),
                        sharedListEntryId: expect.anything(),
                        normalizedPageUrl,
                        creator: {
                            id: TEST_USER.id,
                            type: 'user-reference',
                        },
                        unifiedAnnotationIds: [],
                        hasRemoteAnnotationsToLoad: false,
                    },
                })
            },
            { shouldSkip: true },
        )
    })

    describe('spaces tab', () => {
        it(
            'should hydrate the page annotations cache with annotations and lists data from the DB upon init',
            async ({ device }) => {
                const {
                    sidebar,
                    annotationsCache,
                    emittedEvents,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                    skipInitEvent: true,
                    fullPageUrl: DATA.TAB_URL_1,
                })
                const expectedEvents = []

                expect(emittedEvents).toEqual(expectedEvents)
                expect(annotationsCache.pageListIds).toEqual(new Map())
                expect(annotationsCache.lists).toEqual(initNormalizedState())
                expect(annotationsCache.annotations).toEqual(
                    initNormalizedState(),
                )
                expect(sidebar.state.pageListIds).toEqual(new Set())
                expect(sidebar.state.listInstances).toEqual({})
                expect(sidebar.state.annotationCardInstances).toEqual({})

                await sidebar.init()

                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: cacheUtils.getHighlightAnnotationsArray(
                            annotationsCache,
                        ),
                    },
                })

                expect(emittedEvents).toEqual(expectedEvents)
                expect(annotationsCache.pageListIds).toEqual(
                    new Map([
                        [
                            normalizeUrl(DATA.TAB_URL_1),
                            new Set(
                                mapLocalListIdsToUnified(
                                    [
                                        DATA.LOCAL_LISTS[0].id,
                                        DATA.LOCAL_LISTS[3].id,
                                    ],
                                    annotationsCache,
                                ),
                            ),
                        ],
                    ]),
                )
                expect(Object.values(annotationsCache.lists.byId)).toEqual([
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[0], {
                        extraData: {
                            creator: DATA.CREATOR_1,
                            remoteId: DATA.SHARED_LIST_IDS[0],
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: mapLocalAnnotIdsToUnified(
                                [
                                    DATA.ANNOT_3.url, // NOTE: inherited shared list from parent page
                                    DATA.ANNOT_2.url, // NOTE: inherited shared list from parent page
                                    DATA.ANNOT_1.url,
                                ],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[1], {
                        hasRemoteAnnotations: true,
                        extraData: {
                            creator: DATA.CREATOR_1,
                            remoteId: DATA.SHARED_LIST_IDS[1],
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: mapLocalAnnotIdsToUnified(
                                [DATA.ANNOT_1.url],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[2], {
                        extraData: {
                            creator: DATA.CREATOR_2,
                            remoteId: DATA.SHARED_LIST_IDS[2],
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: [],
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[3], {
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: mapLocalAnnotIdsToUnified(
                                [DATA.ANNOT_3.url],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[4], {
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: [],
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[5], {
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: [],
                        },
                    }),
                    cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[6], {
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            unifiedAnnotationIds: [],
                            remoteId: DATA.SHARED_LIST_IDS[4],
                            normalizedPageUrl:
                                DATA.FOLLOWED_LIST_ENTRIES[5].normalizedPageUrl,
                            sharedListEntryId: DATA.FOLLOWED_LIST_ENTRIES[5].sharedListEntry.toString(),
                        },
                    }),
                    cacheUtils.reshapeFollowedListForCache(
                        DATA.FOLLOWED_LISTS[3],
                        {
                            hasRemoteAnnotations: true,
                            extraData: {
                                unifiedId: expect.any(String),
                                unifiedAnnotationIds: [],
                            },
                        },
                    ),
                    cacheUtils.reshapeFollowedListForCache(
                        DATA.FOLLOWED_LISTS[5],
                        {
                            hasRemoteAnnotations: true,
                            extraData: {
                                normalizedPageUrl:
                                    DATA.FOLLOWED_LIST_ENTRIES[6]
                                        .normalizedPageUrl,
                                sharedListEntryId: DATA.FOLLOWED_LIST_ENTRIES[6].sharedListEntry.toString(),
                                unifiedId: expect.any(String),
                                unifiedAnnotationIds: [],
                            },
                        },
                    ),
                ])

                expect(
                    Object.values(annotationsCache.annotations.byId),
                ).toEqual([
                    cacheUtils.reshapeAnnotationForCache(DATA.ANNOT_1, {
                        excludeLocalLists: true,
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                            unifiedListIds: mapLocalListIdsToUnified(
                                [
                                    DATA.LOCAL_LISTS[0].id,
                                    DATA.LOCAL_LISTS[1].id,
                                ],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeAnnotationForCache(DATA.ANNOT_2, {
                        excludeLocalLists: true,
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            remoteId: DATA.ANNOT_METADATA[0].remoteId,
                            privacyLevel: AnnotationPrivacyLevels.SHARED,
                            unifiedListIds: mapLocalListIdsToUnified(
                                [
                                    // DATA.LOCAL_LISTS[3].id,
                                    DATA.LOCAL_LISTS[0].id, // NOTE: inherited shared list from parent page
                                ],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeAnnotationForCache(DATA.ANNOT_3, {
                        excludeLocalLists: true,
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            remoteId: DATA.ANNOT_METADATA[1].remoteId,
                            privacyLevel:
                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                            unifiedListIds: mapLocalListIdsToUnified(
                                [
                                    DATA.LOCAL_LISTS[0].id, // NOTE: inherited shared list from parent page
                                    DATA.LOCAL_LISTS[3].id,
                                ],
                                annotationsCache,
                            ),
                        },
                    }),
                    cacheUtils.reshapeAnnotationForCache(DATA.ANNOT_4, {
                        excludeLocalLists: true,
                        extraData: {
                            creator: DATA.CREATOR_1,
                            unifiedId: expect.any(String),
                            remoteId: DATA.ANNOT_METADATA[2].remoteId,
                            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                            unifiedListIds: [],
                        },
                    }),
                ])

                expect(sidebar.state.pageListIds).toEqual(
                    new Set(
                        mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id, DATA.LOCAL_LISTS[3].id],
                            annotationsCache,
                        ),
                    ),
                )
                expect(sidebar.state.listInstances).toEqual(
                    fromPairs(
                        normalizedStateToArray(
                            annotationsCache.lists,
                        ).map((list) => [
                            list.unifiedId,
                            initListInstance(list),
                        ]),
                    ),
                )
                expect(sidebar.state.annotationCardInstances).toEqual(
                    fromPairs(
                        normalizedStateToArray(annotationsCache.annotations)
                            .map((annot) => [
                                ...annot.unifiedListIds.map((unifiedListId) => [
                                    generateAnnotationCardInstanceId(
                                        annot,
                                        unifiedListId,
                                    ),
                                    initAnnotationCardInstance(annot),
                                ]),
                                [
                                    generateAnnotationCardInstanceId(annot),
                                    initAnnotationCardInstance(annot),
                                ],
                            ])
                            .flat(),
                    ),
                )
            },
            { shouldSkip: true },
        )

        it(
            'should update parent page list IDs as the associated cache state updates, without changing page active lists state',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                    skipInitEvent: true,
                    fullPageUrl: DATA.TAB_URL_1,
                })

                expect(annotationsCache.pageListIds).toEqual(new Map())
                expect(sidebar.state.pageListIds).toEqual(new Set())
                expect(sidebar.state.pageActiveListIds).toEqual([])

                await sidebar.init()

                const normalizedUrl = normalizeUrl(DATA.TAB_URL_1)
                const expectedPageActiveLists = DATA.FOLLOWED_LIST_ENTRIES.filter(
                    (entry) =>
                        entry.normalizedPageUrl === normalizedUrl &&
                        entry.hasAnnotationsFromOthers,
                ).map(
                    (entry) =>
                        annotationsCache.getListByRemoteId(
                            entry.followedList.toString(),
                        ).unifiedId,
                )
                const unifiedListIds = mapLocalListIdsToUnified(
                    [
                        DATA.LOCAL_LISTS[0].id,
                        DATA.LOCAL_LISTS[1].id,
                        DATA.LOCAL_LISTS[2].id,
                        DATA.LOCAL_LISTS[3].id,
                    ],
                    annotationsCache,
                )

                expect(annotationsCache.pageListIds).toEqual(
                    new Map([
                        [
                            normalizedUrl,
                            new Set([unifiedListIds[0], unifiedListIds[3]]),
                        ],
                    ]),
                )
                expect(sidebar.state.pageListIds).toEqual(
                    new Set([unifiedListIds[0], unifiedListIds[3]]),
                )
                expect(sidebar.state.pageActiveListIds).toEqual(
                    expectedPageActiveLists,
                )

                annotationsCache.setPageData(normalizedUrl, [])

                expect(annotationsCache.pageListIds).toEqual(
                    new Map([[normalizedUrl, new Set()]]),
                )
                expect(sidebar.state.pageListIds).toEqual(new Set())
                expect(sidebar.state.pageActiveListIds).toEqual(
                    expectedPageActiveLists, // Note this remains unchanged, as it relates to activity by collaborators
                )

                annotationsCache.setPageData(normalizedUrl, [unifiedListIds[0]])
                expect(annotationsCache.pageListIds).toEqual(
                    new Map([[normalizedUrl, new Set([unifiedListIds[0]])]]),
                )
                expect(sidebar.state.pageListIds).toEqual(
                    new Set([unifiedListIds[0]]),
                )
                expect(sidebar.state.pageActiveListIds).toEqual(
                    expectedPageActiveLists,
                )
            },
            { shouldSkip: true },
        )

        it(
            'should load remote annotation counts for lists with them upon activating space tab',
            async ({ device }) => {
                const {
                    sidebar,
                    sidebarLogic,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                    skipInitEvent: true,
                    fullPageUrl: DATA.TAB_URL_1,
                })
                const expectedEvents = []

                expect(emittedEvents).toEqual(expectedEvents)
                expect(annotationsCache.lists).toEqual(initNormalizedState())
                expect(annotationsCache.annotations).toEqual(
                    initNormalizedState(),
                )
                expect(sidebar.state.listInstances).toEqual({})
                expect(sidebar.state.annotationCardInstances).toEqual({})

                await sidebar.init()
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: cacheUtils.getHighlightAnnotationsArray(
                            annotationsCache,
                        ),
                    },
                })

                const defaultListInstanceStates = fromPairs(
                    normalizedStateToArray(
                        annotationsCache.lists,
                    ).map((list) => [list.unifiedId, initListInstance(list)]),
                )

                const [
                    unifiedListIdA,
                    unifiedListIdB,
                    unifiedListIdC,
                ] = normalizedStateToArray(annotationsCache.lists)
                    .filter((list) => list.hasRemoteAnnotationsToLoad)
                    .map((list) => list.unifiedId)

                let expectedListInstances = {
                    ...defaultListInstanceStates,
                    [unifiedListIdA]: {
                        ...initListInstance(
                            annotationsCache.lists.byId[unifiedListIdA],
                        ),
                        sharedAnnotationReferences: [],
                        annotationRefsLoadState: 'pristine',
                    },
                    [unifiedListIdB]: {
                        ...initListInstance(
                            annotationsCache.lists.byId[unifiedListIdB],
                        ),
                        sharedAnnotationReferences: [],
                        annotationRefsLoadState: 'pristine',
                    },
                }

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )
                expect(sidebar.state.activeTab).toEqual('annotations')

                await sidebar.processEvent('setActiveSidebarTab', {
                    tab: 'spaces',
                })
                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: { highlights: [] },
                    },
                )
                expectedListInstances[unifiedListIdA] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdA,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[2].id,
                        },
                    ],
                }
                expectedListInstances[unifiedListIdB] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdB,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[3].id,
                        },
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[4].id,
                        },
                    ],
                }
                expectedListInstances[unifiedListIdC] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdC,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[5].id,
                        },
                    ],
                }

                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )

                // Verify re-opening the tab doesn't result in re-loads
                await sidebar.processEvent('setActiveSidebarTab', {
                    tab: 'annotations',
                })
                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                )

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.activeTab).toEqual('annotations')

                let wasBGMethodCalled = false
                sidebarLogic[
                    'options'
                ].customListsBG.fetchAnnotationRefsForRemoteListsOnPage = (() => {
                    wasBGMethodCalled = true
                }) as any

                await sidebar.processEvent('setActiveSidebarTab', {
                    tab: 'spaces',
                })
                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: { highlights: [] },
                    },
                )

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(wasBGMethodCalled).toBe(false)
            },
            { shouldSkip: true },
        )

        it(
            'should load remote annotations for a list upon opening a list in space tab',
            async ({ device }) => {
                const {
                    sidebar,
                    sidebarLogic,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                    skipInitEvent: true,
                    fullPageUrl: DATA.TAB_URL_1,
                })
                const expectedEvents = []

                expect(annotationsCache.lists).toEqual(initNormalizedState())
                expect(annotationsCache.annotations).toEqual(
                    initNormalizedState(),
                )
                expect(sidebar.state.listInstances).toEqual({})
                expect(sidebar.state.annotationCardInstances).toEqual({})
                expect(emittedEvents).toEqual(expectedEvents)

                await sidebar.init()
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: cacheUtils.getHighlightAnnotationsArray(
                            annotationsCache,
                        ),
                    },
                })

                const defaultListInstanceStates = fromPairs(
                    normalizedStateToArray(
                        annotationsCache.lists,
                    ).map((list) => [list.unifiedId, initListInstance(list)]),
                )

                const [
                    unifiedListIdA,
                    unifiedListIdB,
                    unifiedListIdC,
                ] = normalizedStateToArray(annotationsCache.lists)
                    .filter((list) => list.hasRemoteAnnotationsToLoad)
                    .map((list) => list.unifiedId)

                let expectedListInstances = {
                    ...defaultListInstanceStates,
                    [unifiedListIdA]: {
                        ...initListInstance(
                            annotationsCache.lists.byId[unifiedListIdA],
                        ),
                        sharedAnnotationReferences: [],
                        annotationRefsLoadState: 'pristine',
                    },
                    [unifiedListIdB]: {
                        ...initListInstance(
                            annotationsCache.lists.byId[unifiedListIdB],
                        ),
                        sharedAnnotationReferences: [],
                        annotationRefsLoadState: 'pristine',
                    },
                    [unifiedListIdC]: {
                        ...initListInstance(
                            annotationsCache.lists.byId[unifiedListIdC],
                        ),
                        sharedAnnotationReferences: [],
                        annotationRefsLoadState: 'pristine',
                    },
                }
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )

                await sidebar.processEvent('setActiveSidebarTab', {
                    tab: 'spaces',
                })
                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: [],
                        },
                    },
                )

                expectedListInstances[unifiedListIdA] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdA,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[2].id,
                        },
                    ],
                }
                expectedListInstances[unifiedListIdB] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdB,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[3].id,
                        },
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[4].id,
                        },
                    ],
                }
                expectedListInstances[unifiedListIdC] = {
                    isOpen: false,
                    unifiedListId: unifiedListIdC,
                    annotationsLoadState: 'pristine',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[5].id,
                        },
                    ],
                }

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )

                await sidebar.processEvent('expandListAnnotations', {
                    unifiedListId: unifiedListIdA,
                })
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: cacheUtils.getListHighlightsArray(
                            annotationsCache,
                            unifiedListIdA,
                        ),
                    },
                })
                expectedListInstances[unifiedListIdA] = {
                    ...expectedListInstances[unifiedListIdA],
                    isOpen: true,
                    annotationsLoadState: 'success',
                    conversationsLoadState: 'success',
                }

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )

                // Assert the 1 annotation was downloaded, cached, and a new card instance state created
                const newCachedAnnotAId = annotationsCache[
                    'remoteAnnotIdsToCacheIds'
                ].get(DATA.SHARED_ANNOTATIONS[2].id.toString())
                expect(
                    annotationsCache.annotations.byId[newCachedAnnotAId],
                ).toEqual(
                    cacheUtils.reshapeSharedAnnotationForCache(
                        {
                            ...DATA.SHARED_ANNOTATIONS[2],
                            creatorReference: DATA.CREATOR_2,
                            reference: {
                                type: 'shared-annotation-reference',
                                id: DATA.SHARED_ANNOTATIONS[2].id,
                            },
                            color: null,
                        },
                        {
                            excludeLocalLists: true,
                            extraData: {
                                unifiedId: expect.any(String),
                                unifiedListIds: [unifiedListIdA],
                            },
                        },
                    ),
                )

                await sidebar.processEvent('expandListAnnotations', {
                    unifiedListId: unifiedListIdB,
                })
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: [
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdA,
                            ),
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdB,
                            ),
                        ],
                    },
                })
                expectedListInstances[unifiedListIdB] = {
                    ...expectedListInstances[unifiedListIdB],
                    isOpen: true,
                    annotationsLoadState: 'success',
                    conversationsLoadState: 'success',
                }

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances).toEqual(
                    expectedListInstances,
                )

                // Assert the 2 annotation were downloaded, cached (with one being de-duped, already existing locally), and new card instance states created
                const newCachedAnnotBId = annotationsCache[
                    'remoteAnnotIdsToCacheIds'
                ].get(DATA.SHARED_ANNOTATIONS[3].id.toString())
                const dedupedCachedAnnotId = annotationsCache[
                    'remoteAnnotIdsToCacheIds'
                ].get(DATA.SHARED_ANNOTATIONS[4].id.toString())
                expect(
                    annotationsCache.annotations.byId[newCachedAnnotBId],
                ).toEqual(
                    cacheUtils.reshapeSharedAnnotationForCache(
                        {
                            ...DATA.SHARED_ANNOTATIONS[3],
                            creatorReference: DATA.CREATOR_2,
                            reference: {
                                type: 'shared-annotation-reference',
                                id: DATA.SHARED_ANNOTATIONS[3].id,
                            },
                            color: null,
                        },
                        {
                            excludeLocalLists: true,
                            extraData: {
                                unifiedId: newCachedAnnotBId,
                                unifiedListIds: [unifiedListIdB],
                            },
                        },
                    ),
                )

                // Close then re-open a list to assert no extra download takes place
                await sidebar.processEvent('expandListAnnotations', {
                    unifiedListId: unifiedListIdA,
                })
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: [
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdB,
                            ),
                        ],
                    },
                })

                expect(emittedEvents).toEqual(expectedEvents)
                let wasBGMethodCalled = false
                sidebarLogic[
                    'options'
                ].annotationsBG.getSharedAnnotations = (() => {
                    wasBGMethodCalled = true
                }) as any

                await sidebar.processEvent('expandListAnnotations', {
                    unifiedListId: unifiedListIdA,
                })
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: [
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdB,
                            ),
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdA,
                            ),
                        ],
                    },
                })

                expect(emittedEvents).toEqual(expectedEvents)
                expect(wasBGMethodCalled).toBe(false)

                // Open a list without remote annots to assert no download is attempted
                const unifiedListIdD = normalizedStateToArray(
                    annotationsCache.lists,
                ).find((list) => !list.hasRemoteAnnotationsToLoad).unifiedId

                expect(sidebar.state.listInstances[unifiedListIdD].isOpen).toBe(
                    false,
                )

                await sidebar.processEvent('expandListAnnotations', {
                    unifiedListId: unifiedListIdD,
                })
                expectedEvents.push({
                    event: 'renderHighlights',
                    args: {
                        highlights: expect.arrayContaining([
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdD,
                            ),
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdB,
                            ),
                            ...cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedListIdA,
                            ),
                        ]),
                    },
                })

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.listInstances[unifiedListIdD].isOpen).toBe(
                    true,
                )
                expect(wasBGMethodCalled).toBe(false)
            },
            { shouldSkip: true },
        )
    })

    describe('annotations tab', () => {
        it(
            'should be able to change privacy level for all notes',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                })

                const annots = DATA.ANNOT_PRIVACY_LVLS.slice(0, -1)

                expect(
                    normalizedStateToArray(sidebar.state.annotations),
                ).toEqual(
                    annots.map((data) =>
                        expect.objectContaining({
                            localId: data.annotation,
                            privacyLevel: data.privacyLevel,
                        }),
                    ),
                )

                const createSharingStates = (
                    sharingState: AnnotationSharingState,
                ): AnnotationSharingStates =>
                    normalizedStateToArray(sidebar.state.annotations).reduce(
                        (acc, curr) =>
                            !curr.localId
                                ? acc
                                : {
                                      ...acc,
                                      [curr.localId]: { ...sharingState },
                                  },
                        {},
                    )

                await sidebar.processEvent(
                    'updateAllAnnotationsShareInfo',
                    createSharingStates({
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        hasLink: false,
                        privateListIds: [DATA.LOCAL_LISTS[0].id],
                        sharedListIds: [
                            DATA.LOCAL_LISTS[1].id,
                            DATA.LOCAL_LISTS[2].id,
                        ],
                    }),
                )

                expect(
                    normalizedStateToArray(sidebar.state.annotations),
                ).toEqual(
                    annots.map((data) =>
                        expect.objectContaining({
                            localId: data.annotation,
                            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                            // unifiedListIds: mapLocalListIdsToUnified(
                            //     [
                            //         DATA.LOCAL_LISTS[0].id,
                            //         DATA.LOCAL_LISTS[1].id,
                            //         DATA.LOCAL_LISTS[2].id,
                            //     ],
                            //     annotationsCache,
                            // ),
                        }),
                    ),
                )

                await sidebar.processEvent(
                    'updateAllAnnotationsShareInfo',
                    createSharingStates({
                        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                        hasLink: true,
                        remoteId: 'test-remote-id',
                        privateListIds: [DATA.LOCAL_LISTS[0].id],
                        sharedListIds: [DATA.LOCAL_LISTS[2].id],
                    }),
                )

                expect(
                    normalizedStateToArray(sidebar.state.annotations),
                ).toEqual(
                    annots.map((data) =>
                        expect.objectContaining({
                            localId: data.annotation,
                            privacyLevel:
                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                            // unifiedListIds: mapLocalListIdsToUnified(
                            //     [DATA.LOCAL_LISTS[0].id, DATA.LOCAL_LISTS[2].id],
                            //     annotationsCache,
                            // ),
                            remoteId: 'test-remote-id',
                        }),
                    ),
                )
            },
            { shouldSkip: true },
        )

        describe('new page note box', () => {
            it('should be able to cancel writing a new comment', async ({
                device,
            }) => {
                const { sidebar } = await setupLogicHelper({ device })

                expect(sidebar.state.showCommentBox).toEqual(false)
                expect(sidebar.state.commentBox.commentText).toEqual('')
                await sidebar.processEvent('setNewPageNoteText', {
                    comment: DATA.COMMENT_1,
                })
                expect(sidebar.state.showCommentBox).toEqual(true)
                expect(sidebar.state.commentBox.commentText).toEqual(
                    DATA.COMMENT_1,
                )

                await sidebar.processEvent('cancelNewPageNote', null)
                expect(sidebar.state.showCommentBox).toEqual(false)
                expect(sidebar.state.commentBox.commentText).toEqual('')
            })

            it(
                'should be able to save a new comment',
                async ({ device }) => {
                    const {
                        sidebar,
                        annotationsCache,
                    } = await setupLogicHelper({
                        device,
                        withAuth: true,
                    })

                    expect(sidebar.state.commentBox.commentText).toEqual('')
                    await sidebar.processEvent('setNewPageNoteText', {
                        comment: DATA.COMMENT_1,
                    })
                    expect(sidebar.state.commentBox.commentText).toEqual(
                        DATA.COMMENT_1,
                    )

                    await sidebar.processEvent('saveNewPageNote', {
                        shouldShare: false,
                        now: 123,
                    })

                    const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                    expect(
                        sidebar.state.annotations.byId[latestCachedAnnotId],
                    ).toEqual({
                        unifiedId: latestCachedAnnotId,
                        localId: generateAnnotationUrl({
                            pageUrl: DATA.TAB_URL_1,
                            now: () => 123,
                        }),
                        remoteId: undefined,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: DATA.CREATOR_1,
                        comment: DATA.COMMENT_1,
                        body: undefined,
                        selector: undefined,
                        createdWhen: 123,
                        lastEdited: 123,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        unifiedListIds: [],
                    })
                    expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
                },
                { shouldSkip: true },
            )

            it(
                'should block save a new comment with login modal if logged out + share intent set',
                async ({ device }) => {
                    const { sidebar } = await setupLogicHelper({
                        device,
                        withAuth: false,
                    })

                    await sidebar.processEvent('setNewPageNoteText', {
                        comment: DATA.COMMENT_1,
                    })
                    expect(sidebar.state.showLoginModal).toBe(false)
                    await sidebar.processEvent('saveNewPageNote', {
                        shouldShare: true,
                    })
                    expect(sidebar.state.showLoginModal).toBe(true)
                },
                { shouldSkip: true },
            )

            it('should be able to set focus on comment box', async ({
                device,
            }) => {
                let isCreateFormFocused = false
                const { sidebar } = await setupLogicHelper({
                    device,
                    focusCreateForm: () => {
                        isCreateFormFocused = true
                    },
                })

                expect(isCreateFormFocused).toBe(false)
                await sidebar.processEvent('setNewPageNoteText', {
                    comment: DATA.COMMENT_1,
                })
                expect(isCreateFormFocused).toBe(true)
            })
        })
    })

    describe('annotation card instance events', () => {
        it(
            'should be able to set an annotation card into edit mode and change comment text',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const cardId = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotationId },
                    'annotations-tab',
                )

                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })

                await sidebar.processEvent('setAnnotationEditMode', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isEditing: true,
                })

                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: true,
                    cardMode: 'none',
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })

                await sidebar.processEvent('setAnnotationEditCommentText', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    comment: 'test comment',
                    annotation: DATA.LOCAL_ANNOTATIONS[0] as any,
                })

                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: true,
                    cardMode: 'none',
                    comment: 'test comment',
                })

                await sidebar.processEvent('setAnnotationEditMode', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isEditing: false,
                })

                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: 'test comment', // NOTE: Updated comment remains
                })
            },
            { shouldSkip: true },
        )

        it(
            'should be able to open different dropdowns of an annotation card',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const cardId = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotationId },
                    'annotations-tab',
                )

                const cardModes: AnnotationCardMode[] = [
                    'copy-paster',
                    'space-picker',
                    'share-menu',
                    'save-btn',
                    'delete-confirm',
                    'formatting-help',
                    'none',
                ]
                for (const mode of cardModes) {
                    await sidebar.processEvent('setAnnotationCardMode', {
                        unifiedAnnotationId,
                        instanceLocation: 'annotations-tab',
                        mode,
                    })
                    expect(
                        sidebar.state.annotationCardInstances[cardId],
                    ).toEqual({
                        unifiedAnnotationId,
                        isCommentTruncated: true,
                        isCommentEditing: false,
                        cardMode: mode,
                        comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                    })
                }
            },
            { shouldSkip: true },
        )

        it(
            "should be able to set an annotation card's comment to be truncated or not",
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const cardId = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotationId },
                    'annotations-tab',
                )

                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })
                await sidebar.processEvent('setAnnotationCommentMode', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isTruncated: false,
                })
                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: false,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })
                await sidebar.processEvent('setAnnotationCommentMode', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isTruncated: true,
                })
                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })
            },
            { shouldSkip: true },
        )

        it(
            'should be able to save an edit of an annotation card',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const now = 123
                const updatedComment = 'updated comment'
                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const cardId = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotationId },
                    'annotations-tab',
                )

                await sidebar.processEvent('setAnnotationEditMode', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isEditing: true,
                })
                await sidebar.processEvent('setAnnotationEditCommentText', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    comment: updatedComment,
                    annotation: DATA.LOCAL_ANNOTATIONS[0] as any,
                })

                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({ url: DATA.ANNOT_1.url }),
                ).toEqual(
                    expect.objectContaining({
                        comment: DATA.ANNOT_1.comment,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        remoteId: undefined,
                        comment: DATA.ANNOT_1.comment,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        lastEdited: DATA.ANNOT_1.lastEdited.getTime(),
                    }),
                )
                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: true,
                    cardMode: 'none',
                    comment: updatedComment,
                })

                // EDIT 1: change only the comment
                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: false,
                    now,
                })

                // TODO: Fix storage checks (currently changes not persisting)
                // expect(
                //     await device.storageManager
                //         .collection('sharedAnnotationMetadata')
                //         .findOneObject({ localId: DATA.ANNOT_1.url }),
                // ).toEqual(null)
                // expect(
                //     await device.storageManager
                //         .collection('annotations')
                //         .findOneObject({ url: DATA.ANNOT_1.url }),
                // ).toEqual(
                //     expect.objectContaining({
                //         comment: updatedComment,
                //     }),
                // )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        remoteId: undefined,
                        comment: updatedComment,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        lastEdited: now,
                    }),
                )
                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: updatedComment,
                })

                // EDIT 2: make shared + protected
                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: true,
                    isProtected: true,
                    now: now + 1,
                })

                // const metadata: SharedAnnotationMetadata = await device.storageManager
                //     .collection('sharedAnnotationMetadata')
                //     .findOneObject({ localId: DATA.ANNOT_1.url })
                // expect(metadata).toEqual({
                //     localId: DATA.ANNOT_1.url,
                //     remoteId: expect.any(String),
                //     excludeFromLists: false,
                // })
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        // remoteId: metadata.remoteId,
                        remoteId: expect.any(String),
                        comment: updatedComment,
                        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                        lastEdited: now,
                    }),
                )
            },
            { shouldSkip: true },
        )

        it(
            'should be able to edit an annotation',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const updatedComment = 'test comment updated'
                const now = 123

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const annotInstanceId = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotationId },
                    'annotations-tab',
                )

                expect(
                    sidebar.state.annotationCardInstances[annotInstanceId],
                ).toEqual(
                    expect.objectContaining({
                        isCommentEditing: false,
                        comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                    }),
                )

                await sidebar.processEvent('setAnnotationEditMode', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    isEditing: true,
                })

                expect(
                    sidebar.state.annotationCardInstances[annotInstanceId],
                ).toEqual(
                    expect.objectContaining({
                        isCommentEditing: true,
                        comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: DATA.LOCAL_ANNOTATIONS[0].createdWhen.getTime(),
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                    }),
                )

                await sidebar.processEvent('setAnnotationEditCommentText', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    comment: updatedComment,
                    annotation: DATA.LOCAL_ANNOTATIONS[0] as any,
                })

                expect(
                    sidebar.state.annotationCardInstances[annotInstanceId],
                ).toEqual(
                    expect.objectContaining({
                        isCommentEditing: true,
                        comment: updatedComment,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: DATA.LOCAL_ANNOTATIONS[0].createdWhen.getTime(),
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                    }),
                )

                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: true,
                    isProtected: false,
                    now,
                })

                expect(
                    sidebar.state.annotationCardInstances[annotInstanceId],
                ).toEqual(
                    expect.objectContaining({
                        isCommentEditing: false,
                        comment: updatedComment,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: now,
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                        comment: updatedComment,
                    }),
                )

                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: false,
                    isProtected: false,
                    now: now + 1,
                })

                expect(
                    sidebar.state.annotationCardInstances[annotInstanceId],
                ).toEqual(
                    expect.objectContaining({
                        isCommentEditing: false,
                        comment: updatedComment,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: now,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        comment: updatedComment,
                    }),
                )
            },
            { shouldSkip: true },
        )

        it(
            'should block annotation edit with login modal if logged out + save has share intent',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: false,
                })

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId].comment,
                ).toEqual(DATA.LOCAL_ANNOTATIONS[0].comment)
                expect(sidebar.state.showLoginModal).toBe(false)

                await sidebar.processEvent('setAnnotationEditCommentText', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    comment: "updated comment that won't be written",
                    annotation: DATA.LOCAL_ANNOTATIONS[0] as any,
                })

                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: true,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId].comment,
                ).toEqual(DATA.LOCAL_ANNOTATIONS[0].comment)
                expect(sidebar.state.showLoginModal).toBe(true)
            },
            { shouldSkip: true },
        )

        it(
            'should be able to share an annotation',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const now = 123

                const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: DATA.LOCAL_ANNOTATIONS[0].lastEdited.getTime(),
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
                )
                expect(
                    await device.storageManager
                        .collection('sharedAnnotationMetadata')
                        .findOneObject({
                            localId: DATA.LOCAL_ANNOTATIONS[0].url,
                        }),
                ).toEqual(null)
                expect(
                    await device.storageManager
                        .collection('annotationPrivacyLevels')
                        .findOneObject({
                            annotation: DATA.LOCAL_ANNOTATIONS[0].url,
                        }),
                ).toEqual({
                    ...DATA.ANNOT_PRIVACY_LVLS[0],
                    id: expect.any(Number),
                })

                await sidebar.processEvent('editAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationId,
                    instanceLocation: 'annotations-tab',
                    shouldShare: true,
                    now,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationId],
                ).toEqual(
                    expect.objectContaining({
                        lastEdited: DATA.LOCAL_ANNOTATIONS[0].lastEdited.getTime(),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )
                expect(
                    await device.storageManager
                        .collection('sharedAnnotationMetadata')
                        .findOneObject({
                            localId: DATA.LOCAL_ANNOTATIONS[0].url,
                        }),
                ).toEqual({
                    localId: DATA.LOCAL_ANNOTATIONS[0].url,
                    remoteId: expect.any(String),
                    excludeFromLists: false,
                })
                expect(
                    await device.storageManager
                        .collection('annotationPrivacyLevels')
                        .findOneObject({
                            annotation: DATA.LOCAL_ANNOTATIONS[0].url,
                        }),
                ).toEqual({
                    ...DATA.ANNOT_PRIVACY_LVLS[0],
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    updatedWhen: expect.any(Date),
                    id: expect.any(Number),
                })
            },
            { shouldSkip: true },
        )
    })

    describe('annotation events', () => {
        it(
            'should be able to delete annotations',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                })

                const unifiedAnnotation = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                )
                const cardIdA = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotation.unifiedId },
                    'annotations-tab',
                )
                const cardIdB = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotation.unifiedId },
                    annotationsCache.getListByLocalId(DATA.LOCAL_LISTS[0].id)
                        .unifiedId,
                )
                const cardIdC = generateAnnotationCardInstanceId(
                    { unifiedId: unifiedAnnotation.unifiedId },
                    annotationsCache.getListByLocalId(DATA.LOCAL_LISTS[1].id)
                        .unifiedId,
                )

                expect(
                    sidebar.state.annotationCardInstances[cardIdA],
                ).toBeDefined()
                expect(
                    sidebar.state.annotationCardInstances[cardIdB],
                ).toBeDefined()
                expect(
                    sidebar.state.annotationCardInstances[cardIdC],
                ).toBeDefined()
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotation.unifiedId],
                ).toBeDefined()
                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({
                            url: unifiedAnnotation.localId,
                        }),
                ).toBeDefined()

                await sidebar.processEvent('deleteAnnotation', {
                    unifiedAnnotationId: unifiedAnnotation.unifiedId,
                })

                expect(
                    sidebar.state.annotationCardInstances[cardIdA],
                ).not.toBeDefined()
                expect(
                    sidebar.state.annotationCardInstances[cardIdB],
                ).not.toBeDefined()
                expect(
                    sidebar.state.annotationCardInstances[cardIdC],
                ).not.toBeDefined()
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotation.unifiedId],
                ).not.toBeDefined()
                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({
                            url: unifiedAnnotation.localId,
                        }),
                ).toBeNull()
            },
            { shouldSkip: true },
        )

        it(
            'should be able to activate annotations',
            async ({ device }) => {
                const {
                    sidebar,
                    annotationsCache,
                    emittedEvents,
                } = await setupLogicHelper({
                    device,
                })
                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                const unifiedAnnotationIdA = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const unifiedAnnotationIdB = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[1].url,
                ).unifiedId
                const cardIdA = generateAnnotationCardInstanceId({
                    unifiedId: unifiedAnnotationIdA,
                })
                const cardIdB = generateAnnotationCardInstanceId({
                    unifiedId: unifiedAnnotationIdB,
                })

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.activeAnnotationId).toBeNull()
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                })
                // No expected event emission as annot is not a highlight

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdA,
                )
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: null,
                })
                expect(sidebar.state.activeAnnotationId).toBeNull()

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                    mode: 'edit',
                })
                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdA,
                )
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: true,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: null,
                })
                expect(sidebar.state.activeAnnotationId).toBeNull()
                expect(sidebar.state.annotationCardInstances[cardIdB]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    mode: 'edit_spaces',
                })
                // This one, however, is a highlight
                expectedEvents.push({
                    event: 'highlightAndScroll',
                    args: {
                        highlight:
                            annotationsCache.annotations.byId[
                                unifiedAnnotationIdB
                            ],
                    },
                })

                expect(emittedEvents).toEqual(expectedEvents)
                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdB,
                )
                expect(sidebar.state.annotationCardInstances[cardIdB]).toEqual(
                    expect.objectContaining({
                        cardMode: 'space-picker',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: null,
                })
                expect(sidebar.state.activeAnnotationId).toBeNull()
            },
            { shouldSkip: true },
        )

        it(
            'should be able to activate annotations in selected list mode',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                })

                const unifiedListId = annotationsCache.getListByLocalId(
                    DATA.LOCAL_LISTS[0].id,
                ).unifiedId
                const unifiedAnnotationIdA = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const unifiedAnnotationIdB = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[1].url,
                ).unifiedId

                // NOTE: we're getting the card instance IDs for those in the selected list view in the sidebar
                const cardIdA = generateAnnotationCardInstanceId(
                    {
                        unifiedId: unifiedAnnotationIdA,
                    },
                    unifiedListId,
                )
                const cardIdB = generateAnnotationCardInstanceId(
                    {
                        unifiedId: unifiedAnnotationIdB,
                    },
                    unifiedListId,
                )

                await sidebar.processEvent('setSelectedList', { unifiedListId })

                expect(sidebar.state.selectedListId).toEqual(unifiedListId)
                expect(sidebar.state.activeAnnotationId).toBeNull()
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                })

                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdA,
                )
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                    mode: 'edit',
                })
                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdA,
                )
                expect(sidebar.state.annotationCardInstances[cardIdA]).toEqual(
                    expect.objectContaining({
                        cardMode: 'none',
                        isCommentEditing: true,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    mode: 'edit_spaces',
                })

                expect(sidebar.state.activeAnnotationId).toBe(
                    unifiedAnnotationIdB,
                )
                expect(sidebar.state.annotationCardInstances[cardIdB]).toEqual(
                    expect.objectContaining({
                        cardMode: 'space-picker',
                        isCommentEditing: false,
                    }),
                )

                await sidebar.processEvent('setActiveAnnotation', {
                    unifiedAnnotationId: null,
                })
                expect(sidebar.state.activeAnnotationId).toBeNull()
            },
            { shouldSkip: true },
        )
    })

    describe('selected list mode', () => {
        it(
            'should be able to set selected list mode for a specific joined space',
            async ({ device }) => {
                const {
                    sidebar,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                const joinedCacheList = annotationsCache.getListByLocalId(
                    DATA.LOCAL_LISTS[2].id,
                )

                expect(sidebar.state.activeTab).toEqual('annotations')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
                expect(
                    sidebar.state.listInstances[joinedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('pristine')

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: joinedCacheList.unifiedId,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: joinedCacheList.unifiedId,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                joinedCacheList.unifiedId,
                            ),
                        },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(
                    joinedCacheList.unifiedId,
                )
                expect(emittedEvents).toEqual(expectedEvents)
                expect(
                    sidebar.state.listInstances[joinedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('pristine')

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: null,
                })
                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: { highlights: [] },
                    },
                )

                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
                expect(
                    sidebar.state.listInstances[joinedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('pristine')
            },
            { shouldSkip: true },
        )

        it(
            'should be able to set selected list mode for a specific followed-only space',
            async ({ device }) => {
                const {
                    sidebar,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const followedCacheList = annotationsCache.getListByRemoteId(
                    DATA.SHARED_LIST_IDS[3],
                )
                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                expect(sidebar.state.activeTab).toEqual('annotations')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('pristine')
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationRefsLoadState,
                ).toEqual('pristine')

                const annotationsCountBefore =
                    sidebar.state.annotations.allIds.length
                const annotationCardInstanceCountBefore = Object.keys(
                    sidebar.state.annotationCardInstances,
                ).length

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: followedCacheList.unifiedId,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: followedCacheList.unifiedId,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                followedCacheList.unifiedId,
                            ),
                        },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(
                    followedCacheList.unifiedId,
                )
                expect(emittedEvents).toEqual(expectedEvents)
                // Verify remote annots got loaded
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('success')
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationRefsLoadState,
                ).toEqual('success')
                expect(sidebar.state.annotations.allIds.length).toBe(
                    annotationsCountBefore + 2,
                )
                expect(
                    Object.keys(sidebar.state.annotationCardInstances).length,
                ).toBe(annotationCardInstanceCountBefore + 4) // 2 for "annotations" tab + 2 for "spaces" tab

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: null,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: { highlights: [] },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
            },
            { shouldSkip: true },
        )

        it(
            'should be able to set selected list mode for a specific local-only space',
            async ({ device }) => {
                await device.storageManager
                    .collection('customLists')
                    .createObject({
                        id: 0,
                        name: 'test',
                    })
                const {
                    sidebar,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const localOnlyCacheList = annotationsCache.getListByLocalId(
                    DATA.LOCAL_LISTS[3].id,
                )
                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                expect(sidebar.state.activeTab).toEqual('annotations')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: localOnlyCacheList.unifiedId,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: localOnlyCacheList.unifiedId,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                localOnlyCacheList.unifiedId,
                            ),
                        },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(
                    localOnlyCacheList.unifiedId,
                )
                expect(emittedEvents).toEqual(expectedEvents)

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: null,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: null,
                    },
                    {
                        event: 'renderHighlights',
                        args: { highlights: [] },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
            },
            { shouldSkip: true },
        )

        it(
            'should be able to set selected list mode from the Web UI for a locally available space',
            async ({ device }) => {
                const {
                    sidebar,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const sharedListId = DATA.SHARED_LIST_IDS[3]
                const followedCacheList = annotationsCache.getListByRemoteId(
                    sharedListId,
                )
                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                expect(sidebar.state.activeTab).toEqual('annotations')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('pristine')
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationRefsLoadState,
                ).toEqual('pristine')

                const annotationsCountBefore =
                    sidebar.state.annotations.allIds.length
                const annotationCardInstanceCountBefore = Object.keys(
                    sidebar.state.annotationCardInstances,
                ).length

                await sidebar.processEvent('setSelectedListFromWebUI', {
                    sharedListId,
                })

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: followedCacheList.unifiedId,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                followedCacheList.unifiedId,
                            ),
                        },
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                followedCacheList.unifiedId,
                            ),
                        },
                    },
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(
                    followedCacheList.unifiedId,
                )
                expect(emittedEvents).toEqual(expectedEvents)
                // Verify remote annots got loaded
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationsLoadState,
                ).toEqual('success')
                expect(
                    sidebar.state.listInstances[followedCacheList.unifiedId]
                        .annotationRefsLoadState,
                ).toEqual('success')
                expect(sidebar.state.annotations.allIds.length).toBe(
                    annotationsCountBefore + 2,
                )
                expect(
                    Object.keys(sidebar.state.annotationCardInstances).length,
                ).toBe(annotationCardInstanceCountBefore + 4) // 2 for "annotations" tab + 2 for "spaces" tab
            },
            { shouldSkip: true },
        )

        it(
            'should be able to set selected list mode from the Web UI for a NON-locally available space',
            async ({ device }) => {
                const {
                    sidebar,
                    emittedEvents,
                    annotationsCache,
                } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                // Let's add a new sharedList + entries to test with
                const { manager: serverStorageManager } = device.serverStorage
                const sharedListId = 'my-test-list-111'
                await serverStorageManager
                    .collection('sharedList')
                    .createObject({
                        id: sharedListId,
                        title: sharedListId,
                        description: sharedListId,
                        creator: DATA.CREATOR_2.id,
                        createdWhen: Date.now(),
                        updatedWhen: Date.now(),
                    })

                const annots = [
                    {
                        id: sharedListId + '1',
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: DATA.CREATOR_2.id,
                        body: 'test highlight 1',
                        createdWhen: 11111,
                        updatedWhen: 11111,
                        uploadedWhen: 11111,
                        selector: {
                            descriptor: {
                                content: [
                                    { type: 'TextPositionSelector', start: 0 },
                                ],
                            },
                        } as any,
                    },
                    {
                        id: sharedListId + '2',
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: DATA.CREATOR_2.id,
                        body: 'test highlight 2',
                        comment: 'test comment 2',
                        createdWhen: 11111,
                        updatedWhen: 11111,
                        uploadedWhen: 11111,
                        selector: {
                            descriptor: {
                                content: [
                                    { type: 'TextPositionSelector', start: 0 },
                                ],
                            },
                        } as any,
                    },
                ]
                const annotListEntries = [
                    {
                        id: sharedListId + '1',
                        creator: DATA.CREATOR_2.id,
                        sharedList: sharedListId,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        sharedAnnotation: annots[0].id,
                        createdWhen: new Date('2022-12-22').getTime(),
                        updatedWhen: new Date('2022-12-22').getTime(),
                        uploadedWhen: new Date('2022-12-22').getTime(),
                    },
                    {
                        id: sharedListId + '2',
                        creator: DATA.CREATOR_2.id,
                        sharedList: sharedListId,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        sharedAnnotation: annots[1].id,
                        createdWhen: new Date('2022-12-22').getTime(),
                        updatedWhen: new Date('2022-12-22').getTime(),
                        uploadedWhen: new Date('2022-12-22').getTime(),
                    },
                ]
                for (const annot of annots) {
                    await serverStorageManager
                        .collection('sharedAnnotation')
                        .createObject({
                            ...annot,
                            selector: JSON.stringify(annot.selector),
                        })
                }
                for (const entry of annotListEntries) {
                    await serverStorageManager
                        .collection('sharedAnnotationListEntry')
                        .createObject(entry)
                }

                const expectedEvents: any[] = [
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getHighlightAnnotationsArray(
                                annotationsCache,
                            ),
                        },
                    },
                ]

                expect(sidebar.state.foreignSelectedListLoadState).toEqual(
                    'pristine',
                )
                expect(sidebar.state.activeTab).toEqual('annotations')
                expect(sidebar.state.selectedListId).toEqual(null)
                expect(emittedEvents).toEqual(expectedEvents)

                const listsBefore = [...sidebar.state.lists.allIds]
                const listInstancesCountBefore = Object.keys(
                    sidebar.state.listInstances,
                ).length
                const annotationsBefore = [...sidebar.state.annotations.allIds]
                const annotationCardInstanceCountBefore = Object.keys(
                    sidebar.state.annotationCardInstances,
                ).length

                await sidebar.processEvent('setSelectedListFromWebUI', {
                    sharedListId,
                })

                const unifiedForeignListId = annotationsCache.getLastAssignedListId()

                expectedEvents.push(
                    {
                        event: 'setSelectedList',
                        args: unifiedForeignListId,
                    },
                    {
                        event: 'renderHighlights',
                        args: {
                            highlights: cacheUtils.getListHighlightsArray(
                                annotationsCache,
                                unifiedForeignListId,
                            ),
                        },
                    },
                )
                expect(sidebar.state.foreignSelectedListLoadState).toEqual(
                    'success',
                )
                expect(sidebar.state.activeTab).toEqual('spaces')
                expect(sidebar.state.selectedListId).toEqual(
                    unifiedForeignListId,
                )
                expect(emittedEvents).toEqual(expectedEvents)

                // Verify remote list data got loaded
                expect(sidebar.state.lists.allIds).toEqual([
                    unifiedForeignListId,
                    ...listsBefore,
                ])
                expect(sidebar.state.lists.byId[unifiedForeignListId]).toEqual({
                    unifiedId: unifiedForeignListId,
                    remoteId: sharedListId,
                    name: sharedListId,
                    description: sharedListId,
                    creator: DATA.CREATOR_2,
                    hasRemoteAnnotationsToLoad: true,
                    isForeignList: true,
                    unifiedAnnotationIds: [
                        expect.any(String),
                        expect.any(String),
                    ],
                    type: 'user-list',
                })
                expect(Object.keys(sidebar.state.listInstances).length).toBe(
                    listInstancesCountBefore + 1,
                )
                expect(
                    sidebar.state.listInstances[unifiedForeignListId],
                ).toEqual({
                    unifiedListId: unifiedForeignListId,
                    annotationRefsLoadState: 'success',
                    conversationsLoadState: 'success',
                    annotationsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: annots[0].id,
                        },
                        {
                            type: 'shared-annotation-reference',
                            id: annots[1].id,
                        },
                    ],
                    isOpen: false,
                })

                // Verify remote annots got loaded
                const unifiedForeignAnnotIds = sidebar.state.annotations.allIds.filter(
                    (id) => !annotationsBefore.includes(id),
                )
                expect(unifiedForeignAnnotIds.length).toBe(2)
                expect(
                    Object.keys(sidebar.state.annotationCardInstances).length,
                ).toBe(annotationCardInstanceCountBefore + 2) // 2 for "annotations" tab + 0 for "spaces" tab
                expect(
                    sidebar.state.annotations.byId[unifiedForeignAnnotIds[1]],
                ).toEqual({
                    unifiedId: unifiedForeignAnnotIds[1],
                    remoteId: annots[0].id,
                    body: annots[0].body,
                    comment: annots[0].comment,
                    selector: annots[0].selector,
                    normalizedPageUrl: annots[0].normalizedPageUrl,
                    lastEdited: annots[0].updatedWhen,
                    createdWhen: annots[0].createdWhen,
                    creator: DATA.CREATOR_2,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    unifiedListIds: [unifiedForeignListId],
                })
                expect(
                    sidebar.state.annotations.byId[unifiedForeignAnnotIds[0]],
                ).toEqual({
                    unifiedId: unifiedForeignAnnotIds[0],
                    remoteId: annots[1].id,
                    body: annots[1].body,
                    comment: annots[1].comment,
                    selector: annots[1].selector,
                    normalizedPageUrl: annots[1].normalizedPageUrl,
                    lastEdited: annots[1].updatedWhen,
                    createdWhen: annots[1].createdWhen,
                    creator: DATA.CREATOR_2,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    unifiedListIds: [unifiedForeignListId],
                })
                expect(
                    sidebar.state.annotationCardInstances[
                        generateAnnotationCardInstanceId({
                            unifiedId: unifiedForeignAnnotIds[0],
                        })
                    ],
                ).toEqual({
                    unifiedAnnotationId: unifiedForeignAnnotIds[0],
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: annots[1].comment,
                })
                expect(
                    sidebar.state.annotationCardInstances[
                        generateAnnotationCardInstanceId({
                            unifiedId: unifiedForeignAnnotIds[1],
                        })
                    ],
                ).toEqual({
                    unifiedAnnotationId: unifiedForeignAnnotIds[1],
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: 'none',
                    comment: '',
                })
            },
            { shouldSkip: true },
        )

        describe('saving new annotations', () => {
            const runCreateAnnotationTest = async (
                device: UILogicTestDevice,
                opts: {
                    annotationType: 'private' | 'shared'
                    listType: 'private' | 'shared'
                    expectedAnnotationData: {
                        privacyLevel: AnnotationPrivacyLevels
                        hasLocalListEntry: boolean
                        isSharedToPageLists: boolean
                        isRemotelyAvailable: boolean
                        hasNewConversationState: boolean
                    }
                },
            ) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })

                const selectedListLocalId =
                    opts.listType === 'shared'
                        ? DATA.LOCAL_LISTS[0].id
                        : DATA.LOCAL_LISTS[4].id

                expect(sidebar.state.commentBox.commentText).toEqual('')
                await sidebar.processEvent('setNewPageNoteText', {
                    comment: DATA.COMMENT_1,
                })
                expect(sidebar.state.commentBox.commentText).toEqual(
                    DATA.COMMENT_1,
                )

                // Add an extra (local) list just to verify this works with selected list mode
                expect(sidebar.state.commentBox.lists).toEqual([])
                await sidebar.processEvent('setNewPageNoteLists', {
                    lists: [DATA.LOCAL_LISTS[3].id],
                })
                expect(sidebar.state.commentBox.lists).toEqual([
                    DATA.LOCAL_LISTS[3].id,
                ])

                const [unifiedListIdA, unifiedListIdB, unifiedIdForPageList] = [
                    selectedListLocalId,
                    DATA.LOCAL_LISTS[3].id,
                    DATA.LOCAL_LISTS[0].id,
                ].map(
                    (localId) =>
                        annotationsCache.getListByLocalId(localId).unifiedId,
                )

                await sidebar.processEvent('setSelectedList', {
                    unifiedListId: unifiedListIdA,
                })
                expect(sidebar.state.commentBox.lists).toEqual([
                    DATA.LOCAL_LISTS[3].id,
                ])

                const localAnnotId = generateAnnotationUrl({
                    pageUrl: DATA.TAB_URL_1,
                    now: () => Date.now(),
                })

                expect(
                    await device.storageManager
                        .collection('annotationPrivacyLevels')
                        .findObject({ annotation: localAnnotId }),
                ).toEqual(null)
                expect(
                    await device.storageManager
                        .collection('sharedAnnotationMetadata')
                        .findObject({ localId: localAnnotId }),
                ).toEqual(null)
                expect(
                    await device.storageManager
                        .collection('annotListEntries')
                        .findAllObjects({ url: localAnnotId }),
                ).toEqual([])

                const conversationsBefore = Object.keys(
                    sidebar.state.conversations,
                ).length

                await sidebar.processEvent('saveNewPageNote', {
                    annotationId: localAnnotId,
                    shouldShare: opts.annotationType === 'shared',
                    now: 123,
                })

                expect(Object.keys(sidebar.state.conversations).length).toBe(
                    conversationsBefore +
                        Number(
                            opts.expectedAnnotationData.hasNewConversationState,
                        ),
                )
                expect(
                    await device.storageManager
                        .collection('annotationPrivacyLevels')
                        .findObject({ annotation: localAnnotId }),
                ).toEqual({
                    id: expect.any(Number),
                    annotation: localAnnotId,
                    privacyLevel: opts.expectedAnnotationData.privacyLevel,
                    createdWhen: expect.any(Date),
                })
                expect(
                    await device.storageManager
                        .collection('sharedAnnotationMetadata')
                        .findObject({ localId: localAnnotId }),
                ).toEqual(
                    opts.expectedAnnotationData.isRemotelyAvailable
                        ? {
                              localId: localAnnotId,
                              remoteId: expect.any(String),
                              excludeFromLists: !opts.expectedAnnotationData
                                  .isSharedToPageLists,
                          }
                        : null,
                )
                expect(
                    await device.storageManager
                        .collection('annotListEntries')
                        .findAllObjects({ url: localAnnotId }),
                ).toEqual(
                    expect.arrayContaining([
                        ...(opts.expectedAnnotationData.hasLocalListEntry
                            ? [
                                  {
                                      listId: selectedListLocalId,
                                      createdAt: expect.any(Date),
                                      url: localAnnotId,
                                  },
                              ]
                            : []),
                        {
                            listId: DATA.LOCAL_LISTS[3].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                    ]),
                )

                const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                expect(
                    sidebar.state.annotations.byId[latestCachedAnnotId],
                ).toEqual({
                    unifiedId: latestCachedAnnotId,
                    localId: localAnnotId,
                    remoteId: opts.expectedAnnotationData.isRemotelyAvailable
                        ? expect.any(String)
                        : undefined,
                    normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                    creator: DATA.CREATOR_1,
                    comment: DATA.COMMENT_1,
                    body: undefined,
                    selector: undefined,
                    createdWhen: 123,
                    lastEdited: 123,
                    privacyLevel: opts.expectedAnnotationData.privacyLevel,
                    unifiedListIds: [
                        ...(opts.expectedAnnotationData.isSharedToPageLists &&
                        opts.expectedAnnotationData.hasLocalListEntry
                            ? [unifiedIdForPageList]
                            : []),
                        unifiedListIdA,
                        unifiedListIdB,
                    ],
                })
                expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
            }

            it(
                'should be able to save a new private comment in selected list mode for a shared list, making it protected',
                async ({ device }) =>
                    runCreateAnnotationTest(device, {
                        annotationType: 'private',
                        listType: 'shared',
                        expectedAnnotationData: {
                            hasNewConversationState: true,
                            isSharedToPageLists: false,
                            isRemotelyAvailable: true,
                            hasLocalListEntry: true,
                            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        },
                    }),
                { shouldSkip: true },
            )

            it(
                'should be able to save a new auto-shared comment in selected list mode for a shared list, making it shared',
                async ({ device }) =>
                    runCreateAnnotationTest(device, {
                        annotationType: 'shared',
                        listType: 'shared',
                        expectedAnnotationData: {
                            hasNewConversationState: true,
                            isSharedToPageLists: true,
                            isRemotelyAvailable: true,
                            hasLocalListEntry: false,
                            privacyLevel: AnnotationPrivacyLevels.SHARED,
                        },
                    }),
                { shouldSkip: true },
            )

            it(
                'should be able to save a new private comment in selected list mode for a private list, making it private',
                async ({ device }) =>
                    runCreateAnnotationTest(device, {
                        annotationType: 'private',
                        listType: 'private',
                        expectedAnnotationData: {
                            hasNewConversationState: false,
                            isSharedToPageLists: false,
                            isRemotelyAvailable: false,
                            hasLocalListEntry: true,
                            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        },
                    }),
                { shouldSkip: true },
            )

            it(
                'should be able to save a new auto-shared comment in selected list mode for a private list, making it shared',
                async ({ device }) =>
                    runCreateAnnotationTest(device, {
                        annotationType: 'shared',
                        listType: 'private',
                        expectedAnnotationData: {
                            hasNewConversationState: true,
                            isSharedToPageLists: true,
                            isRemotelyAvailable: true,
                            hasLocalListEntry: true,
                            privacyLevel: AnnotationPrivacyLevels.SHARED,
                        },
                    }),
                { shouldSkip: true },
            )

            ////

            it(
                'should be able to save a new private comment in toggled list instance for a private list',
                async ({ device }) => {
                    const {
                        sidebar,
                        annotationsCache,
                    } = await setupLogicHelper({
                        device,
                        withAuth: false,
                    })

                    expect(sidebar.state.commentBox.commentText).toEqual('')
                    await sidebar.processEvent('setNewPageNoteText', {
                        comment: DATA.COMMENT_1,
                    })
                    expect(sidebar.state.commentBox.commentText).toEqual(
                        DATA.COMMENT_1,
                    )

                    expect(sidebar.state.commentBox.lists).toEqual([])
                    await sidebar.processEvent('setNewPageNoteLists', {
                        lists: [DATA.LOCAL_LISTS[3].id],
                    })
                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const [unifiedListIdA, unifiedListIdB] = [
                        DATA.LOCAL_LISTS[4].id,
                        DATA.LOCAL_LISTS[3].id,
                    ].map(
                        (localId) =>
                            annotationsCache.getListByLocalId(localId)
                                .unifiedId,
                    )

                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const localAnnotId = generateAnnotationUrl({
                        pageUrl: DATA.TAB_URL_1,
                        now: () => Date.now(),
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([])

                    await sidebar.processEvent('saveNewPageNote', {
                        listInstanceId: unifiedListIdA,
                        annotationId: localAnnotId,
                        shouldShare: false,
                        now: 123,
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([
                        {
                            listId: DATA.LOCAL_LISTS[3].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                        {
                            listId: DATA.LOCAL_LISTS[4].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                    ])

                    const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                    expect(
                        sidebar.state.annotations.byId[latestCachedAnnotId],
                    ).toEqual({
                        unifiedId: latestCachedAnnotId,
                        localId: localAnnotId,
                        remoteId: undefined,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: null, // NOTE: we're not auth'd
                        comment: DATA.COMMENT_1,
                        body: undefined,
                        selector: undefined,
                        createdWhen: 123,
                        lastEdited: 123,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        unifiedListIds: [unifiedListIdA, unifiedListIdB],
                    })
                    expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
                },
                { shouldSkip: true },
            )

            it(
                'should be able to save a new private comment in selected list mode for a private list',
                async ({ device }) => {
                    const {
                        sidebar,
                        annotationsCache,
                    } = await setupLogicHelper({
                        device,
                        withAuth: false,
                    })

                    expect(sidebar.state.commentBox.commentText).toEqual('')
                    await sidebar.processEvent('setNewPageNoteText', {
                        comment: DATA.COMMENT_1,
                    })
                    expect(sidebar.state.commentBox.commentText).toEqual(
                        DATA.COMMENT_1,
                    )

                    expect(sidebar.state.commentBox.lists).toEqual([])
                    await sidebar.processEvent('setNewPageNoteLists', {
                        lists: [DATA.LOCAL_LISTS[3].id],
                    })
                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const [unifiedListIdA, unifiedListIdB] = [
                        DATA.LOCAL_LISTS[4].id,
                        DATA.LOCAL_LISTS[3].id,
                    ].map(
                        (localId) =>
                            annotationsCache.getListByLocalId(localId)
                                .unifiedId,
                    )

                    await sidebar.processEvent('setSelectedList', {
                        unifiedListId: unifiedListIdA,
                    })

                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const localAnnotId = generateAnnotationUrl({
                        pageUrl: DATA.TAB_URL_1,
                        now: () => Date.now(),
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([])

                    await sidebar.processEvent('saveNewPageNote', {
                        annotationId: localAnnotId,
                        shouldShare: false,
                        now: 123,
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([
                        {
                            listId: DATA.LOCAL_LISTS[3].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                        {
                            listId: DATA.LOCAL_LISTS[4].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                    ])

                    const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                    expect(
                        sidebar.state.annotations.byId[latestCachedAnnotId],
                    ).toEqual({
                        unifiedId: latestCachedAnnotId,
                        localId: localAnnotId,
                        remoteId: undefined,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: null, // NOTE: we're not auth'd
                        comment: DATA.COMMENT_1,
                        body: undefined,
                        selector: undefined,
                        createdWhen: 123,
                        lastEdited: 123,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        unifiedListIds: [unifiedListIdA, unifiedListIdB],
                    })
                    expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
                },
                { shouldSkip: true },
            )

            it(
                'should be able to save a new private comment on the "My Annotations" tab while in selected list mode, without adding to that selected list',
                async ({ device }) => {
                    const {
                        sidebar,
                        annotationsCache,
                    } = await setupLogicHelper({
                        device,
                        withAuth: false,
                    })

                    expect(sidebar.state.commentBox.commentText).toEqual('')
                    await sidebar.processEvent('setNewPageNoteText', {
                        comment: DATA.COMMENT_1,
                    })
                    expect(sidebar.state.commentBox.commentText).toEqual(
                        DATA.COMMENT_1,
                    )

                    expect(sidebar.state.commentBox.lists).toEqual([])
                    await sidebar.processEvent('setNewPageNoteLists', {
                        lists: [DATA.LOCAL_LISTS[3].id],
                    })
                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const [unifiedListIdA, unifiedListIdB] = [
                        DATA.LOCAL_LISTS[4].id,
                        DATA.LOCAL_LISTS[3].id,
                    ].map(
                        (localId) =>
                            annotationsCache.getListByLocalId(localId)
                                .unifiedId,
                    )

                    await sidebar.processEvent('setSelectedList', {
                        unifiedListId: unifiedListIdA,
                    })

                    // Switch back to "My Annotations" tab, while "Spaces" tab remains in selected list mode
                    await sidebar.processEvent('setActiveSidebarTab', {
                        tab: 'annotations',
                    })

                    expect(sidebar.state.commentBox.lists).toEqual([
                        DATA.LOCAL_LISTS[3].id,
                    ])

                    const localAnnotId = generateAnnotationUrl({
                        pageUrl: DATA.TAB_URL_1,
                        now: () => Date.now(),
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([])

                    await sidebar.processEvent('saveNewPageNote', {
                        annotationId: localAnnotId,
                        shouldShare: false,
                        now: 123,
                    })

                    expect(
                        await device.storageManager
                            .collection('annotListEntries')
                            .findAllObjects({ url: localAnnotId }),
                    ).toEqual([
                        {
                            listId: DATA.LOCAL_LISTS[3].id,
                            createdAt: expect.any(Date),
                            url: localAnnotId,
                        },
                    ])

                    const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                    expect(
                        sidebar.state.annotations.byId[latestCachedAnnotId],
                    ).toEqual({
                        unifiedId: latestCachedAnnotId,
                        localId: localAnnotId,
                        remoteId: undefined,
                        normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                        creator: null, // NOTE: we're not auth'd
                        comment: DATA.COMMENT_1,
                        body: undefined,
                        selector: undefined,
                        createdWhen: 123,
                        lastEdited: 123,
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        unifiedListIds: [unifiedListIdB],
                    })
                    expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
                },
                { shouldSkip: true },
            )
        })
    })

    describe('privacy level state changes', () => {
        it(
            'should be able to update annotation sharing info',
            async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
                    device,
                    withAuth: true,
                })
                const unifiedAnnotationIdA = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[0].url,
                ).unifiedId
                const unifiedAnnotationIdB = annotationsCache.getAnnotationByLocalId(
                    DATA.LOCAL_ANNOTATIONS[1].url,
                ).unifiedId

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdA],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id, DATA.LOCAL_LISTS[1].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdB],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )

                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })
                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    keepListsIfUnsharing: true,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdA],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id, DATA.LOCAL_LISTS[1].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdB],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
                )

                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    keepListsIfUnsharing: false,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdA],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    }),
                )

                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdB],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                    }),
                )

                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    keepListsIfUnsharing: false,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdB],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    }),
                )

                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdA,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })
                await sidebar.processEvent('updateAnnotationShareInfo', {
                    unifiedAnnotationId: unifiedAnnotationIdB,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })

                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdA],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )
                expect(
                    sidebar.state.annotations.byId[unifiedAnnotationIdB],
                ).toEqual(
                    expect.objectContaining({
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id],
                            annotationsCache,
                        ),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    }),
                )
            },
            { shouldSkip: true },
        )
    })
})
