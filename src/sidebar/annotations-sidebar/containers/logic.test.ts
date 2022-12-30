import fromPairs from 'lodash/fromPairs'
import { FakeAnalytics } from 'src/analytics/mock'
import {
    SidebarContainerLogic,
    createEditFormsForAnnotations,
    INIT_FORM_STATE,
} from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
    insertBackgroundFunctionTab,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import * as sharingTestData from 'src/content-sharing/background/index.test.data'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import normalizeUrl from '@worldbrain/memex-url-utils/lib/normalize'
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
    const { backgroundModules } = device

    const annotationsBG = insertBackgroundFunctionTab(
        device.backgroundModules.directLinking.remoteFunctions,
    ) as any

    const annotationsCache = new PageAnnotationsCache({
        normalizedPageUrl: normalizeUrl(fullPageUrl),
    })

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

    const analytics = new FakeAnalytics()
    const sidebarLogic = new SidebarContainerLogic({
        fullPageUrl,
        sidebarContext: 'dashboard',
        auth: backgroundModules.auth.remoteFunctions,
        tags: backgroundModules.tags.remoteFunctions,
        subscription: backgroundModules.auth.subscriptionService,
        copyPaster: backgroundModules.copyPaster.remoteFunctions,
        customLists: backgroundModules.customLists.remoteFunctions,
        contentSharing: backgroundModules.contentSharing.remoteFunctions,
        pageActivityIndicatorBG:
            backgroundModules.pageActivityIndicator.remoteFunctions,
        contentScriptBackground: (backgroundModules.contentScripts
            .remoteFunctions as unknown) as ContentScriptsInterface<'caller'>,
        contentConversationsBG:
            backgroundModules.contentConversations.remoteFunctions,
        syncSettingsBG: backgroundModules.syncSettings,
        currentUser: withAuth ? DATA.CREATOR_1 : undefined,
        annotations: annotationsBG,
        events: fakeEmitter as any,
        annotationsCache,
        analytics,
        initialState: 'hidden',
        searchResultLimit: 10,
        focusEditNoteForm,
        focusCreateForm,
        copyToClipboard,
        getFullPageUrl: () => fullPageUrl,
    })

    const sidebar = device.createElement(sidebarLogic)

    if (!skipInitEvent) {
        await sidebar.init()
    }
    return { sidebar, sidebarLogic, analytics, annotationsCache, emittedEvents }
}

