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
    const context = 'pageAnnotations'

    describe('space tab', () => {
        it('should hydrate the page annotations cache with annotations and lists data from the DB upon init', async ({
            device,
        }) => {
            const { sidebar, annotationsCache } = await setupLogicHelper({
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
                    annotationsCountLoadState: 'pristine',
                },
                [unifiedListIdB]: {
                    ...initListInstance(
                        annotationsCache.lists.byId[unifiedListIdB],
                    ),
                    sharedAnnotationReferences: [],
                    annotationsCountLoadState: 'pristine',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
            expect(sidebar.state.activeTab).toEqual('annotations')

            let wasBGMethodCalled = false
            sidebarLogic[
                'options'
            ].customLists.fetchAnnotationRefsForRemoteListsOnPage = (() => {
                wasBGMethodCalled = true
            }) as any

            await sidebar.processEvent('setActiveSidebarTab', { tab: 'spaces' })
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
                    annotationsCountLoadState: 'pristine',
                },
                [unifiedListIdB]: {
                    ...initListInstance(
                        annotationsCache.lists.byId[unifiedListIdB],
                    ),
                    sharedAnnotationReferences: [],
                    annotationsCountLoadState: 'pristine',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
                    annotationsCountLoadState: 'success',
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
            expect(sidebar.state.commentBox.commentText).toEqual(DATA.COMMENT_1)

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
            expect(sidebar.state.commentBox.commentText).toEqual(DATA.COMMENT_1)

            await sidebar.processEvent('saveNewPageNote', {
                shouldShare: false,
                now: 123,
            })

            const latestCachedAnnotId = annotationsCache.getLastAssignedAnnotationId()
            expect(sidebar.state.annotations.byId[latestCachedAnnotId]).toEqual(
                {
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
                },
            )
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
            expect(sidebar.state.commentBox.commentText).toEqual(DATA.COMMENT_1)

            expect(sidebar.state.commentBox.lists).toEqual([])
            await sidebar.processEvent('setNewPageNoteLists', {
                lists: [DATA.LOCAL_LISTS[0].id],
            })
            expect(sidebar.state.commentBox.lists).toEqual([
                DATA.LOCAL_LISTS[0].id,
            ])

            // TODO: Update this to trigger the `setSelectedSpace` event instead of directly mutating the state
            sidebar.processMutation({
                selectedSpace: {
                    $set: { localId: DATA.LOCAL_LISTS[1].id, remoteId: null },
                },
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
            expect(sidebar.state.annotations.byId[latestCachedAnnotId]).toEqual(
                {
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
                },
            )
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
            expect(sidebar.state.commentBox.commentText).toEqual(DATA.COMMENT_1)
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

        it('should be able to set focus on comment box', async ({ device }) => {
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
                    lastEdited: now + 1,
                }),
            )
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
    })

    describe.skip('page annotations tab', () => {
        it("should be able to edit an annotation's comment", async ({
            device,
        }) => {
            const { sidebar, annotationsCache } = await setupLogicHelper({
                device,
            })
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            // annotationsCache.annotations = [{ ...DATA.ANNOT_1, remoteId: null }]
            // sidebar.processMutation({
            //     annotations: { $set: [DATA.ANNOT_1] },
            //     editForms: {
            //         $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
            //     },
            // })

            const annotation = sidebar.state.annotations[0]
            expect(annotation.comment).toEqual(DATA.ANNOT_1.comment)

            await sidebar.processEvent('setAnnotationEditMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(
                sidebar.state.annotationModes[context][DATA.ANNOT_1.url],
            ).toEqual('edit')

            await sidebar.processEvent('setAnnotationEditCommentText', {
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
            })
            await sidebar.processEvent('editAnnotation', {
                annotationUrl: DATA.ANNOT_1.url,
                shouldShare: false,
                context,
            })
            expect(
                sidebar.state.annotationModes[context][annotation.url],
            ).toEqual('default')
            expect(sidebar.state.annotations[0].comment).toEqual(editedComment)
            expect(sidebar.state.annotations[0].tags).toEqual([])
            expect(sidebar.state.annotations[0].lastEdited).not.toEqual(
                annotation.lastEdited,
            )
        })

        it('should block annotation edit with login modal if logged out + save has share intent', async ({
            device,
        }) => {
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: false,
            })
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            // sidebar.processMutation({
            //     annotations: { $set: [DATA.ANNOT_1] },
            //     editForms: {
            //         $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
            //     },
            // })

            const annotation = sidebar.state.annotations[0]

            await sidebar.processEvent('setAnnotationEditMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })

            await sidebar.processEvent('setAnnotationEditCommentText', {
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
            })

            expect(sidebar.state.showLoginModal).toBe(false)
            expect(sidebar.state.annotations).toEqual([annotation])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: DATA.ANNOT_1.url,
                shouldShare: true,
                context,
            })

            expect(sidebar.state.showLoginModal).toBe(true)
            expect(sidebar.state.annotations).toEqual([annotation])
        })

        it('should be able to delete an annotation', async ({ device }) => {
            const { sidebar, annotationsCache } = await setupLogicHelper({
                device,
            })

            // annotationsCache.setAnnotations([
            //     { ...DATA.ANNOT_1, remoteId: null },
            // ])
            sidebar.processMutation({
                editForms: {
                    $set: createEditFormsForAnnotations([DATA.ANNOT_1]),
                },
            })

            await sidebar.processEvent('deleteAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.annotations.allIds.length).toBe(0)
        })

        // it('should be able to change annotation sharing access', async ({
        //     device,
        // }) => {
        //     const { sidebar } = await setupLogicHelper({ device })

        //     expect(sidebar.state.annotationSharingAccess).toEqual(
        //         'feature-disabled',
        //     )

        //     await sidebar.processEvent('receiveSharingAccessChange', {
        //         sharingAccess: 'sharing-allowed',
        //     })
        //     expect(sidebar.state.annotationSharingAccess).toEqual(
        //         'sharing-allowed',
        //     )

        //     await sidebar.processEvent('receiveSharingAccessChange', {
        //         sharingAccess: 'feature-disabled',
        //     })
        //     expect(sidebar.state.annotationSharingAccess).toEqual(
        //         'feature-disabled',
        //     )
        // })

        it('should be able to toggle sidebar lock', async ({ device }) => {
            const { sidebar } = await setupLogicHelper({ device })

            expect(sidebar.state.isLocked).toBe(false)
            await sidebar.processEvent('lock', null)
            expect(sidebar.state.isLocked).toBe(true)
            await sidebar.processEvent('unlock', null)
            expect(sidebar.state.isLocked).toBe(false)
        })

        it('should be able to copy note link', async ({ device }) => {
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
        })

        it('should be able to copy page link', async ({ device }) => {
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

            await sidebar.processEvent('copyPageLink', { link: 'test' })

            expect(clipboard).toEqual('test')
            expect(analytics.popNew()).toEqual([
                {
                    eventArgs: {
                        category: 'ContentSharing',
                        action: 'copyPageLink',
                    },
                },
            ])
        })

        it("should be able to focus the associated edit form on closing an annotation's space picker via the keyboard", async ({
            device,
        }) => {
            let focusedAnnotId: string = null
            const { sidebar } = await setupLogicHelper({
                device,
                focusEditNoteForm: (id) => (focusedAnnotId = id),
            })

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: DATA.ANNOT_1.url,
                position: 'footer',
            })
            expect(sidebar.state.activeListPickerState).toEqual({
                annotationId: DATA.ANNOT_1.url,
                position: 'footer',
            })
            expect(focusedAnnotId).toEqual(null)

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: DATA.ANNOT_1.url,
                position: 'lists-bar',
            })
            expect(sidebar.state.activeListPickerState).toEqual({
                annotationId: DATA.ANNOT_1.url,
                position: 'lists-bar',
            })
            expect(focusedAnnotId).toEqual(null)

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: DATA.ANNOT_1.url,
                position: 'lists-bar',
            })
            expect(sidebar.state.activeListPickerState).toEqual(undefined)
            expect(focusedAnnotId).toEqual(null)

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: DATA.ANNOT_1.url,
                position: 'lists-bar',
            })
            expect(sidebar.state.activeListPickerState).toEqual({
                annotationId: DATA.ANNOT_1.url,
                position: 'lists-bar',
            })
            expect(focusedAnnotId).toEqual(null)

            await sidebar.processEvent('resetListPickerAnnotationId', {
                id: DATA.ANNOT_1.url,
            })
            expect(sidebar.state.activeListPickerState).toEqual(undefined)
            expect(focusedAnnotId).toEqual(DATA.ANNOT_1.url)
        })
    })

    it('should check whether tags migration is done to signal showing of tags UI on init', async ({
        device,
    }) => {
        const {
            sidebar,
            sidebarLogic: { syncSettings },
        } = await setupLogicHelper({ device, skipInitEvent: true })

        await syncSettings.extension.set('areTagsMigratedToSpaces', false)
        expect(sidebar.state.shouldShowTagsUIs).toBe(false)
        await sidebar.init()
        expect(sidebar.state.shouldShowTagsUIs).toBe(true)

        await syncSettings.extension.set('areTagsMigratedToSpaces', true)
        expect(sidebar.state.shouldShowTagsUIs).toBe(true)
        await sidebar.init()
        expect(sidebar.state.shouldShowTagsUIs).toBe(false)
    })

    it('should be able to set active annotation copy paster', async ({
        device,
    }) => {
        const { sidebar } = await setupLogicHelper({ device })
        const id1 = 'test1'
        const id2 = 'test2'

        expect(sidebar.state.activeCopyPasterAnnotationId).toBeUndefined()
        sidebar.processEvent('setCopyPasterAnnotationId', { id: id1 })
        expect(sidebar.state.activeCopyPasterAnnotationId).toEqual(id1)
        sidebar.processEvent('setCopyPasterAnnotationId', { id: id2 })
        expect(sidebar.state.activeCopyPasterAnnotationId).toEqual(id2)
        sidebar.processEvent('setCopyPasterAnnotationId', { id: undefined })
        expect(sidebar.state.activeCopyPasterAnnotationId).toBeUndefined()
    })

    it('should be able to set active annotation tag picker', async ({
        device,
    }) => {
        const { sidebar } = await setupLogicHelper({ device })
        const id1 = 'test1'
        const id2 = 'test2'

        expect(sidebar.state.activeTagPickerAnnotationId).toBeUndefined()
        sidebar.processEvent('setTagPickerAnnotationId', { id: id1 })
        expect(sidebar.state.activeTagPickerAnnotationId).toEqual(id1)
        sidebar.processEvent('setTagPickerAnnotationId', { id: id2 })
        expect(sidebar.state.activeTagPickerAnnotationId).toEqual(id2)
        sidebar.processEvent('resetTagPickerAnnotationId', null)
        expect(sidebar.state.activeTagPickerAnnotationId).toBeUndefined()
    })

    it('should be able to trigger annotation sorting', async ({ device }) => {
        const { sidebar, annotationsCache } = await setupLogicHelper({ device })
        const testPageUrl = 'testurl'

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

    it('should set shared lists of parent page as lists for all public annotations, when loading', async ({
        device,
    }) => {
        const testPageUrl = DATA.TAB_URL_1
        const normalizedPageUrl = normalizeUrl(testPageUrl)
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
        await device.storageManager.collection('pageListEntries').createObject({
            listId: DATA.__LISTS_1[0].id,
            pageUrl: normalizedPageUrl,
            fullUrl: testPageUrl,
        })
        await device.storageManager.collection('pageListEntries').createObject({
            listId: DATA.__LISTS_1[1].id,
            pageUrl: normalizedPageUrl,
            fullUrl: testPageUrl,
        })

        const dummyAnnots = [
            {
                url: normalizedPageUrl + '/#test1',
                createdWhen: 1,
                pageUrl: normalizedPageUrl,
                isShared: true,
            },
            {
                url: normalizedPageUrl + '/#test2',
                createdWhen: 2,
                pageUrl: normalizedPageUrl,
                isShared: true,
            },
            {
                url: normalizedPageUrl + '/#test3',
                createdWhen: 3,
                pageUrl: normalizedPageUrl,
            },
            {
                url: normalizedPageUrl + '/#test4',
                createdWhen: 4,
                pageUrl: normalizedPageUrl,
            },
        ] as any

        for (const annot of dummyAnnots) {
            await device.storageManager
                .collection('annotations')
                .createObject(annot)

            if (annot.isShared) {
                await device.storageManager
                    .collection('sharedAnnotationMetadata')
                    .createObject({
                        localId: annot.url,
                        remoteId: annot.url,
                        excludeFromLists: false,
                    })
                await device.storageManager
                    .collection('annotationPrivacyLevels')
                    .createObject({
                        id: annot.url,
                        annotation: annot.url,
                        createdWhen: new Date(),
                        privacyLevel: AnnotationPrivacyLevels.SHARED,
                    })
            }
        }
        const { sidebar, annotationsCache } = await setupLogicHelper({ device })

        // await annotationsCache.load(normalizedPageUrl)

        expect(annotationsCache.annotations).toEqual([
            expect.objectContaining({
                url: dummyAnnots[0].url,
                lists: [DATA.__LISTS_1[0].id],
            }),
            expect.objectContaining({
                url: dummyAnnots[1].url,
                lists: [DATA.__LISTS_1[0].id],
            }),
            expect.objectContaining({ url: dummyAnnots[2].url, lists: [] }),
            expect.objectContaining({ url: dummyAnnots[3].url, lists: [] }),
        ])
    })

    describe.skip('sharing', () => {
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

        it('should be able to update annotation sharing info via edit save btn, inheriting shared lists from parent page on share, filtering out shared lists on unshare (if requested)', async ({
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
                withAuth: true,
            })
            const annotId = DATA.ANNOT_1.url

            await sidebar.init()

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: false,
                context,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: false,
                    lists: [],
                }),
            ])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: true,
                context,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: true,
                    isBulkShareProtected: false,
                    lists: [DATA.__LISTS_1[0].id], // NOTE: second list isn't shared, so shouldn't show up here
                }),
            ])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: false,
                keepListsIfUnsharing: true,
                context,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: true,
                    lists: [DATA.__LISTS_1[0].id],
                }),
            ])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: true,
                context,
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
            //  which doesn't interact with the BG. `editAnnotation` will eventually trigger a DB check to see if the annot is shared or not
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

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: false,
                isProtected: true,
                context,
            })
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: true,
                    lists: [DATA.__LISTS_1[1].id],
                }),
            ])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                shouldShare: false,
                keepListsIfUnsharing: false,
                context,
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

        it('should keep selectively shared annotation in "selectively shared" state upon main edit save btn press', async ({
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
                withAuth: true,
            })
            const publicListId = DATA.__LISTS_1[0].id
            const privateListId = DATA.__LISTS_1[1].id
            const annotId = DATA.ANNOT_1.url

            await sidebar.init()

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: annotId,
                added: privateListId,
                deleted: null,
            })
            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: annotId,
                added: publicListId,
                deleted: null,
                options: { protectAnnotation: true },
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: true,
                    lists: [privateListId, publicListId],
                }),
            ])

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: annotId,
                mainBtnPressed: true,
                shouldShare: false,
                isProtected: true,
                context,
            })

            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining({
                    url: annotId,
                    isShared: false,
                    isBulkShareProtected: true,
                    lists: [privateListId, publicListId],
                }),
            ])
        })

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

            await sidebar.processEvent('editAnnotation', {
                annotationUrl: publicAnnotIdA,
                shouldShare: false,
                isProtected: true,
                context,
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
                context: 'pageAnnotations',
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

        // it('should not immediately share annotation on click unless shortcut keys held', async ({
        //     device,
        // }) => {
        //     const { directLinking } = device.backgroundModules

        //     const pageUrl = sharingTestData.PAGE_1_DATA.pageDoc.url
        //     const annotationUrl = await directLinking.createAnnotation(
        //         {} as any,
        //         {
        //             pageUrl,
        //             title: 'Page title',
        //             body: 'Annot body',
        //             comment: 'Annot comment',
        //             selector: {
        //                 descriptor: {
        //                     content: [{ foo: 5 }],
        //                     strategy: 'eedwdwq',
        //                 },
        //                 quote: 'dawadawd',
        //             },
        //         },
        //         { skipPageIndexing: true },
        //     )

        //     const { sidebar } = await setupLogicHelper({
        //         device,
        //         pageUrl,
        //         withAuth: true,
        //     })
        //     await sidebar.processEvent('receiveSharingAccessChange', {
        //         sharingAccess: 'sharing-allowed',
        //     })

        //     // Triggers share menu opening
        //     await sidebar.processEvent('shareAnnotation', {
        //         context: 'pageAnnotations',
        //         annotationUrl,
        //         mouseEvent: {} as any,
        //     })
        //     expect(sidebar.state.activeShareMenuNoteId).toEqual(annotationUrl)
        //     expect(sidebar.state.immediatelyShareNotes).toEqual(false)

        //     await sidebar.processEvent('resetShareMenuNoteId', null)
        //     expect(sidebar.state.activeShareMenuNoteId).toEqual(undefined)

        //     await sidebar.processEvent('receiveSharingAccessChange', {
        //         sharingAccess: 'sharing-allowed',
        //     })

        //     await sidebar.processEvent('shareAnnotation', {
        //         context: 'pageAnnotations',
        //         annotationUrl,
        //         mouseEvent: { metaKey: true, altKey: true } as any,
        //     })
        //     expect(sidebar.state.activeShareMenuNoteId).toEqual(annotationUrl)
        //     expect(sidebar.state.immediatelyShareNotes).toEqual(true)

        //     await sidebar.processEvent('resetShareMenuNoteId', null)
        //     expect(sidebar.state.activeShareMenuNoteId).toEqual(undefined)
        //     expect(sidebar.state.immediatelyShareNotes).toEqual(false)
        // })

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

    describe.skip('followed lists + annotations', () => {
        async function setupFollowedListsTestData(device: UILogicTestDevice) {
            device.backgroundModules.customLists.remoteFunctions.fetchFollowedListsWithAnnotations = async () => [
                DATA.__FOLLOWED_LISTS[0],
                DATA.__FOLLOWED_LISTS[1],
                DATA.__FOLLOWED_LISTS[2],
                DATA.__FOLLOWED_LISTS[4],
            ]
            device.backgroundModules.contentSharing.canWriteToSharedListRemoteId = async () =>
                false
            device.backgroundModules.contentConversations.remoteFunctions.getThreadsForSharedAnnotations = async () =>
                DATA.ANNOTATION_THREADS
            device.backgroundModules.directLinking.remoteFunctions.getSharedAnnotations = async () =>
                [
                    DATA.SHARED_ANNOTATIONS[0],
                    DATA.SHARED_ANNOTATIONS[1],
                    DATA.SHARED_ANNOTATIONS[2],
                    DATA.SHARED_ANNOTATIONS[3],
                    DATA.SHARED_ANNOTATIONS[4],
                ] as any

            await device.storageManager.collection('customLists').createObject({
                id: 0,
                name: DATA.__FOLLOWED_LISTS[0].name,
                searchableName: DATA.__FOLLOWED_LISTS[0].name,
                createdAt: new Date(),
            })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: 0,
                    remoteId: DATA.__FOLLOWED_LISTS[0].id,
                })

            await device.storageManager.collection('customLists').createObject({
                id: 1,
                name: DATA.__FOLLOWED_LISTS[1].name,
                searchableName: DATA.__FOLLOWED_LISTS[1].name,
                createdAt: new Date(),
            })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: 1,
                    remoteId: DATA.__FOLLOWED_LISTS[1].id,
                })

            await device.storageManager.collection('customLists').createObject({
                id: 2,
                name: DATA.__FOLLOWED_LISTS[2].name,
                searchableName: DATA.__FOLLOWED_LISTS[2].name,
                createdAt: new Date(),
            })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: 2,
                    remoteId: DATA.__FOLLOWED_LISTS[2].id,
                })

            await device.storageManager.collection('customLists').createObject({
                id: 3,
                name: DATA.__FOLLOWED_LISTS[3].name,
                searchableName: DATA.__FOLLOWED_LISTS[3].name,
                createdAt: new Date(),
            })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: 3,
                    remoteId: DATA.__FOLLOWED_LISTS[3].id,
                })

            await device.storageManager
                .collection('pageListEntries')
                .createObject({
                    listId: 2,
                    pageUrl: normalizeUrl(DATA.TAB_URL_1),
                    fullUrl: DATA.TAB_URL_1,
                    createdAt: new Date(),
                })
            await device.storageManager
                .collection('pageListEntries')
                .createObject({
                    listId: 1,
                    pageUrl: normalizeUrl(DATA.TAB_URL_1),
                    fullUrl: DATA.TAB_URL_1,
                    createdAt: new Date(),
                })

            await device.storageManager
                .collection('annotListEntries')
                .createObject({
                    url: DATA.ANNOT_3.url,
                    listId: 2,
                    createdAt: new Date(),
                })
            await device.storageManager
                .collection('annotListEntries')
                .createObject({
                    url: DATA.ANNOT_3.url,
                    listId: 0,
                    createdAt: new Date(),
                })

            for (const { tags, lists, ...annot } of [
                DATA.ANNOT_1,
                DATA.ANNOT_2,
                DATA.ANNOT_3,
                DATA.ANNOT_4,
            ]) {
                await device.storageManager
                    .collection('annotations')
                    .createObject(annot)
            }

            await device.storageManager
                .collection('sharedAnnotationMetadata')
                .createObject({
                    excludeFromLists: true,
                    localId: DATA.ANNOT_3.url,
                    remoteId: DATA.SHARED_ANNOTATIONS[3].reference.id,
                })

            await device.storageManager
                .collection('sharedAnnotationMetadata')
                .createObject({
                    excludeFromLists: true,
                    localId: DATA.ANNOT_4.url,
                    remoteId: DATA.SHARED_ANNOTATIONS[4].reference.id,
                })
        }

        it('should be able to set isolated view mode for a specific joined space', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar, emittedEvents } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            const remoteListId = DATA.__FOLLOWED_LISTS[0].id
            const expectedEvents = []

            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.followedLists.byId[remoteListId]
                    .annotationsLoadState,
            ).toEqual('pristine')
            expect(sidebar.state.followedAnnotations).toEqual({})

            await sidebar.processEvent('setSelectedSpace', {
                remoteListId,
            })

            expectedEvents.push(
                {
                    event: 'setSelectedSpace',
                    args: { localId: 0, remoteId: remoteListId },
                },
                {
                    event: 'renderHighlights',
                    args: { highlights: expect.any(Array) },
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace.localId).toEqual(0)
            expect(sidebar.state.selectedSpace.remoteId).toEqual(remoteListId)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.followedLists.byId[remoteListId]
                    .annotationsLoadState,
            ).toEqual('success')
            expect(sidebar.state.followedAnnotations).toEqual(
                expect.objectContaining({
                    [DATA.SHARED_ANNOTATIONS[0].reference
                        .id]: expect.objectContaining({
                        id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                        body: DATA.SHARED_ANNOTATIONS[0].body,
                        selector: DATA.SHARED_ANNOTATIONS[0].selector,
                    }),
                    [DATA.SHARED_ANNOTATIONS[1].reference
                        .id]: expect.objectContaining({
                        id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                        comment: DATA.SHARED_ANNOTATIONS[1].comment,
                    }),
                }),
            )

            await sidebar.processEvent('setSelectedSpace', null)
            expectedEvents.push(
                {
                    event: 'renderHighlights',
                    args: { highlights: sidebar.state.annotations },
                },
                {
                    event: 'setSelectedSpace',
                    args: null,
                },
            )

            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.followedLists.byId[remoteListId]
                    .annotationsLoadState,
            ).toEqual('success')
        })

        it('should be able to set isolated view mode for a specific followed-only space', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar, emittedEvents } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            const remoteListId = DATA.__FOLLOWED_LISTS[4].id
            const expectedEvents = []

            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.followedLists.byId[remoteListId]
                    .annotationsLoadState,
            ).toEqual('pristine')
            expect(sidebar.state.followedAnnotations).toEqual({})

            await sidebar.processEvent('setSelectedSpace', { remoteListId })

            expectedEvents.push(
                {
                    event: 'setSelectedSpace',
                    args: { localId: null, remoteId: remoteListId },
                },
                {
                    event: 'renderHighlights',
                    args: { highlights: expect.any(Array) },
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace.localId).toEqual(null)
            expect(sidebar.state.selectedSpace.remoteId).toEqual(remoteListId)
            expect(emittedEvents).toEqual(expectedEvents)
            expect(
                sidebar.state.followedLists.byId[remoteListId]
                    .annotationsLoadState,
            ).toEqual('success')
            expect(sidebar.state.followedAnnotations).toEqual(
                expect.objectContaining({
                    [DATA.SHARED_ANNOTATIONS[0].reference
                        .id]: expect.objectContaining({
                        id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                        body: DATA.SHARED_ANNOTATIONS[0].body,
                        selector: DATA.SHARED_ANNOTATIONS[0].selector,
                    }),
                    [DATA.SHARED_ANNOTATIONS[1].reference
                        .id]: expect.objectContaining({
                        id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                        comment: DATA.SHARED_ANNOTATIONS[1].comment,
                    }),
                }),
            )

            await sidebar.processEvent('setSelectedSpace', null)

            expectedEvents.push(
                {
                    event: 'renderHighlights',
                    args: { highlights: sidebar.state.annotations },
                },
                {
                    event: 'setSelectedSpace',
                    args: null,
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
        })

        it('should be able to set isolated view mode for a specific local-only space', async ({
            device,
        }) => {
            await device.storageManager.collection('customLists').createObject({
                id: 0,
                name: 'test',
            })
            const { sidebar, emittedEvents } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            const localListId = 0
            const expectedEvents = []

            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setSelectedSpace', {
                localListId,
            })

            // expectedEvents.push(
            //     {
            //         event: 'renderHighlights',
            //         args: {
            //             highlights: sidebar.state.annotations.filter(
            //                 ({ lists }) => lists.includes(localListId),
            //             ),
            //         },
            //     },
            //     {
            //         event: 'setSelectedSpace',
            //         args: { localId: 0, remoteId: null },
            //     },
            // )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace.localId).toEqual(0)
            expect(sidebar.state.selectedSpace.remoteId).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setSelectedSpace', null)

            expectedEvents.push(
                {
                    event: 'renderHighlights',
                    args: { highlights: sidebar.state.annotations },
                },
                {
                    event: 'setSelectedSpace',
                    args: null,
                },
            )
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(sidebar.state.selectedSpace).toEqual(null)
            expect(emittedEvents).toEqual(expectedEvents)
        })

        it('should be able to switch sidebar tabs', async ({ device }) => {
            await setupFollowedListsTestData(device)
            const { sidebar, emittedEvents } = await setupLogicHelper({
                device,
                withAuth: true,
            })

            const expectedEvents = []

            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setActiveSidebarTab', { tab: 'feed' })
            expect(sidebar.state.activeTab).toEqual('feed')
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })
            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: expect.any(Array) },
            })
            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setActiveSidebarTab', { tab: 'spaces' })
            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: expect.any(Array) },
            })
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(emittedEvents).toEqual(expectedEvents)

            // Now go into selected space mode, which should stop the `renderHighlights` events from emitting
            sidebar.processMutation({
                selectedSpace: { $set: { localId: 0, remoteId: null } },
            })

            await sidebar.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })
            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(emittedEvents).toEqual(expectedEvents)

            await sidebar.processEvent('setActiveSidebarTab', { tab: 'spaces' })
            expect(sidebar.state.activeTab).toEqual('spaces')
            expect(emittedEvents).toEqual(expectedEvents)

            // Now get back out of selected space mode
            sidebar.processMutation({ selectedSpace: { $set: null } })

            await sidebar.processEvent('setActiveSidebarTab', {
                tab: 'annotations',
            })
            expectedEvents.push({
                event: 'renderHighlights',
                args: { highlights: expect.any(Array) },
            })
            expect(sidebar.state.activeTab).toEqual('annotations')
            expect(emittedEvents).toEqual(expectedEvents)
        })

        it('should be able to set notes type + trigger followed list load', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })

            // This awkwardness is due to the sloppy test data setup
            const loadedFollowedLists = DATA.__FOLLOWED_LISTS.filter(
                (list) => list.sharedAnnotationReferences.length > 0,
            )

            expect(sidebar.state.followedListLoadState).toEqual('success')
            expect(sidebar.state.followedLists).toEqual({
                allIds: loadedFollowedLists.map((list) => list.id),
                byId: fromPairs(
                    loadedFollowedLists.map((list) => [
                        list.id,
                        {
                            ...list,
                            isExpanded: false,
                            isContributable: list.id !== 'test e', // TODO: improve test setup
                            annotationsLoadState: 'pristine',
                            conversationsLoadState: 'pristine',
                            activeCopyPasterAnnotationId: undefined,
                            activeListPickerState: undefined,
                            activeShareMenuAnnotationId: undefined,
                            annotationModes: expect.any(Object),
                            annotationEditForms: expect.any(Object),
                        },
                    ]),
                ),
            })
        })

        it('should be able to expand notes for a followed list + trigger notes load', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar, emittedEvents } = await setupLogicHelper({
                device,
                withAuth: true,
            })

            const { id: listId } = DATA.__FOLLOWED_LISTS[0]
            const expectedEvents = []

            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.followedLists.byId[listId].isExpanded).toEqual(
                false,
            )
            expect(
                sidebar.state.followedLists.byId[listId].annotationsLoadState,
            ).toEqual('pristine')
            expect(sidebar.state.followedAnnotations).toEqual({})
            expect(sidebar.state.users).toEqual({})
            expect(sidebar.state.conversations).toEqual({})
            expect(
                sidebar.state.followedLists.byId[listId].annotationsLoadState,
            ).toEqual('pristine')
            expect(
                sidebar.state.followedLists.byId[listId].conversationsLoadState,
            ).toEqual('pristine')

            const expandPromise = sidebar.processEvent(
                'expandFollowedListNotes',
                { listId },
            )
            expect(
                sidebar.state.followedLists.byId[listId].annotationsLoadState,
            ).toEqual('running')
            await expandPromise

            expect(
                sidebar.state.followedLists.byId[listId].annotationsLoadState,
            ).toEqual('success')
            expect(
                sidebar.state.followedLists.byId[listId].conversationsLoadState,
            ).toEqual('success')

            expectedEvents.push({
                event: 'renderHighlights',
                args: {
                    highlights: [
                        {
                            url: DATA.SHARED_ANNOTATIONS[0].reference.id,
                            selector: DATA.SHARED_ANNOTATIONS[0].selector,
                        },
                    ],
                },
            })
            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.followedLists.byId[listId].isExpanded).toEqual(
                true,
            )
            expect(
                sidebar.state.followedLists.byId[listId].annotationsLoadState,
            ).toEqual('success')
            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: {
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[0].body,
                    comment: DATA.SHARED_ANNOTATIONS[0].comment,
                    selector: DATA.SHARED_ANNOTATIONS[0].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[0].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[0].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[0].creatorReference.id,
                    localId: null,
                },
                ['2']: {
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[1].body,
                    comment: DATA.SHARED_ANNOTATIONS[1].comment,
                    selector: DATA.SHARED_ANNOTATIONS[1].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[1].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[1].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[1].creatorReference.id,
                    localId: null,
                },
                ['3']: {
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[2].body,
                    comment: DATA.SHARED_ANNOTATIONS[2].comment,
                    selector: DATA.SHARED_ANNOTATIONS[2].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[2].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[2].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[2].creatorReference.id,
                    localId: null,
                },
                ['4']: {
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[3].body,
                    comment: DATA.SHARED_ANNOTATIONS[3].comment,
                    selector: DATA.SHARED_ANNOTATIONS[3].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[3].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[3].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[3].creatorReference.id,
                    localId: DATA.ANNOT_3.url,
                },
                ['5']: {
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[4].body,
                    comment: DATA.SHARED_ANNOTATIONS[4].comment,
                    selector: DATA.SHARED_ANNOTATIONS[4].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[4].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[4].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[4].creatorReference.id,
                    localId: DATA.ANNOT_4.url,
                },
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.users).toEqual({
                [DATA.SHARED_ANNOTATIONS[0].creatorReference.id]: {
                    name: DATA.__CREATOR_1.user.displayName,
                    profileImgSrc: DATA.__CREATOR_1.profile.avatarURL,
                },
                [DATA.SHARED_ANNOTATIONS[3].creatorReference.id]: {
                    name: DATA.__CREATOR_2.user.displayName,
                    profileImgSrc: DATA.__CREATOR_2.profile.avatarURL,
                },
            })
            expect(sidebar.state.conversations).toEqual(
                fromPairs(
                    DATA.ANNOTATION_THREADS.map((data) => [
                        `${data.sharedList.id}:${data.sharedAnnotation.id}`,
                        {
                            ...getInitialAnnotationConversationState(),
                            hasThreadLoadLoadState: 'success',
                            thread: data.thread,
                        },
                    ]),
                ),
            )

            await sidebar.processEvent('expandFollowedListNotes', { listId })

            expectedEvents.push({
                event: 'removeAnnotationHighlights',
                args: {
                    urls: [
                        DATA.SHARED_ANNOTATIONS[0].reference.id,
                        DATA.SHARED_ANNOTATIONS[3].reference.id,
                    ],
                },
            })
            expect(emittedEvents).toEqual(expectedEvents)
            expect(sidebar.state.followedLists.byId[listId].isExpanded).toEqual(
                false,
            )
        })

        it('should be able to delete own note that shows up in shared spaces, deleting from both sidebar mode states', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[0].id,
            })
            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[2].id,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: {
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[0].body,
                    comment: DATA.SHARED_ANNOTATIONS[0].comment,
                    selector: DATA.SHARED_ANNOTATIONS[0].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[0].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[0].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[0].creatorReference.id,
                    localId: null,
                },
                ['2']: {
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[1].body,
                    comment: DATA.SHARED_ANNOTATIONS[1].comment,
                    selector: DATA.SHARED_ANNOTATIONS[1].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[1].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[1].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[1].creatorReference.id,
                    localId: null,
                },
                ['3']: {
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[2].body,
                    comment: DATA.SHARED_ANNOTATIONS[2].comment,
                    selector: DATA.SHARED_ANNOTATIONS[2].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[2].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[2].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[2].creatorReference.id,
                    localId: null,
                },
                ['4']: {
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[3].body,
                    comment: DATA.SHARED_ANNOTATIONS[3].comment,
                    selector: DATA.SHARED_ANNOTATIONS[3].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[3].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[3].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[3].creatorReference.id,
                    localId: DATA.ANNOT_3.url,
                },
                ['5']: {
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[4].body,
                    comment: DATA.SHARED_ANNOTATIONS[4].comment,
                    selector: DATA.SHARED_ANNOTATIONS[4].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[4].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[4].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[4].creatorReference.id,
                    localId: DATA.ANNOT_4.url,
                },
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])

            await sidebar.processEvent('deleteAnnotation', {
                annotationUrl: DATA.ANNOT_3.url,
                context,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: {
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[0].body,
                    comment: DATA.SHARED_ANNOTATIONS[0].comment,
                    selector: DATA.SHARED_ANNOTATIONS[0].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[0].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[0].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[0].creatorReference.id,
                    localId: null,
                },
                ['2']: {
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[1].body,
                    comment: DATA.SHARED_ANNOTATIONS[1].comment,
                    selector: DATA.SHARED_ANNOTATIONS[1].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[1].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[1].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[1].creatorReference.id,
                    localId: null,
                },
                ['3']: {
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[2].body,
                    comment: DATA.SHARED_ANNOTATIONS[2].comment,
                    selector: DATA.SHARED_ANNOTATIONS[2].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[2].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[2].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[2].creatorReference.id,
                    localId: null,
                },
                ['5']: {
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    body: DATA.SHARED_ANNOTATIONS[4].body,
                    comment: DATA.SHARED_ANNOTATIONS[4].comment,
                    selector: DATA.SHARED_ANNOTATIONS[4].selector,
                    createdWhen: DATA.SHARED_ANNOTATIONS[4].createdWhen,
                    updatedWhen: DATA.SHARED_ANNOTATIONS[4].updatedWhen,
                    creatorId: DATA.SHARED_ANNOTATIONS[4].creatorReference.id,
                    localId: DATA.ANNOT_4.url,
                },
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining(DATA.ANNOT_4),
            ])
        })

        it('should be able to make own note that shows up in shared spaces private/protected, removing it from any followed list state', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            await sidebar.init()

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[0].id,
            })
            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[2].id,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])

            // Nothing should change, as we're choosing to keep lists
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: DATA.ANNOT_3.url,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                keepListsIfUnsharing: true,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    isShared: false,
                    isBulkShareProtected: true,
                    lastEdited: expect.any(Date),
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])

            // Now we're not keeping lists, so it should get removed from all
            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: DATA.ANNOT_3.url,
                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    isShared: false,
                    isBulkShareProtected: false,
                    lastEdited: expect.any(Date),
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])
        })

        it("should be able to make own note that shows up in shared spaces public, adding/removing it to/from any followed list states that the parent page is/isn't a part of", async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            await sidebar.init()

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[0].id,
            })
            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[2].id,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])

            await sidebar.processEvent('updateAnnotationShareInfo', {
                annotationUrl: DATA.ANNOT_3.url,
                privacyLevel: AnnotationPrivacyLevels.SHARED,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference]) // No longer in here, as parent page is not
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
                DATA.SHARED_ANNOTATIONS[3].reference, // Now in here, as parent page is
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference, // Remains in here, as parent page is
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    isShared: true,
                    isBulkShareProtected: false,
                    lastEdited: expect.any(Date),
                    lists: expect.any(Array),
                }),
                expect.objectContaining(DATA.ANNOT_4),
            ])
        })

        it('should be able to add+remove own note that shows up in shared spaces to other shared spaces, thus showing up/hidden in newly added/removed shared space', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            await sidebar.init()

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[0].id,
            })
            await sidebar.processEvent('expandFollowedListNotes', {
                listId: DATA.__FOLLOWED_LISTS[2].id,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining({
                    ...DATA.ANNOT_4,
                    lists: expect.any(Array),
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_3.url,
                deleted: 0,
                added: null,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference]) // No longer in here
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                DATA.SHARED_ANNOTATIONS[3].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining({
                    ...DATA.ANNOT_4,
                    lists: expect.any(Array),
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_3.url,
                deleted: 2,
                added: null,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
                // DATA.SHARED_ANNOTATIONS[3].reference, // No longer in here
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining({
                    ...DATA.ANNOT_4,
                    lists: expect.any(Array),
                }),
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_3.url,
                deleted: null,
                added: 1,
            })

            expect(sidebar.state.followedAnnotations).toEqual({
                ['1']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[0].reference.id,
                    localId: null,
                }),
                ['2']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[1].reference.id,
                    localId: null,
                }),
                ['3']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[2].reference.id,
                    localId: null,
                }),
                ['4']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[3].reference.id,
                    localId: DATA.ANNOT_3.url,
                }),
                ['5']: expect.objectContaining({
                    id: DATA.SHARED_ANNOTATIONS[4].reference.id,
                    localId: DATA.ANNOT_4.url,
                }),
            })
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[0].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[0].reference])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[1].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[1].reference,
                DATA.SHARED_ANNOTATIONS[3].reference, // Now here!
            ])
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[2].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[0].reference,
                DATA.SHARED_ANNOTATIONS[2].reference,
            ])
            expect(sidebar.state.annotations).toEqual([
                expect.objectContaining(DATA.ANNOT_1),
                expect.objectContaining(DATA.ANNOT_2),
                expect.objectContaining({
                    ...DATA.ANNOT_3,
                    lists: expect.any(Array),
                }),
                expect.objectContaining({
                    ...DATA.ANNOT_4,
                    lists: expect.any(Array),
                }),
            ])

            // Followed list states should be created and removed on final annotation add/removal
            expect(sidebar.state.followedLists.allIds).toEqual(
                expect.not.arrayContaining([DATA.__FOLLOWED_LISTS[3].id]),
            )
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[3].id],
            ).toEqual(undefined)

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_3.url,
                deleted: null,
                added: 3,
            })

            expect(sidebar.state.followedLists.allIds).toEqual(
                expect.arrayContaining([DATA.__FOLLOWED_LISTS[3].id]),
            )
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[3].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[3].reference])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_4.url,
                deleted: null,
                added: 3,
            })

            expect(sidebar.state.followedLists.allIds).toEqual(
                expect.arrayContaining([DATA.__FOLLOWED_LISTS[3].id]),
            )
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[3].id]
                    .sharedAnnotationReferences,
            ).toEqual([
                DATA.SHARED_ANNOTATIONS[3].reference,
                DATA.SHARED_ANNOTATIONS[4].reference,
            ])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_4.url,
                deleted: 3,
                added: null,
            })

            expect(sidebar.state.followedLists.allIds).toEqual(
                expect.arrayContaining([DATA.__FOLLOWED_LISTS[3].id]),
            )
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[3].id]
                    .sharedAnnotationReferences,
            ).toEqual([DATA.SHARED_ANNOTATIONS[3].reference])

            await sidebar.processEvent('updateListsForAnnotation', {
                unifiedAnnotationId: DATA.ANNOT_3.url,
                deleted: 3,
                added: null,
            })

            expect(sidebar.state.followedLists.allIds).toEqual(
                expect.not.arrayContaining([DATA.__FOLLOWED_LISTS[3].id]),
            )
            expect(
                sidebar.state.followedLists.byId[DATA.__FOLLOWED_LISTS[3].id],
            ).toEqual(undefined)
        })

        it('should be able to toggle space picker, copy paster, and share menu popups on own annotations in followed lists', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            await sidebar.init()
            const annotationId = DATA.ANNOT_3.url
            const followedListId = DATA.__FOLLOWED_LISTS[2].id

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: followedListId,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('setCopyPasterAnnotationId', {
                id: annotationId,
                followedListId,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: annotationId,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('resetCopyPasterAnnotationId', null)

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: annotationId,
                followedListId,
                position: 'footer',
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: {
                        annotationId,
                        position: 'footer',
                    },
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: annotationId,
                followedListId,
                position: 'footer',
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('setListPickerAnnotationId', {
                id: annotationId,
                followedListId,
                position: 'lists-bar',
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: {
                        annotationId,
                        position: 'lists-bar',
                    },
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('resetListPickerAnnotationId', {})

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )

            await sidebar.processEvent('shareAnnotation', {
                annotationUrl: annotationId,
                followedListId,
                mouseEvent: {} as any,
                context,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: annotationId,
                }),
            )

            await sidebar.processEvent('resetShareMenuNoteId', null)

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    activeCopyPasterAnnotationId: undefined,
                    activeListPickerState: undefined,
                    activeShareMenuAnnotationId: undefined,
                }),
            )
        })

        it('should be able to change between edit, delete, and default mode on own annotations in followed lists', async ({
            device,
        }) => {
            await setupFollowedListsTestData(device)
            const { sidebar } = await setupLogicHelper({
                device,
                withAuth: true,
            })
            await sidebar.init()
            const annotationId = DATA.ANNOT_3.url
            const followedListId = DATA.__FOLLOWED_LISTS[2].id

            await sidebar.processEvent('expandFollowedListNotes', {
                listId: followedListId,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    annotationModes: { [annotationId]: 'default' },
                }),
            )

            await sidebar.processEvent('setAnnotationEditMode', {
                annotationUrl: annotationId,
                followedListId,
                context,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    annotationModes: { [annotationId]: 'edit' },
                }),
            )

            await sidebar.processEvent('cancelEdit', {
                annotationUrl: annotationId,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    annotationModes: { [annotationId]: 'default' },
                }),
            )

            await sidebar.processEvent('switchAnnotationMode', {
                annotationUrl: annotationId,
                followedListId,
                mode: 'delete',
                context,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    annotationModes: { [annotationId]: 'delete' },
                }),
            )

            await sidebar.processEvent('switchAnnotationMode', {
                annotationUrl: annotationId,
                followedListId,
                mode: 'default',
                context,
            })

            expect(sidebar.state.followedLists.byId[followedListId]).toEqual(
                expect.objectContaining({
                    annotationModes: { [annotationId]: 'default' },
                }),
            )
        })
    })
})