async function setupTestData({
    storageManager,
    getServerStorage,
}: UILogicTestDevice) {
    const { manager: serverStorageManager } = await getServerStorage()
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
        includePostSyncProcessor: true,
    })

    describe('misc sidebar functionality', () => {
        it('should be able to trigger annotation sorting', async ({
            device,
        }) => {
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
        })

        it('should be able to toggle sidebar lock', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.isLocked).toBe(false)
            await sidebar.processEvent('lock', null)
            expect(sidebar.state.isLocked).toBe(true)
            await sidebar.processEvent('unlock', null)
            expect(sidebar.state.isLocked).toBe(false)
        })

        it('should be able to copy note and page links', async ({ device }) => {
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

            await sidebar.processEvent('copyPageLink', { link: 'test again' })

            expect(clipboard).toEqual('test again')
            expect(analytics.popNew()).toEqual([
                {
                    eventArgs: {
                        category: 'ContentSharing',
                        action: 'copyPageLink',
                    },
                },
            ])
        })
    })

    describe('spaces tab', () => {
        it('should hydrate the page annotations cache with annotations and lists data from the DB upon init', async ({
            device,
        }) => {
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
            expect(annotationsCache.lists).toEqual(initNormalizedState())
            expect(annotationsCache.annotations).toEqual(initNormalizedState())
            expect(sidebar.state.listInstances).toEqual({})
            expect(sidebar.state.annotationCardInstances).toEqual({})

            await sidebar.init()

            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: annotationsCache.highlights },
            })

            expect(emittedEvents).toEqual(expectedEvents)
            expect(Object.values(annotationsCache.lists.byId)).toEqual([
                cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[0], {
                    extraData: {
                        creator: DATA.CREATOR_1,
                        remoteId: DATA.SHARED_LIST_IDS[0],
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: mapLocalAnnotIdsToUnified(
                            [
                                DATA.ANNOT_1.url,
                                DATA.ANNOT_2.url, // NOTE: inherited shared list from parent page
                                DATA.ANNOT_3.url, // NOTE: inherited shared list from parent page
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
                        // Creator data actually doesn't load here as no entries on TAB_URL_1 to prompt loading of followedList data
                        // creator: DATA.CREATOR_2,
                        remoteId: DATA.SHARED_LIST_IDS[2],
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: [],
                    },
                }),
                cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[3], {
                    extraData: {
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: mapLocalAnnotIdsToUnified(
                            [DATA.ANNOT_2.url, DATA.ANNOT_3.url],
                            annotationsCache,
                        ),
                    },
                }),
                cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[4], {
                    extraData: {
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: [],
                    },
                }),
                cacheUtils.reshapeLocalListForCache(DATA.LOCAL_LISTS[5], {
                    extraData: {
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: [],
                    },
                }),
                cacheUtils.reshapeFollowedListForCache(DATA.FOLLOWED_LISTS[3], {
                    hasRemoteAnnotations: true,
                    extraData: {
                        unifiedId: expect.any(String),
                        unifiedAnnotationIds: [],
                    },
                }),
            ])

            expect(Object.values(annotationsCache.annotations.byId)).toEqual([
                cacheUtils.reshapeAnnotationForCache(DATA.ANNOT_1, {
                    excludeLocalLists: true,
                    extraData: {
                        creator: DATA.CREATOR_1,
                        unifiedId: expect.any(String),
                        privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                        unifiedListIds: mapLocalListIdsToUnified(
                            [DATA.LOCAL_LISTS[0].id, DATA.LOCAL_LISTS[1].id],
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
                                DATA.LOCAL_LISTS[3].id,
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
                        privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                        unifiedListIds: mapLocalListIdsToUnified(
                            [
                                DATA.LOCAL_LISTS[3].id,
                                DATA.LOCAL_LISTS[0].id, // NOTE: inherited shared list from parent page
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

            expect(sidebar.state.listInstances).toEqual(
                fromPairs(
                    normalizedStateToArray(
                        annotationsCache.lists,
                    ).map((list) => [list.unifiedId, initListInstance(list)]),
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
        })

        it('should load remote annotation counts for lists with them upon activating space tab', async ({
            device,
        }) => {
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
            expect(annotationsCache.annotations).toEqual(initNormalizedState())
            expect(sidebar.state.listInstances).toEqual({})
            expect(sidebar.state.annotationCardInstances).toEqual({})

            await sidebar.init()

            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: annotationsCache.highlights },
            })

            const defaultListInstanceStates = fromPairs(
                normalizedStateToArray(annotationsCache.lists).map((list) => [
                    list.unifiedId,
                    initListInstance(list),
                ]),
            )

            const [unifiedListIdA, unifiedListIdB] = normalizedStateToArray(
                annotationsCache.lists,
            )
                .filter((list) => list.hasRemoteAnnotations)
                .map((list) => list.unifiedId)

            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.listInstances).toEqual({
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
            })

            expect(sidebar.state.activeTab).toEqual('annotations')
            await sidebar.processEvent('setActiveSidebarTab', { tab: 'spaces' })
            expect(sidebar.state.activeTab).toEqual('spaces')

            expect(sidebar.state.listInstances).toEqual({
                ...defaultListInstanceStates,
                [unifiedListIdA]: {
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
                },
                [unifiedListIdB]: {
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
                },
            })

            // Verify re-opening the tab doesn't result in re-loads
            await sidebar.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })

            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: annotationsCache.highlights },
            })

            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.activeTab).toEqual('annotations')

            let wasBGMethodCalled = false
            sidebarLogic[
                'options'
            ].customLists.fetchAnnotationRefsForRemoteListsOnPage = (() => {
                wasBGMethodCalled = true
            }) as any

            await sidebar.processEvent('setActiveSidebarTab', { tab: 'spaces' })

            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(wasBGMethodCalled).toBe(false)
        })

        it('should load remote annotations for a list upon opening a list in space tab', async ({
            device,
        }) => {
            const {
                sidebar,
                sidebarLogic,
                annotationsCache,
            } = await setupLogicHelper({
                device,
                withAuth: true,
                skipInitEvent: true,
                fullPageUrl: DATA.TAB_URL_1,
            })

            expect(annotationsCache.lists).toEqual(initNormalizedState())
            expect(annotationsCache.annotations).toEqual(initNormalizedState())
            expect(sidebar.state.listInstances).toEqual({})
            expect(sidebar.state.annotationCardInstances).toEqual({})

            await sidebar.init()

            const defaultListInstanceStates = fromPairs(
                normalizedStateToArray(annotationsCache.lists).map((list) => [
                    list.unifiedId,
                    initListInstance(list),
                ]),
            )

            const [unifiedListIdA, unifiedListIdB] = normalizedStateToArray(
                annotationsCache.lists,
            )
                .filter((list) => list.hasRemoteAnnotations)
                .map((list) => list.unifiedId)

            expect(sidebar.state.listInstances).toEqual({
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
            })

            await sidebar.processEvent('setActiveSidebarTab', {
                tab: 'spaces',
            })

            expect(sidebar.state.listInstances).toEqual({
                ...defaultListInstanceStates,
                [unifiedListIdA]: {
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
                },
                [unifiedListIdB]: {
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
                },
            })

            await sidebar.processEvent('expandListAnnotations', {
                unifiedListId: unifiedListIdA,
            })

            expect(sidebar.state.listInstances).toEqual({
                ...defaultListInstanceStates,
                [unifiedListIdA]: {
                    isOpen: true,
                    unifiedListId: unifiedListIdA,
                    annotationsLoadState: 'success',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[2].id,
                        },
                    ],
                },
                [unifiedListIdB]: {
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
                },
            })

            // Assert the 1 annotation was downloaded, cached, and a new card instance state created
            const newCachedAnnotAId =
                annotationsCache['remoteAnnotIdsToCacheIds'][
                    DATA.SHARED_ANNOTATIONS[2].id
                ]
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

            expect(sidebar.state.listInstances).toEqual({
                ...defaultListInstanceStates,
                [unifiedListIdA]: {
                    isOpen: true,
                    unifiedListId: unifiedListIdA,
                    annotationsLoadState: 'success',
                    conversationsLoadState: 'pristine',
                    annotationRefsLoadState: 'success',
                    sharedAnnotationReferences: [
                        {
                            type: 'shared-annotation-reference',
                            id: DATA.SHARED_ANNOTATIONS[2].id,
                        },
                    ],
                },
                [unifiedListIdB]: {
                    isOpen: true,
                    unifiedListId: unifiedListIdB,
                    annotationsLoadState: 'success',
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
                },
            })

            // Assert the 2 annotation were downloaded, cached (with one being de-duped, already existing locally), and new card instance states created
            const newCachedAnnotBId =
                annotationsCache['remoteAnnotIdsToCacheIds'][
                    DATA.SHARED_ANNOTATIONS[3].id
                ]
            const dedupedCachedAnnotId =
                annotationsCache['remoteAnnotIdsToCacheIds'][
                    DATA.SHARED_ANNOTATIONS[4].id
                ]
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
            let wasBGMethodCalled = false
            sidebarLogic['options'].annotations.getSharedAnnotations = (() => {
                wasBGMethodCalled = true
            }) as any
            await sidebar.processEvent('expandListAnnotations', {
                unifiedListId: unifiedListIdA,
            })
            expect(wasBGMethodCalled).toBe(false)

            // Open a list without remote annots to assert no download is attempted
            const unifiedListIdC = normalizedStateToArray(
                annotationsCache.lists,
            ).find((list) => !list.hasRemoteAnnotations).unifiedId

            expect(sidebar.state.listInstances[unifiedListIdC].isOpen).toBe(
                false,
            )
            await sidebar.processEvent('expandListAnnotations', {
                unifiedListId: unifiedListIdC,
            })
            expect(sidebar.state.listInstances[unifiedListIdC].isOpen).toBe(
                true,
            )
            expect(wasBGMethodCalled).toBe(false)
        })
    })

    describe('annotations tab', () => {
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

            it('should be able to save a new comment', async ({ device }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
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
            })

            it('should be able to save a new comment in selected space mode', async ({
                device,
            }) => {
                const { sidebar, annotationsCache } = await setupLogicHelper({
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
                    lists: [DATA.LOCAL_LISTS[0].id],
                })
                expect(sidebar.state.commentBox.lists).toEqual([
                    DATA.LOCAL_LISTS[0].id,
                ])

                const unifiedListId = annotationsCache.getListByLocalId(
                    DATA.LOCAL_LISTS[1].id,
                ).unifiedId

                // TODO: Update this to trigger the `setSelectedList` event instead of directly mutating the state
                sidebar.processMutation({
                    selectedListId: { $set: unifiedListId },
                })

                expect(sidebar.state.commentBox.lists).toEqual([
                    DATA.LOCAL_LISTS[0].id,
                ])

                const cachedListIds = [
                    DATA.LOCAL_LISTS[0].id,
                    DATA.LOCAL_LISTS[1].id,
                ].map(
                    (localId) =>
                        annotationsCache.getListByLocalId(localId).unifiedId,
                )

                const localAnnotId = generateAnnotationUrl({
                    pageUrl: DATA.TAB_URL_1,
                    now: () => 123,
                })

                await sidebar.processEvent('saveNewPageNote', {
                    shouldShare: false,
                    now: 123,
                })

                const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
                expect(
                    sidebar.state.annotations.byId[latestCachedAnnotId],
                ).toEqual({
                    unifiedId: latestCachedAnnotId,
                    localId: localAnnotId,
                    remoteId: undefined,
                    normalizedPageUrl: normalizeUrl(DATA.TAB_URL_1),
                    creator: undefined, // NOTE: we're not auth'd
                    comment: DATA.COMMENT_1,
                    body: undefined,
                    selector: undefined,
                    createdWhen: 123,
                    lastEdited: 123,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    unifiedListIds: cachedListIds,
                })
                expect(sidebar.state.commentBox).toEqual(INIT_FORM_STATE)
            })

            it('should be able to save a new comment, inheriting spaces from parent page, when save has share intent', async ({
                device,
            }) => {
                const fullPageUrl = DATA.TAB_URL_1

                const { sidebar } = await setupLogicHelper({
                    device,
                    fullPageUrl: fullPageUrl,
                    withAuth: true,
                })

                expect(sidebar.state.commentBox.commentText).toEqual('')
                await sidebar.processEvent('setNewPageNoteText', {
                    comment: DATA.COMMENT_1,
                })
                expect(sidebar.state.commentBox.commentText).toEqual(
                    DATA.COMMENT_1,
                )
                expect(sidebar.state.commentBox.lists).toEqual([])
                expect(sidebar.state.annotations).toEqual([])

                await sidebar.processEvent('saveNewPageNote', {
                    shouldShare: true,
                })
                expect(sidebar.state.annotations).toEqual([
                    expect.objectContaining({
                        tags: [],
                        comment: DATA.COMMENT_1,
                        lists: [DATA.LOCAL_LISTS[0].id],
                    }),
                ])
                expect(sidebar.state.commentBox).toEqual(
                    expect.objectContaining({
                        tags: [],
                        lists: [],
                        commentText: '',
                        isBookmarked: false,
                    }),
                )
            })

            it('should block save a new comment with login modal if logged out + share intent set', async ({
                device,
            }) => {
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
            })

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
        it('should be able to set an annotation card into edit mode and change comment text', async ({
            device,
        }) => {
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
        })

        it('should be able to open different dropdowns of an annotation card', async ({
            device,
        }) => {
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
                expect(sidebar.state.annotationCardInstances[cardId]).toEqual({
                    unifiedAnnotationId,
                    isCommentTruncated: true,
                    isCommentEditing: false,
                    cardMode: mode,
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                })
            }
        })

        it("should be able to set an annotation card's comment to be truncated or not", async ({
            device,
        }) => {
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
        })

        it('should be able to save an edit of an annotation card', async ({
            device,
        }) => {
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    remoteId: undefined,
                    comment: DATA.ANNOT_1.comment,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    // remoteId: metadata.remoteId,
                    remoteId: expect.any(String),
                    comment: updatedComment,
                    privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                    lastEdited: now,
                }),
            )
        })

        it('should be able to edit an annotation', async ({ device }) => {
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: DATA.LOCAL_ANNOTATIONS[0].createdWhen.getTime(),
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                }),
            )

            await sidebar.processEvent('setAnnotationEditCommentText', {
                unifiedAnnotationId: unifiedAnnotationId,
                instanceLocation: 'annotations-tab',
                comment: updatedComment,
            })

            expect(
                sidebar.state.annotationCardInstances[annotInstanceId],
            ).toEqual(
                expect.objectContaining({
                    isCommentEditing: true,
                    comment: updatedComment,
                }),
            )
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: DATA.LOCAL_ANNOTATIONS[0].createdWhen.getTime(),
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    comment: DATA.LOCAL_ANNOTATIONS[0].comment,
                }),
            )

            await sidebar.processEvent('editAnnotation', {
                unifiedAnnotationId: unifiedAnnotationId,
                instanceLocation: 'annotations-tab',
                shouldShare: false,
                isProtected: true,
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: now,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
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
            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: now,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    comment: updatedComment,
                }),
            )
        })

        it('should block annotation edit with login modal if logged out + save has share intent', async ({
            device,
        }) => {
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
        })

        it('should be able to share an annotation', async ({ device }) => {
            const { sidebar, annotationsCache } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            const now = 123

            const unifiedAnnotationId = annotationsCache.getAnnotationByLocalId(
                DATA.LOCAL_ANNOTATIONS[0].url,
            ).unifiedId

            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: DATA.LOCAL_ANNOTATIONS[0].lastEdited.getTime(),
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                }),
            )
            expect(
                await device.storageManager
                    .collection('sharedAnnotationMetadata')
                    .findOneObject({ localId: DATA.LOCAL_ANNOTATIONS[0].url }),
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

            expect(sidebar.state.annotations.byId[unifiedAnnotationId]).toEqual(
                expect.objectContaining({
                    lastEdited: DATA.LOCAL_ANNOTATIONS[0].lastEdited.getTime(),
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                }),
            )
            expect(
                await device.storageManager
                    .collection('sharedAnnotationMetadata')
                    .findOneObject({ localId: DATA.LOCAL_ANNOTATIONS[0].url }),
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
        })
    })

    describe('annotation events', () => {
        it('should be able to delete annotations', async ({ device }) => {
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

            expect(sidebar.state.annotationCardInstances[cardIdA]).toBeDefined()
            expect(sidebar.state.annotationCardInstances[cardIdB]).toBeDefined()
            expect(sidebar.state.annotationCardInstances[cardIdC]).toBeDefined()
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
        })

        it('should be able to set annotations as being active', async ({
            device,
        }) => {
            const { sidebar, annotationsCache } = await setupLogicHelper({
                device,
            })

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
            expect(sidebar.state.activeAnnotationId).toBe(unifiedAnnotationIdA)
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
            expect(sidebar.state.activeAnnotationId).toBe(unifiedAnnotationIdA)
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
            expect(sidebar.state.activeAnnotationId).toBe(unifiedAnnotationIdB)
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
        })
    })

    describe('selected space/selected space mode', () => {
        it('should be able to set selected space mode for a specific joined space', async ({
            device,
        }) => {
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
                    args: { highlights: annotationsCache.highlights },
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
                        highlights: annotationsCache.highlights.filter(
                            ({ unifiedListIds }) =>
                                unifiedListIds.includes(
                                    joinedCacheList.unifiedId,
                                ),
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
                    args: { highlights: annotationsCache.highlights },
                },
            )

            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedListId).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.listInstances[joinedCacheList.unifiedId]
                    .annotationsLoadState,
            ).toEqual('pristine')
        })

        it('should be able to set selected space mode for a specific followed-only space', async ({
            device,
        }) => {
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
                    args: { highlights: annotationsCache.highlights },
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
                        highlights: annotationsCache.highlights.filter(
                            ({ unifiedListIds }) =>
                                unifiedListIds.includes(
                                    followedCacheList.unifiedId,
                                ),
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
                    args: { highlights: annotationsCache.highlights },
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedListId).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
        })

        it('should be able to set selected space mode for a specific local-only space', async ({
            device,
        }) => {
            await device.storageManager.collection('customLists').createObject({
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
                    args: { highlights: annotationsCache.highlights },
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
                        highlights: annotationsCache.highlights.filter(
                            ({ unifiedListIds }) =>
                                unifiedListIds.includes(
                                    localOnlyCacheList.unifiedId,
                                ),
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
                    args: { highlights: annotationsCache.highlights },
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedListId).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
        })
    })

    // Can these be moved to happen in a unified re-usable location, and tested there?
    describe.skip('TODO: sharing state changes', () => {
        it('should be able to update annotation sharing info', async ({
            device,
        }) => {
            for (const annot of [DATA.ANNOT_1, DATA.ANNOT_2]) {
                await device.storageManager
                    .collection('annotations')
                    .createObject(annot)
            }
            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: DATA.TAB_URL_1,
            })
            const id1 = DATA.ANNOT_1.url
            const id2 = DATA.ANNOT_2.url

            await sidebar.init()

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: id1,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: id1,
                    isShared: false,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({ url: id2 }),
            ])
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: id1,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: id1,
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({ url: id2 }),
            ])
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: id1,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: id1,
                    isShared: false,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({ url: id2 }),
            ])
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: id2,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: id1,
                    isShared: false,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: id2,
                    isShared: true,
                    isBulkShareProtected: false,
                }),
            ])
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: id2,
                privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: id1,
                    isShared: false,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: id2,
                    isShared: true,
                    isBulkShareProtected: true,
                }),
            ])
        })

        it('should be able to update annotation sharing info, inheriting shared lists from parent page on share, filtering out shared lists on unshare (if requested)', async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[0].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('pageListEntries')
                .createObject({
                    listId: DATA.__LISTS_1[0].id,
                    pageUrl: normalizeUrl(fullPageUrl),
                    fullUrl: fullPageUrl,
                })
            await device.storageManager
                .collection('pageListEntries')
                .createObject({
                    listId: DATA.__LISTS_1[1].id,
                    pageUrl: normalizeUrl(fullPageUrl),
                    fullUrl: fullPageUrl,
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: fullPageUrl,
            })
            const annotId = DATA.ANNOT_1.url

            await sidebar.init()

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: annotId,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: false,
                    lists: [],
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: annotId,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: true,
                    isBulkShareProtected: false,
                    lists: [DATA.__LISTS_1[0].id], // NOTE: second list isn't shared, so shouldn't show up here
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: annotId,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                keepListsIfUnsharing: true,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: true,
                    lists: [DATA.__LISTS_1[0].id],
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: annotId,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: true,
                    isBulkShareProtected: false,
                    lists: [DATA.__LISTS_1[0].id],
                }),
            ])

            // NOTE: This exists as a bit of a hack, as in the UI we'd use the SingleNoteShareMenu comp which would ensure
            //  the correct DB ops happen in the BG, which won't work here where we are only using the sidebar UI logic
            //  which doesn't interact with the BG. `updateListsForAnnotation` will eventually trigger a DB check to see if the annot is shared or not
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    annotation: annotId,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: Date.now(),
                })

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: annotId,
                added: DATA.__LISTS_1[1].id,
                deleted: null,
                options: { protectAnnotation: false },
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: true,
                    isBulkShareProtected: false,
                    lists: [DATA.__LISTS_1[0].id, DATA.__LISTS_1[1].id],
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: annotId,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                keepListsIfUnsharing: false,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: false,
                    lists: [DATA.__LISTS_1[1].id],
                }),
            ])
        })

        // it('should be able to update annotation sharing info via edit save btn, inheriting shared lists from parent page on share, filtering out shared lists on unshare (if requested)', async ({
        //     device,
        // }) => {
        //     const fullPageUrl = DATA.TAB_URL_1
        //     await device.storageManager
        //         .collection('annotations')
        //         .createObject(DATA.ANNOT_1)
        //     await device.storageManager
        //         .collection('customLists')
        //         .createObject(DATA.__LISTS_1[0])
        //     await device.storageManager
        //         .collection('customLists')
        //         .createObject(DATA.__LISTS_1[1])
        //     await device.storageManager
        //         .collection('sharedListMetadata')
        //         .createObject({
        //             localId: DATA.__LISTS_1[0].id,
        //             remoteId: 'test-share-1',
        //         })
        //     await device.storageManager
        //         .collection('pageListEntries')
        //         .createObject({
        //             listId: DATA.__LISTS_1[0].id,
        //             pageUrl: normalizeUrl(fullPageUrl),
        //             fullUrl: fullPageUrl,
        //         })
        //     await device.storageManager
        //         .collection('pageListEntries')
        //         .createObject({
        //             listId: DATA.__LISTS_1[1].id,
        //             pageUrl: normalizeUrl(fullPageUrl),
        //             fullUrl: fullPageUrl,
        //         })

        //     const { sidebar } = await setupLogicHelper({
        //         device,
        //         fullPageUrl: fullPageUrl,
        //         withAuth: true,
        //     })
        //     const annotId = DATA.ANNOT_1.url

        //     await sidebar.init()

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: false,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: false,
        //             lists: [],
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: true,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: true,
        //             isBulkShareProtected: false,
        //             lists: [DATA.__LISTS_1[0].id], // NOTE: second list isn't shared, so shouldn't show up here
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: false,
        //         keepListsIfUnsharing: true,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: true,
        //             lists: [DATA.__LISTS_1[0].id],
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: true,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: true,
        //             isBulkShareProtected: false,
        //             lists: [DATA.__LISTS_1[0].id],
        //         }),
        //     ])

        //     // NOTE: This exists as a bit of a hack, as in the UI we'd use the SingleNoteShareMenu comp which would ensure
        //     //  the correct DB ops happen in the BG, which won't work here where we are only using the sidebar UI logic
        //     //  which doesn't interact with the BG. `editAnnotation` will eventually trigger a DB check to see if the annot is shared or not
        //     await device.storageManager
        //         .collection('annotationPrivacyLevels')
        //         .createObject({
        //             annotation: annotId,
        //             privacyLevel: AnnotationPrivacyLevels.SHARED,
        //             createdWhen: Date.now(),
        //         })

        //     await sidebar.processEvent('updateListsForAnnotation', {
        //         unifiedAnnotationId: annotId,
        //         added: DATA.__LISTS_1[1].id,
        //         deleted: null,
        //         options: { protectAnnotation: false },
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: true,
        //             isBulkShareProtected: false,
        //             lists: [DATA.__LISTS_1[0].id, DATA.__LISTS_1[1].id],
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: false,
        //         isProtected: true,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: true,
        //             lists: [DATA.__LISTS_1[1].id],
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         shouldShare: false,
        //         keepListsIfUnsharing: false,
        //         context,
        //     })
        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: false,
        //             lists: [DATA.__LISTS_1[1].id],
        //         }),
        //     ])
        // })

        // it('should keep selectively shared annotation in "selectively shared" state upon main edit save btn press', async ({
        //     device,
        // }) => {
        //     const fullPageUrl = DATA.TAB_URL_1
        //     await device.storageManager
        //         .collection('annotations')
        //         .createObject(DATA.ANNOT_1)
        //     await device.storageManager
        //         .collection('customLists')
        //         .createObject(DATA.__LISTS_1[0])
        //     await device.storageManager
        //         .collection('customLists')
        //         .createObject(DATA.__LISTS_1[1])
        //     await device.storageManager
        //         .collection('sharedListMetadata')
        //         .createObject({
        //             localId: DATA.__LISTS_1[0].id,
        //             remoteId: 'test-share-1',
        //         })
        //     await device.storageManager
        //         .collection('pageListEntries')
        //         .createObject({
        //             listId: DATA.__LISTS_1[0].id,
        //             pageUrl: normalizeUrl(fullPageUrl),
        //             fullUrl: fullPageUrl,
        //         })
        //     await device.storageManager
        //         .collection('pageListEntries')
        //         .createObject({
        //             listId: DATA.__LISTS_1[1].id,
        //             pageUrl: normalizeUrl(fullPageUrl),
        //             fullUrl: fullPageUrl,
        //         })

        //     const { sidebar } = await setupLogicHelper({
        //         device,
        //         fullPageUrl: fullPageUrl,
        //         withAuth: true,
        //     })
        //     const publicListId = DATA.__LISTS_1[0].id
        //     const privateListId = DATA.__LISTS_1[1].id
        //     const annotId = DATA.ANNOT_1.url

        //     await sidebar.init()

        //     await sidebar.processEvent('updateListsForAnnotation', {
        //         unifiedAnnotationId: annotId,
        //         added: privateListId,
        //         deleted: null,
        //     })
        //     await sidebar.processEvent('updateListsForAnnotation', {
        //         unifiedAnnotationId: annotId,
        //         added: publicListId,
        //         deleted: null,
        //         options: { protectAnnotation: true },
        //     })

        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: true,
        //             lists: [privateListId, publicListId],
        //         }),
        //     ])

        //     await sidebar.processEvent('editAnnotation', {
        //         annotationUrl: annotId,
        //         mainBtnPressed: true,
        //         shouldShare: false,
        //         isProtected: true,
        //         context,
        //     })

        //     expect(sidebar.state.annotations).toEqual([
        //         expect.objectContaining({
        //             url: annotId,
        //             isShared: false,
        //             isBulkShareProtected: true,
        //             lists: [privateListId, publicListId],
        //         }),
        //     ])
        // })

        it('should be able to make a selectively shared annotation private, removing any shared lists without touching sibling annots', async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_2)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_3)
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 0,
                    annotation: DATA.ANNOT_1.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 1,
                    annotation: DATA.ANNOT_2.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[2])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[1].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[2].id,
                    remoteId: 'test-share-2',
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: normalizeUrl(fullPageUrl),
            })
            await sidebar.init()

            const privateListIdA = DATA.__LISTS_1[0].id
            const publicListIdA = DATA.__LISTS_1[1].id
            const publicListIdB = DATA.__LISTS_1[2].id
            const publicAnnotIdA = DATA.ANNOT_1.url
            const publicAnnotIdB = DATA.ANNOT_2.url
            const privateAnnotId = DATA.ANNOT_3.url

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: privateListIdA, // This list is private - doesn't affect things
                deleted: null,
            })
            // Make note selectively shared, by choosing to protect it upon shared list add
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: publicListIdA,
                deleted: null,
                options: { protectAnnotation: true },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA, publicListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: publicAnnotIdA,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])
        })

        it('should be able to make a selectively shared annotation private protected via edit save btn, removing any shared lists without touching sibling annots', async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_2)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_3)
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 0,
                    annotation: DATA.ANNOT_1.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 1,
                    annotation: DATA.ANNOT_2.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[2])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[1].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[2].id,
                    remoteId: 'test-share-2',
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: normalizeUrl(fullPageUrl),
            })
            await sidebar.init()

            const privateListIdA = DATA.__LISTS_1[0].id
            const publicListIdA = DATA.__LISTS_1[1].id
            const publicListIdB = DATA.__LISTS_1[2].id
            const publicAnnotIdA = DATA.ANNOT_1.url
            const publicAnnotIdB = DATA.ANNOT_2.url
            const privateAnnotId = DATA.ANNOT_3.url

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: privateListIdA, // This list is private - doesn't affect things
                deleted: null,
            })
            // Make note selectively shared, by choosing to protect it upon shared list add
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: publicListIdA,
                deleted: null,
                options: { protectAnnotation: true },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA, publicListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            // await sidebar.processEvent('editAnnotation', {
            //     annotationUrl: publicAnnotIdA,
            //     shouldShare: false,
            //     isProtected: true,
            //     context,
            // })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])
        })

        it('should be able to make a selectively shared annotation private protected, removing any shared lists without touching sibling annots', async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_2)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_3)
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 0,
                    annotation: DATA.ANNOT_1.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 1,
                    annotation: DATA.ANNOT_2.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[2])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[1].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[2].id,
                    remoteId: 'test-share-2',
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: normalizeUrl(fullPageUrl),
            })
            await sidebar.init()

            const privateListIdA = DATA.__LISTS_1[0].id
            const publicListIdA = DATA.__LISTS_1[1].id
            const publicListIdB = DATA.__LISTS_1[2].id
            const publicAnnotIdA = DATA.ANNOT_1.url
            const publicAnnotIdB = DATA.ANNOT_2.url
            const privateAnnotId = DATA.ANNOT_3.url

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: privateListIdA, // This list is private - doesn't affect things
                deleted: null,
            })
            // Make note selectively shared, by choosing to protect it upon shared list add
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: publicListIdA,
                deleted: null,
                options: { protectAnnotation: true },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA, publicListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: publicAnnotIdA,
                privacyLevel: AnnotationPrivacyLevels.PROTECTED,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])
        })

        it("should be able to make a selectively shared annotation public, setting lists to parent page's + any private lists, without touching sibling annots", async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_2)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_3)
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 0,
                    annotation: DATA.ANNOT_1.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 1,
                    annotation: DATA.ANNOT_2.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[2])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[1].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[2].id,
                    remoteId: 'test-share-2',
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: normalizeUrl(fullPageUrl),
            })
            await sidebar.init()

            const privateListIdA = DATA.__LISTS_1[0].id
            const publicListIdA = DATA.__LISTS_1[1].id
            const publicListIdB = DATA.__LISTS_1[2].id
            const publicAnnotIdA = DATA.ANNOT_1.url
            const publicAnnotIdB = DATA.ANNOT_2.url
            const privateAnnotId = DATA.ANNOT_3.url

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: privateListIdA, // This list is private - doesn't affect things
                deleted: null,
            })
            // Make note selectively shared, by choosing to protect it upon shared list add
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: publicListIdA,
                deleted: null,
                options: { protectAnnotation: true },
            })
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdB,
                added: publicListIdB,
                deleted: null,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA, publicListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA, publicListIdB],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: publicAnnotIdA,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [publicListIdA, publicListIdB, privateListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA, publicListIdB],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])
        })

        it('should be able to add public annotation to shared space, also adding other public annots', async ({
            device,
        }) => {
            const fullPageUrl = DATA.TAB_URL_1
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_1)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_2)
            await device.storageManager
                .collection('annotations')
                .createObject(DATA.ANNOT_3)
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 0,
                    annotation: DATA.ANNOT_1.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('annotationPrivacyLevels')
                .createObject({
                    id: 1,
                    annotation: DATA.ANNOT_2.url,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                    createdWhen: new Date(),
                })
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[0])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[1])
            await device.storageManager
                .collection('customLists')
                .createObject(DATA.__LISTS_1[2])
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[1].id,
                    remoteId: 'test-share-1',
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: DATA.__LISTS_1[2].id,
                    remoteId: 'test-share-2',
                })

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: normalizeUrl(fullPageUrl),
            })
            await sidebar.init()

            const privateListIdA = DATA.__LISTS_1[0].id
            const publicListIdA = DATA.__LISTS_1[1].id
            const publicListIdB = DATA.__LISTS_1[2].id
            const publicAnnotIdA = DATA.ANNOT_1.url
            const publicAnnotIdB = DATA.ANNOT_2.url
            const privateAnnotId = DATA.ANNOT_3.url

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: publicListIdA,
                deleted: null,
                options: { protectAnnotation: false },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: privateListIdA,
                deleted: null,
                options: { protectAnnotation: false },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [publicListIdA, privateListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            // Removing public list from public annot should result in it being selectively shared (protected + unshared)
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdA,
                added: null,
                deleted: publicListIdA,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [],
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            ])

            // Now let's add a shared list to the private annot, making it selectively shared
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: privateAnnotId,
                added: publicListIdB,
                deleted: null,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdA, publicListIdB],
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [publicListIdB],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
            ])

            // Now we make the final public annot selectively shared by removing a shared list from it
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: publicAnnotIdB,
                added: null,
                deleted: publicListIdA,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: publicAnnotIdA,
                    lists: [privateListIdA],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: publicAnnotIdB,
                    lists: [publicListIdB],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
                expect.objectContaining({
                    url: privateAnnotId,
                    lists: [publicListIdB],
                    isShared: false,
                    isBulkShareProtected: true,
                }),
            ])
        })

        it('should share annotations, simulating sidebar share process', async ({
            device,
        }) => {
            const {
                contentSharing,
                directLinking,
                personalCloud,
            } = device.backgroundModules

            // Make sure sync is enabled and running as sharing is handled in cloud translation layer
            await device.authService.setUser(TEST_USER)
            await personalCloud.enableSync()
            await personalCloud.setup()

            const localListId = await sharingTestData.createContentSharingTestList(
                device,
            )
            await contentSharing.shareList({ localListId })
            const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url
            const annotationUrl = await directLinking.createAnnotation(
                {} as any,
                {
                    pageUrl,
                    title: 'Page title',
                    body: 'Annot body',
                    comment: 'Annot comment',
                    selector: {
                        descriptor: {
                            content: [{ foo: 5 }],
                            strategy: 'eedwdwq',
                        },
                        quote: 'dawadawd',
                    },
                },
                { skipPageIndexing: true },
            )

            const { sidebar } = await setupLogicHelper({
                device,
                fullPageUrl: pageUrl,
                withAuth: true,
            })

            await sidebar.processEvent('receiveSharingAccessChange', {
                sharingAccess: 'sharing-allowed',
            })
            expect(sidebar.state.annotationSharingAccess).toEqual(
                'sharing-allowed',
            )
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({ url: annotationUrl }),
            ])

            // Triggers share menu opening
            await sidebar.processEvent('shareAnnotation', {
                annotationUrl,
                mouseEvent: {} as any,
            })
            expect(sidebar.state.activeShareMenuNoteId).toEqual(annotationUrl)

            // BG calls that run automatically upon share menu opening
            await contentSharing.shareAnnotation({
                annotationUrl,
                shareToLists: true,
            })

            await personalCloud.waitForSync()

            const serverStorage = await device.getServerStorage()
            expect(
                await serverStorage.manager
                    .collection('sharedAnnotation')
                    .findObjects({}),
            ).toEqual([
                expect.objectContaining({
                    body: 'Annot body',
                    comment: 'Annot comment',
                    selector: JSON.stringify({
                        descriptor: {
                            content: [{ foo: 5 }],
                            strategy: 'eedwdwq',
                        },
                        quote: 'dawadawd',
                    }),
                }),
            ])
        })

        it('should detect shared annotations on initialization', async ({
            device,
        }) => {
            const { contentSharing, directLinking } = device.backgroundModules
            await device.authService.setUser(TEST_USER)

            // Set up some shared data independent of the sidebar logic
            const localListId = await sharingTestData.createContentSharingTestList(
                device,
            )
            await contentSharing.shareList({ localListId })
            const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url

            // This annotation will be shared
            const annotationUrl1 = await directLinking.createAnnotation(
                {} as any,
                {
                    pageUrl,
                    title: 'Page title',
                    body: 'Annot body',
                    comment: 'Annot comment',
                    selector: {
                        descriptor: {
                            content: [{ foo: 5 }],
                            strategy: 'eedwdwq',
                        },
                        quote: 'dawadawd',
                    },
                },
                { skipPageIndexing: true },
            )
            // This annotation won't be shared
            const annotationUrl2 = await directLinking.createAnnotation(
                {} as any,
                {
                    pageUrl,
                    title: 'Page title',
                    body: 'Annot body 2',
                    comment: 'Annot comment 2',
                    selector: {
                        descriptor: {
                            content: [{ foo: 5 }],
                            strategy: 'eedwdwq',
                        },
                        quote: 'dawadawd 2',
                    },
                },
                { skipPageIndexing: true },
            )

            await contentSharing.shareAnnotation({
                annotationUrl: annotationUrl1,
                shareToLists: true,
            })
            await contentSharing.setAnnotationPrivacyLevel({
                annotationUrl: annotationUrl2,
                privacyLevel: AnnotationPrivacyLevels.PROTECTED,
            })
            await contentSharing.waitForSync()

            const { sidebar, sidebarLogic } = await setupLogicHelper({
                device,
                fullPageUrl: pageUrl,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotationUrl1,
                    isShared: true,
                    isBulkShareProtected: false,
                }),
                expect.objectContaining({
                    url: annotationUrl2,
                    isShared: false,
                    isBulkShareProtected: true,
                }),
            ])
        })
    })
})
