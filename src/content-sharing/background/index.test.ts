import expect from 'expect'
import type StorageManager from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestInstance,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import * as data from './index.test.data'
import { BackgroundIntegrationTestSetupOpts } from 'src/tests/background-integration-tests'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { createMemoryServerStorage } from 'src/storage/server.tests'
import { FakeFetch } from 'src/util/tests/fake-fetch'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SharingTestHelper } from './index.tests'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import {
    SharedList,
    SharedListEntry,
    SharedListKey,
    SharedListReference,
    SharedListRoleID,
    SharedListTree,
    SharedPageInfo,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { maybeInt } from '@worldbrain/memex-common/lib/utils/conversion'
import { indexTestFingerprintedPdf } from 'src/page-indexing/background/index.tests'
import { createPageLinkListTitle } from '@worldbrain/memex-common/lib/content-sharing/utils'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type {
    PersonalContentLocator,
    PersonalContentMetadata,
    PersonalList,
    PersonalListTree,
} from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import {
    ContentLocatorFormat,
    ContentLocatorType,
    FingerprintSchemeType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { getSinglePageShareUrl } from '../utils'
import { buildBaseLocatorUrl } from '@worldbrain/memex-common/lib/page-indexing/utils'
import type { OpenGraphSiteLookupResponse } from '@worldbrain/memex-common/lib/opengraph/types'
import { LIST_EMAIL_INVITE_VALIDITY_MS } from '@worldbrain/memex-common/lib/content-sharing/constants'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher/lib/index'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { RETRIEVE_PDF_ROUTE } from '@worldbrain/memex-common/lib/pdf/uploads/constants'
import { ROOT_NODE_PARENT_ID } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import { DEFAULT_KEY } from '@worldbrain/memex-common/lib/utils/item-ordering'

async function setupPreTest({ setup }: BackgroundIntegrationTestContext) {
    setup.injectCallFirebaseFunction(async <Returns>() => null as Returns)
}

const sortByField = <T = any>(field: keyof T) => (a: T, b: T) => {
    if (a[field] < b[field]) {
        return -1
    }
    if (a[field] > b[field]) {
        return 1
    }
    return 0
}

interface TestData {
    localListId?: number
    remoteListId?: string
}

async function setupTest(options: {
    setup: BackgroundIntegrationTestContext['setup']
    testData?: TestData
    createTestList?: boolean
}) {
    const { setup, testData } = options
    const {
        contentSharing,
        personalCloud,
        directLinking,
    } = setup.backgroundModules

    let sentPrivateListEmailInvite: Pick<
        SharedListKey,
        'expiresWhen' | 'roleID'
    > & {
        email: string
        spaceName: string
        spaceURLwithKey: string
    } = null

    contentSharing.options.backend[
        'dependencies'
    ].sendPrivateListEmailInvite = async (email, details) => {
        sentPrivateListEmailInvite = { email, ...details }
        return { status: 'success' }
    }

    await setup.authService.setUser(TEST_USER)
    await personalCloud.options.settingStore.set('deviceId', data.DEVICE_ID_A)
    personalCloud.actionQueue.forceQueueSkip = true
    await personalCloud.setup()
    await personalCloud.startSync()

    const serverStorage = setup.serverStorage
    await serverStorage.manager.operation('createObject', 'user', TEST_USER)

    if (options.createTestList) {
        testData.localListId = await data.createContentSharingTestList(setup)
    }

    const shareTestList = async () => {
        const listShareResult = await contentSharing.scheduleListShare({
            localListId: testData.localListId,
        })
        await contentSharing.waitForListShareSideEffects({
            localListId: testData.localListId,
        })
        testData.remoteListId = listShareResult.remoteListId
        return listShareResult.remoteListId
    }

    const getFromDB = (storageManager: StorageManager) => (
        collection: string,
        opts?: { skipOrdering?: boolean },
    ) =>
        storageManager.operation(
            'findObjects',
            collection,
            {},
            opts?.skipOrdering ? undefined : { order: [['id', 'asc']] },
        )

    const getShared = getFromDB(serverStorage.manager)
    const getLocal = getFromDB(setup.storageManager)

    return {
        authService: setup.authService,
        getSentPrivateListEmailInvite: () => sentPrivateListEmailInvite,
        directLinking,
        contentSharing,
        personalCloud,
        shareTestList,
        getShared,
        getLocal,
    }
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Content sharing',
    [
        backgroundIntegrationTest(
            'should share a new list with its entries',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, { id: 1 })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createPage(setup, {
                                    id: 2,
                                    listId: 1,
                                })
                                await helper.shareList(setup, { id: 1 })
                                await helper.assertSharedLists(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                    { listId: 1, pageId: 2 },
                                ])
                            },
                            postCheck: async ({ setup }) => {
                                await helper.assertSharedListMetadata(setup, {
                                    ids: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share new entries to an already shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, { id: 1 })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.shareList(setup, { id: 1 })
                                await helper.createPage(setup, {
                                    id: 2,
                                    listId: 1,
                                })
                                await helper.assertSharedLists(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                    { listId: 1, pageId: 2 },
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should sync the title when changing the title of an already shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, { id: 1 })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.shareList(setup, { id: 1 })
                                await helper.editListTitle(setup, {
                                    id: 1,
                                    title: 'updated title',
                                })
                                await helper.assertSharedLists(setup, {
                                    ids: [1],
                                })

                                // It should not fail when trying to update other fields than the title of the list
                                await helper.updateListData(setup, {
                                    id: 1,
                                    updates: { searchableName: 'something' },
                                })
                                await helper.assertSharedLists(setup, {
                                    ids: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should delete list entries of an already shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.removePageFromList(setup, {
                                    pageId: 1,
                                    listId: 1,
                                })
                                await helper.assertSharedListEntries(setup, [])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should share newly shared annotations in an already shared list using the 'shareAnnotation' method`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotation',
                    testDuplicateSharing: false,
                }),
        ),
        backgroundIntegrationTest(
            `should not share annotations more than once in an already shared list using the 'shareAnnotation' method`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotation',
                    testDuplicateSharing: true,
                }),
        ),
        backgroundIntegrationTest(
            `should share newly shared annotations in an already shared list using the 'shareAnnotations' method`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotations',
                    testDuplicateSharing: false,
                }),
        ),
        backgroundIntegrationTest(
            `should not share annotations more than once in an already shared list using the 'shareAnnotations' method`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotations',
                    testDuplicateSharing: true,
                }),
        ),
        backgroundIntegrationTest(
            `should skip sharing protected annotations in an already shared list using the 'shareAnnotations' method`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotations',
                    testProtectedBulkShare: true,
                    testDuplicateSharing: true,
                }),
        ),
        backgroundIntegrationTest(
            'should share a private note across all shared lists the page is in when made public',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share a private and a private protected note to one list when manually added to a list, making it protected',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PROTECTED,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PROTECTED,
                                    },
                                })
                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1, 2],
                                        listIds: [1],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: true,
                                            },
                                            2: {
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: true,
                                            },
                                        },
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should share a note across the lists it's not yet in when making it public, ignoring lists it's already added to and removing protected state`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: true,
                                            },
                                        },
                                    },
                                )
                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should not share private protected notes across all lists when sharing all notes`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PROTECTED,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PROTECTED,
                                    },
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    ],
                                )
                                await helper.shareAnnotations(
                                    setup,
                                    [{ id: 1, expectNotShared: true }],
                                    {
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: false,
                                            },
                                        },
                                    },
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should remove public non-protected notes from all lists when making all page notes private, not unsharing the notes themselves`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.unshareAnnotations(setup, {
                                    ids: [1],
                                    expectedSharingStates: {
                                        1: {
                                            sharedListIds: [],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            hasLink: true,
                                        },
                                    },
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should not unshare public protected notes when unsharing all page notes`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level:
                                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED_PROTECTED,
                                    },
                                })
                                await helper.unshareAnnotations(setup, {
                                    ids: [1],
                                    expectedSharingStates: {
                                        1: {
                                            sharedListIds: [1, 2],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                                            hasLink: true,
                                        },
                                    },
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should share a page and note to a new list when adding a note to a list the page is not shared in`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [2],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [1, 2],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                                hasLink: true,
                                            },
                                        },
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 2 },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should share a public note to a new list when adding the page it's on to a new shared list`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.addPageToList(setup, {
                                    pageId: 1,
                                    listId: 2,
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should not share a selective not to a new list when adding its page to a new list`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: true,
                                            },
                                        },
                                    },
                                )
                                await helper.addPageToList(setup, {
                                    pageId: 1,
                                    listId: 2,
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should remove a note from all lists when making a selective note private, not unsharing the note itself`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                                hasLink: true,
                                            },
                                        },
                                    },
                                )

                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    keepListsIfUnsharing: false,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                        hasLink: true,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should _not_ remove a note from lists when making a public note private, when user chooses to keep lists`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                // These shouldn't yet exist locally as the note is public (and thus inherits lists from parent page)
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )

                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    keepListsIfUnsharing: true,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PROTECTED,
                                    },
                                })

                                // Now that the note is no longer public, those entries should exist
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })

                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should remove a note from all shared lists when making a public note private, not unsharing the note itself`,
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 3,
                                    share: false,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2, 3],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [3],
                                        protectAnnotations: false,
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1, 2],
                                                privateListIds: [3],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )
                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 3 }],
                                )

                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    keepListsIfUnsharing: false,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [3],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 3 }],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should unshare public annotations from lists',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )

                                await helper.unshareAnnotationsFromAllLists(
                                    setup,
                                    {
                                        ids: [1],
                                        expectedSharingStates: {
                                            1: {
                                                sharedListIds: [],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PRIVATE,
                                                hasLink: true,
                                            },
                                        },
                                    },
                                )

                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share already public annotations adding a page to another shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createPage(setup, {
                                    id: 2,
                                    listId: 2,
                                })

                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 2,
                                    expectedSharingState: {
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )

                                await helper.addPageToList(setup, {
                                    pageId: 1,
                                    listId: 2,
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should update the body of a shared annotation',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    expectedSharingState: {
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.editAnnotationComment(setup, {
                                    id: 1,
                                    comment: 'Updated comment',
                                    body: 'Updated body',
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share already public annotations when sharing a list containing already shared pages',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createPage(setup, {
                                    id: 2,
                                    listId: 2,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )

                                await helper.addPageToList(setup, {
                                    pageId: 1,
                                    listId: 2,
                                })
                                await helper.shareList(setup, { id: 2 })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                await helper.assertSharedLists(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should unshare an annotation completely with its link',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [],
                                })

                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.unshareAnnotation(setup, {
                                    id: 1,
                                    expectedSharingState: {
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        hasLink: false,
                                    },
                                })
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should unshare annotations when removing a page from a shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                // await personalCloud.waitForSync()

                                // expect(
                                //     await getShared(
                                //         'sharedAnnotationListEntry',
                                //         { skipOrdering: true },
                                //     ),
                                // ).toEqual([expect.objectContaining({})])

                                await helper.removePageFromList(setup, {
                                    pageId: 1,
                                    listId: 1,
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 2 }],
                                )

                                await helper.removePageFromList(setup, {
                                    pageId: 1,
                                    listId: 2,
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                // expect(
                                //     await getShared(
                                //         'sharedAnnotationListEntry',
                                //         { skipOrdering: true },
                                //     ),
                                // ).toEqual([])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should unshare annotation and remove list entries when removed locally',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })
                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                })
                                await helper.shareAnnotation(setup, {
                                    id: 1,
                                    shareToParentPageLists: true,
                                    expectedSharingState: {
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                        hasLink: true,
                                    },
                                })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )

                                await helper.deleteAnnotation(setup, { id: 1 })
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [],
                                })
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share PDF fingerprints and locators',
            { skipConflictTests: true },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    personalCloud,
                                    shareTestList,
                                    getShared,
                                } = await setupTest({
                                    setup,
                                    testData,
                                    createTestList: true,
                                })
                                await shareTestList()
                                const tabId = 1
                                const {
                                    identifier,
                                    fingerprints,
                                } = await indexTestFingerprintedPdf(setup, {
                                    tabId,
                                })
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: testData.localListId,
                                        contentIdentifier: identifier,
                                        tabId,
                                    },
                                )
                                await personalCloud.waitForSync()
                                expect(
                                    (
                                        await getShared(
                                            'sharedContentFingerprint',
                                            { skipOrdering: true },
                                        )
                                    ).sort(sortByField('sharedList')),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: maybeInt(
                                            testData.remoteListId,
                                        ),
                                        normalizedUrl: identifier.normalizedUrl,
                                        fingerprintScheme:
                                            fingerprints[0].fingerprintScheme,
                                        fingerprint:
                                            fingerprints[0].fingerprint,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: maybeInt(
                                            testData.remoteListId,
                                        ),
                                        normalizedUrl: identifier.normalizedUrl,
                                        fingerprintScheme:
                                            fingerprints[1].fingerprintScheme,
                                        fingerprint:
                                            fingerprints[1].fingerprint,
                                    },
                                ])
                                expect(
                                    await getShared('sharedContentLocator', {
                                        skipOrdering: true,
                                    }),
                                ).toEqual([])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add a list to local lists and store its metadata when the user joined a new list',
            { skipConflictTests: true, skipSyncTests: true },
            () => {
                const helper = new SharingTestHelper()
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { personalCloud } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const serverStorage = setup.serverStorage
                                const listReference = await serverStorage.modules.contentSharing.createSharedList(
                                    {
                                        listData: {
                                            title: 'Test list',
                                        },
                                        userReference: {
                                            type: 'user-reference',
                                            id: 'someone-else',
                                        },
                                    },
                                )
                                const {
                                    keyString,
                                } = await serverStorage.modules.contentSharing.createListKey(
                                    {
                                        key: { roleID: SharedListRoleID.Admin },
                                        listReference,
                                    },
                                )
                                await setup.backgroundModules.contentSharing.options.backend.processListKey(
                                    {
                                        keyString,
                                        listId: listReference.id,
                                    },
                                )

                                await personalCloud.integrateAllUpdates()
                                await personalCloud.waitForSync()

                                const customLists = await setup.storageManager.operation(
                                    'findObjects',
                                    'customLists',
                                    {},
                                )
                                expect(customLists).toEqual([
                                    expect.objectContaining({
                                        name: 'Test list',
                                    }),
                                ])
                                expect(
                                    await setup.storageManager.operation(
                                        'findObjects',
                                        'sharedListMetadata',
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        localId: customLists[0].id,
                                        remoteId: listReference.id.toString(),
                                    },
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should create shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for a standard web page - via cloud',
            { skipConflictTests: true, skipSyncTests: true },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const { manager } = setup.serverStorage
                                const listTitle = createPageLinkListTitle()
                                const pageTitle = 'test page title'
                                const fullPageUrl = 'https://memex.garden'
                                const normalizedPageUrl = 'memex.garden'
                                const userId = TEST_USER.id

                                const mockResponse: OpenGraphSiteLookupResponse = {
                                    url: normalizedPageUrl,
                                    hybridGraph: { title: pageTitle },
                                }
                                setup.fetch.mock('*', 200, {
                                    response: JSON.stringify(mockResponse),
                                    sendAsJson: true,
                                })

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const nowA = Date.now()
                                const pageLinkParamsA = await contentSharing.options.backend.createPageLink(
                                    { fullPageUrl, now: nowA },
                                )
                                const linkA = getSinglePageShareUrl(
                                    pageLinkParamsA,
                                )

                                // Shared cloud DB data
                                const sharedListDataA: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataA: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataA: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataA: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(linkA).toEqual(getSinglePageShareUrl({
                                    remoteListId: sharedListDataA[0].id,
                                    remoteListEntryId: sharedListEntryDataA[0].id,
                               }))
                                expect(sharedListDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListTreeDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: sharedListDataA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        order: DEFAULT_KEY,
                                        linkTarget: null,
                                        path: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListEntryDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        entryTitle: pageTitle,
                                        originalUrl: fullPageUrl,
                                        normalizedUrl: normalizedPageUrl,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedPageDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedPageUrl,
                                        originalUrl: fullPageUrl,
                                        fullTitle: pageTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesA: Array<
                                    PersonalListTree & { id: AutoPk }
                                > = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalReadsA = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: expect.anything(), // TODO: Can we expect an actual value?
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalListTreesA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: nowA,
                                        personalList: personalListsA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        linkTarget: null,
                                        path: null,
                                        localListId: personalListsA[0].localId,
                                        localParentListId: ROOT_NODE_PARENT_ID,
                                        localLinkTarget: null,
                                        localPath: null,
                                        order: DEFAULT_KEY,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullPageUrl,
                                        title: pageTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalReadsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.HTML,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        lastVisited: expect.anything(),
                                        localId: null,
                                        contentSize: null,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: sharedListDataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: sharedListDataA[0].id,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                await personalCloud.integrateAllUpdates()
                                await personalCloud.waitForSync()

                                // Re-check local DB data post-sync
                                // prettier-ignore
                                {
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: nowA,
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            createdAt: expect.anything()
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([
                                        {
                                            id: nowA,
                                            listId: nowA,
                                            parentListId: ROOT_NODE_PARENT_ID,
                                            linkTarget: null,
                                            path: null,
                                            order: DEFAULT_KEY,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: expect.anything(),
                                            pageUrl: normalizedPageUrl,
                                            fullUrl: fullPageUrl,
                                            createdAt: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: expect.anything(),
                                            remoteId: sharedListDataA[0].id,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: sharedListDataA[0].id,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: sharedListDataA[0].id,
                                            sharedListEntry: sharedListEntryDataA[0].id,
                                            entryTitle: pageTitle,
                                            creator: userId,
                                            normalizedPageUrl,
                                            hasAnnotationsFromOthers: false,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedPageUrl,
                                            fullUrl: fullPageUrl,
                                            canonicalUrl: fullPageUrl,
                                            fullTitle: pageTitle,
                                            domain: 'memex.garden',
                                            hostname: 'memex.garden',
                                            text: '',
                                            urlTerms: expect.anything(),
                                            titleTerms: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedPageUrl,
                                            time: expect.any(Number)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                // Try it once more to assert that sharedPageInfo+personalContentMetadata+personalContentLocator isn't recreated
                                const pageLinkParamsB = await contentSharing.options.backend.createPageLink(
                                    { fullPageUrl },
                                )
                                const linkB = getSinglePageShareUrl(
                                    pageLinkParamsB,
                                )

                                // Shared cloud DB data
                                const sharedListDataB: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataB: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataB: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataB: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})
                                const personalListsB = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesB = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalMetadataB = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalReadsB = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsB = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                expect(linkB).toEqual(
                                    getSinglePageShareUrl({
                                        remoteListId: sharedListDataB[1].id,
                                        remoteListEntryId:
                                            sharedListEntryDataB[1].id,
                                    }),
                                )

                                expect(sharedListDataA.length).toBe(1)
                                expect(sharedListDataB.length).toBe(2) // There should be a new list, but same page
                                expect(sharedListTreeDataA.length).toBe(1)
                                expect(sharedListTreeDataB.length).toBe(2) // Same deal
                                expect(sharedPageDataA.length).toBe(1)
                                expect(sharedPageDataB.length).toBe(1)
                                expect(sharedListEntryDataA.length).toBe(1)
                                expect(sharedListEntryDataB.length).toBe(2)

                                expect(personalListsA.length).toBe(1)
                                expect(personalListsB.length).toBe(2)
                                expect(personalListTreesA.length).toBe(1)
                                expect(personalListTreesB.length).toBe(2)
                                expect(personalMetadataA.length).toBe(1)
                                expect(personalMetadataB.length).toBe(1)
                                expect(personalReadsA.length).toBe(1)
                                expect(personalReadsB.length).toBe(2)
                                expect(personalLocatorsA.length).toBe(1)
                                expect(personalLocatorsB.length).toBe(1)
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should created shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for a standard web page - via extension',
            { skipConflictTests: true, skipSyncTests: true },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const { manager } = setup.serverStorage
                                const now = Date.now()
                                const listTitle = createPageLinkListTitle(
                                    new Date(now),
                                )
                                const pageTitle = 'Test'
                                const fullPageUrl = 'http://test.com'
                                const normalizedPageUrl = 'test.com'
                                const userId = TEST_USER.id

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const tabInfo = { tab: { id: 123 } }
                                const {
                                    collabKey,
                                    localListId,
                                    remoteListId,
                                    remoteListEntryId,
                                    listTitle: createdListTitle,
                                } = await contentSharing.schedulePageLinkCreation(
                                    tabInfo,
                                    {
                                        fullPageUrl,
                                        now,
                                        customPageTitle: null,
                                    },
                                )
                                await contentSharing.waitForPageLinkCreation({
                                    fullPageUrl,
                                })

                                // Local DB data should be created first
                                // prettier-ignore
                                {
                                    expect(localListId).toEqual(now)
                                    expect(createdListTitle).toEqual(listTitle)
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: localListId,
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            searchableName: listTitle,
                                            nameTerms: expect.any(Array),
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: localListId,
                                            pageUrl: normalizedPageUrl,
                                            fullUrl: fullPageUrl,
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: localListId,
                                            remoteId: remoteListId,
                                            private: false
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: remoteListId,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: undefined
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: remoteListId,
                                            entryTitle: pageTitle,
                                            creator: userId,
                                            normalizedPageUrl,
                                            hasAnnotationsFromOthers: false,
                                            sharedListEntry: remoteListEntryId,
                                            createdWhen: now,
                                            updatedWhen: now,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedPageUrl,
                                            fullUrl: fullPageUrl,
                                            fullTitle: pageTitle,
                                            domain: normalizedPageUrl,
                                            hostname: normalizedPageUrl,
                                            text: 'test',
                                            terms: expect.any(Array),
                                            urlTerms: expect.any(Array),
                                            titleTerms: expect.any(Array),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedPageUrl,
                                            time: now
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                // Sync so everything uploads and creates cloud-side data
                                await personalCloud.integrateAllUpdates()
                                await personalCloud.waitForSync()

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListId),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        private: false,
                                        description: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListEntryId),
                                        creator: userId,
                                        entryTitle: pageTitle,
                                        originalUrl: fullPageUrl,
                                        normalizedUrl: normalizedPageUrl,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedPageUrl,
                                        originalUrl: fullPageUrl,
                                        fullTitle: pageTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(collabKey),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: expect.anything(), // TODO: Can we expect an actual value?
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullPageUrl,
                                        title: pageTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        pageEnd: null,
                                        pageMax: null,
                                        pageTotal: null,
                                        readDuration: null,
                                        scrollEndPixel: null,
                                        scrollMaxPixel: null,
                                        scrollEndPercentage: null,
                                        scrollMaxPercentage: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.HTML,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        lastVisited: expect.anything(),
                                        localId: null,
                                        contentSize: null,
                                        fingerprint: null,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: remoteListId,
                                        user: userId,
                                        private: false,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: remoteListId,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should create shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for a PDF - via cloud',
            { skipConflictTests: true, skipSyncTests: true },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const { manager } = setup.serverStorage
                                const now = Date.now()
                                const listTitle = createPageLinkListTitle()
                                const pdfTitle = 'test pdf title'
                                const fullPageUrl = 'https://test.com/test.pdf'
                                const normalizedPageUrl = 'test.com/test.pdf'
                                const fingerprintA = 'test-pdf-fingerprint-a'
                                const fingerprintB = 'test-pdf-fingerprint-b'
                                const localLocatorIdA = now
                                const localLocatorIdB = now + 1
                                const fullBaseLocatorUrl = buildBaseLocatorUrl(
                                    fingerprintA,
                                    ContentLocatorFormat.PDF,
                                )
                                const normalizedBaseLocatorUrl = normalizeUrl(
                                    fullBaseLocatorUrl,
                                )
                                const userId = TEST_USER.id

                                contentSharing.options.backend[
                                    'dependencies'
                                ].fetchPDFData = (async () => ({
                                    title: pdfTitle,
                                    pdfMetadata: {
                                        fingerprints: [
                                            fingerprintA,
                                            fingerprintB,
                                        ],
                                    },
                                })) as any

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const pageLinkParamsA = await contentSharing.options.backend.createPageLink(
                                    { now, fullPageUrl },
                                )
                                const linkA = getSinglePageShareUrl(
                                    pageLinkParamsA,
                                )

                                // Shared cloud DB data
                                const sharedListDataA: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataA: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataA: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataA: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(linkA).toEqual(getSinglePageShareUrl({
                                    remoteListId: sharedListDataA[0].id,
                                    remoteListEntryId: sharedListEntryDataA[0].id,
                               }))
                                expect(sharedListDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListTreeDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: sharedListDataA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        order: DEFAULT_KEY,
                                        linkTarget: null,
                                        path: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListEntryDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        entryTitle: pdfTitle,
                                        originalUrl: fullBaseLocatorUrl,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedPageDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        fullTitle: pdfTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: sharedListDataA[0].id,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: null,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                    }
                                ])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesA: Array<
                                    PersonalListTree & { id: AutoPk }
                                > = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalReadsA = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: now,
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalListTreesA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: now,
                                        personalList: personalListsA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        linkTarget: null,
                                        path: null,
                                        localListId: personalListsA[0].localId,
                                        localParentListId: ROOT_NODE_PARENT_ID,
                                        localLinkTarget: null,
                                        localPath: null,
                                        order: DEFAULT_KEY,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullBaseLocatorUrl,
                                        title: pdfTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalReadsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    // Dummy/base locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.MemexCloud,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: null,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Locators for PDF's fingerprints
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocatorIdA,
                                        fingerprint: fingerprintA,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocatorIdB,
                                        fingerprint: fingerprintB,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: sharedListDataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: sharedListDataA[0].id,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                await personalCloud.integrateAllUpdates()
                                await personalCloud.waitForSync()

                                // Re-check local DB data post-sync
                                // prettier-ignore
                                {
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: now,
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            createdAt: expect.anything()
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([
                                        {
                                            id: now,
                                            listId: now,
                                            parentListId: ROOT_NODE_PARENT_ID,
                                            linkTarget: null,
                                            path: null,
                                            order: DEFAULT_KEY,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: expect.anything(),
                                            pageUrl: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            createdAt: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: expect.anything(),
                                            remoteId: sharedListDataA[0].id,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: sharedListDataA[0].id,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: sharedListDataA[0].id,
                                            sharedListEntry: sharedListEntryDataA[0].id,
                                            entryTitle: pdfTitle,
                                            creator: userId,
                                            normalizedPageUrl: normalizedBaseLocatorUrl,
                                            hasAnnotationsFromOthers: false,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            canonicalUrl: fullBaseLocatorUrl,
                                            fullTitle: pdfTitle,
                                            domain: 'memex.cloud',
                                            hostname: 'memex.cloud',
                                            text: '',
                                            urlTerms: expect.anything(),
                                            titleTerms: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            time: now,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([
                                        {
                                            id: localLocatorIdA,
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.NormalizedUrlV1,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullPageUrl,
                                            location: normalizedPageUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintA,
                                            lastVisited: expect.any(Number),
                                            deviceId: null,
                                        },
                                        {
                                            id: localLocatorIdB,
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.NormalizedUrlV1,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullPageUrl,
                                            location: normalizedPageUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintB,
                                            lastVisited: expect.any(Number),
                                            deviceId: null,
                                        }
                                    ])
                                }

                                // Try it once more to assert that sharedPageInfo+personalContentMetadata+personalContentLocator isn't recreated
                                const pageLinkParamsB = await contentSharing.options.backend.createPageLink(
                                    {
                                        fullPageUrl,
                                        now: now + 10,
                                    },
                                )
                                const linkB = getSinglePageShareUrl(
                                    pageLinkParamsB,
                                )

                                // Shared cloud DB data
                                const sharedListDataB: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataB: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataB: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataB: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})
                                const personalListsB = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesB = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalMetadataB = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalReadsB = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsB = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                expect(linkB).toEqual(
                                    getSinglePageShareUrl({
                                        remoteListId: sharedListDataB[1].id,
                                        remoteListEntryId:
                                            sharedListEntryDataB[1].id,
                                    }),
                                )

                                expect(sharedListDataA.length).toBe(1)
                                expect(sharedListDataB.length).toBe(2) // There should be a new list, but same page
                                expect(sharedListTreeDataA.length).toBe(1)
                                expect(sharedListTreeDataB.length).toBe(2) // Same deal
                                expect(sharedPageDataA.length).toBe(1)
                                expect(sharedPageDataB.length).toBe(1)
                                expect(sharedListEntryDataA.length).toBe(1)
                                expect(sharedListEntryDataB.length).toBe(2)

                                expect(personalListsA.length).toBe(1)
                                expect(personalListsB.length).toBe(2)
                                expect(personalListTreesA.length).toBe(1)
                                expect(personalListTreesB.length).toBe(2)
                                expect(personalMetadataA.length).toBe(1)
                                expect(personalMetadataB.length).toBe(1)
                                expect(personalReadsA.length).toBe(1)
                                expect(personalReadsB.length).toBe(2)
                                expect(personalLocatorsA.length).toBe(3)
                                expect(personalLocatorsB.length).toBe(3)
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should create shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for an uploaded PDF - via cloud',
            { skipConflictTests: true, skipSyncTests: true },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const { manager } = setup.serverStorage
                                const now = Date.now()
                                const listTitle = createPageLinkListTitle()
                                const pdfTitle = 'test pdf title'
                                const pdfRetrieveToken = 'my-test-token'
                                const tmpPdfAccessUrl = `${CLOUDFLARE_WORKER_URLS.production}${RETRIEVE_PDF_ROUTE}?token=${pdfRetrieveToken}`
                                const normalizedTmpPdfAccessUrl = normalizeUrl(
                                    tmpPdfAccessUrl,
                                )
                                const uploadId = 'test-upload-id'
                                const fingerprintA = 'test-pdf-fingerprint-a'
                                const fingerprintB = 'test-pdf-fingerprint-b'
                                const localLocatorIdA = now
                                const localLocatorIdB = now + 1
                                const localLocatorIdC = now + 2
                                const fullBaseLocatorUrl = buildBaseLocatorUrl(
                                    fingerprintA,
                                    ContentLocatorFormat.PDF,
                                )
                                const normalizedBaseLocatorUrl = normalizeUrl(
                                    fullBaseLocatorUrl,
                                )
                                const userId = TEST_USER.id

                                contentSharing.options.backend[
                                    'dependencies'
                                ].fetchPDFData = (async () => ({
                                    title: pdfTitle,
                                    pdfMetadata: {
                                        fingerprints: [
                                            fingerprintA,
                                            fingerprintB,
                                        ],
                                    },
                                })) as any

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListTree').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const pageLinkParamsA = await contentSharing.options.backend.createPageLink(
                                    {
                                        now,
                                        fullPageUrl: tmpPdfAccessUrl,
                                        uploadedPdfParams: {
                                            fingerprints: [
                                                fingerprintA,
                                                fingerprintB,
                                            ],
                                            title: pdfTitle,
                                            uploadId,
                                        },
                                    },
                                )
                                const linkA = getSinglePageShareUrl(
                                    pageLinkParamsA,
                                )

                                // Shared cloud DB data
                                const sharedListDataA: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataA: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataA: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataA: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(linkA).toEqual(getSinglePageShareUrl({
                                    remoteListId: sharedListDataA[0].id,
                                    remoteListEntryId: sharedListEntryDataA[0].id,
                               }))
                                expect(sharedListDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListTreeDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: sharedListDataA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        order: DEFAULT_KEY,
                                        linkTarget: null,
                                        path: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedListEntryDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        entryTitle: pdfTitle,
                                        originalUrl: fullBaseLocatorUrl,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(sharedPageDataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        fullTitle: pdfTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: sharedListDataA[0].id,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        location: uploadId,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: null,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        location: uploadId,
                                    },
                                ])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: sharedListDataA[0].id,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalReadsA = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: expect.anything(), // TODO: Can we expect an actual value?
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalListTreesA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: now,
                                        personalList: personalListsA[0].id,
                                        parentListId: ROOT_NODE_PARENT_ID,
                                        linkTarget: null,
                                        path: null,
                                        localListId: personalListsA[0].localId,
                                        localParentListId: ROOT_NODE_PARENT_ID,
                                        localLinkTarget: null,
                                        localPath: null,
                                        order: DEFAULT_KEY,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullBaseLocatorUrl,
                                        title: pdfTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalReadsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    // Dummy/base locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.MemexCloud,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: null,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Locators for PDF's fingerprints
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: tmpPdfAccessUrl,
                                        location: normalizedTmpPdfAccessUrl,
                                        locationScheme: LocationSchemeType.FilesystemPathV1,
                                        locationType: ContentLocatorType.Local,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocatorIdA,
                                        fingerprint: fingerprintA,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: tmpPdfAccessUrl,
                                        location: normalizedTmpPdfAccessUrl,
                                        locationScheme: LocationSchemeType.FilesystemPathV1,
                                        locationType: ContentLocatorType.Local,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocatorIdB,
                                        fingerprint: fingerprintB,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Uploaded PDFs have the upload locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: uploadId,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        status: 'uploaded',
                                        localId: localLocatorIdC,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        contentSize: null,
                                        createdByDevice: null,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: sharedListDataA[0].id,
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: sharedListDataA[0].id,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                await personalCloud.integrateAllUpdates()
                                await personalCloud.waitForSync()

                                // Re-check local DB data post-sync
                                // prettier-ignore
                                {
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(), // TODO: Can we predict this?
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            createdAt: expect.anything()
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('customListTrees').findAllObjects({})).toEqual([
                                        {
                                            id: now,
                                            listId: now,
                                            parentListId: ROOT_NODE_PARENT_ID,
                                            linkTarget: null,
                                            path: null,
                                            order: DEFAULT_KEY,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: expect.anything(),
                                            pageUrl: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            createdAt: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: expect.anything(),
                                            remoteId: sharedListDataA[0].id,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: sharedListDataA[0].id,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: sharedListDataA[0].id,
                                            sharedListEntry: sharedListEntryDataA[0].id,
                                            entryTitle: pdfTitle,
                                            creator: userId,
                                            normalizedPageUrl: normalizedBaseLocatorUrl,
                                            hasAnnotationsFromOthers: false,
                                            createdWhen: expect.anything(),
                                            updatedWhen: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            canonicalUrl: fullBaseLocatorUrl,
                                            fullTitle: pdfTitle,
                                            domain: 'memex.cloud',
                                            hostname: 'memex.cloud',
                                            text: '',
                                            urlTerms: expect.anything(),
                                            titleTerms: expect.anything(),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            time: now,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([
                                        {
                                            id: localLocatorIdA,
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.FilesystemPathV1,
                                            locationType: ContentLocatorType.Local,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: tmpPdfAccessUrl,
                                            location: normalizedTmpPdfAccessUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintA,
                                            lastVisited: expect.any(Number),
                                            deviceId: null,
                                        },
                                        {
                                            id: localLocatorIdB,
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.FilesystemPathV1,
                                            locationType: ContentLocatorType.Local,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: tmpPdfAccessUrl,
                                            location: normalizedTmpPdfAccessUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintB,
                                            lastVisited: expect.any(Number),
                                            deviceId: null,
                                        },
                                        {
                                            id: localLocatorIdC,
                                            locationScheme: LocationSchemeType.UploadStorage,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullBaseLocatorUrl,
                                            location: uploadId,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            lastVisited: expect.any(Number),
                                            status: 'uploaded',
                                            deviceId: null,
                                            fingerprint: null,
                                            fingerprintScheme: null,
                                        },
                                    ])
                                }

                                // Try it once more to assert that sharedPageInfo+personalContentMetadata+personalContentLocator isn't recreated
                                const pageLinkParamsB = await contentSharing.options.backend.createPageLink(
                                    {
                                        fullPageUrl: tmpPdfAccessUrl,
                                        uploadedPdfParams: {
                                            fingerprints: [
                                                fingerprintA,
                                                fingerprintB,
                                            ],
                                            title: pdfTitle,
                                            uploadId,
                                        },
                                        now: now + 10,
                                    },
                                )
                                const linkB = getSinglePageShareUrl(
                                    pageLinkParamsB,
                                )

                                // Shared cloud DB data
                                const sharedListDataB: Array<
                                    SharedList & { id: AutoPk }
                                > = await manager
                                    .collection('sharedList')
                                    .findAllObjects({})
                                const sharedListTreeDataB: Array<
                                    SharedListTree & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListTree')
                                    .findAllObjects({})
                                const sharedPageDataB: Array<
                                    SharedPageInfo & { id: AutoPk }
                                > = await manager
                                    .collection('sharedPageInfo')
                                    .findAllObjects({})
                                const sharedListEntryDataB: Array<
                                    SharedListEntry & { id: AutoPk }
                                > = await manager
                                    .collection('sharedListEntry')
                                    .findAllObjects({})
                                const personalListsB = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalListTreesB = await manager
                                    .collection('personalListTree')
                                    .findAllObjects({})
                                const personalMetadataB = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalReadsB = await manager
                                    .collection('personalContentRead')
                                    .findAllObjects({})
                                const personalLocatorsB = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                expect(linkB).toEqual(
                                    getSinglePageShareUrl({
                                        remoteListId: sharedListDataB[1].id,
                                        remoteListEntryId:
                                            sharedListEntryDataB[1].id,
                                    }),
                                )

                                expect(sharedListDataA.length).toBe(1)
                                expect(sharedListDataB.length).toBe(2) // There should be a new list, but same page
                                expect(sharedListTreeDataA.length).toBe(1)
                                expect(sharedListTreeDataB.length).toBe(2) // Same deal
                                expect(sharedPageDataA.length).toBe(1)
                                expect(sharedPageDataB.length).toBe(1)
                                expect(sharedListEntryDataA.length).toBe(1)
                                expect(sharedListEntryDataB.length).toBe(2)

                                expect(personalListsA.length).toBe(1)
                                expect(personalListsB.length).toBe(2)
                                expect(personalListTreesA.length).toBe(1)
                                expect(personalListTreesB.length).toBe(2)
                                expect(personalMetadataA.length).toBe(1)
                                expect(personalMetadataB.length).toBe(1)
                                expect(personalReadsA.length).toBe(1)
                                expect(personalReadsB.length).toBe(2)
                                expect(personalLocatorsA.length).toBe(4)
                                expect(personalLocatorsB.length).toBe(4)
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to create invites to a private space',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { contentSharing } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const nowB = Date.now() + 10
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'
                                const emailB = 'b@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([])

                                const resultA: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )

                                const expectedKeyA = {
                                    id: resultA.keyString,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowA,
                                    updatedWhen: nowA,
                                    expiresWhen:
                                        nowA + LIST_EMAIL_INVITE_VALIDITY_MS,
                                    roleID: SharedListRoleID.Commenter,
                                    disabled: false,
                                    singleUse: true,
                                }
                                const expectedInviteA = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey: resultA.keyString,
                                }

                                expect(resultA.status).toEqual('success')
                                expect(resultA.keyString).toBeDefined()
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([expectedKeyA])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([expectedInviteA])

                                const resultB = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowB,
                                        email: emailB,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.ReadWrite,
                                    },
                                )

                                expect(resultB.status).toEqual('success')
                                if (resultB.status === 'success') {
                                    expect(resultB.keyString).toBeDefined()
                                    expect(
                                        await manager
                                            .collection('sharedListKey')
                                            .findAllObjects({}),
                                    ).toEqual([
                                        expectedKeyA,
                                        {
                                            id: resultB.keyString,
                                            sharedList: sharedListIdA,
                                            createdWhen: nowB,
                                            updatedWhen: nowB,
                                            expiresWhen:
                                                nowB +
                                                LIST_EMAIL_INVITE_VALIDITY_MS,
                                            roleID: SharedListRoleID.ReadWrite,
                                            disabled: false,
                                            singleUse: true,
                                        },
                                    ])
                                    expect(
                                        await manager
                                            .collection('sharedListEmailInvite')
                                            .findAllObjects({}),
                                    ).toEqual([
                                        expectedInviteA,
                                        {
                                            id: expect.anything(),
                                            email: emailB,
                                            createdWhen: nowB,
                                            sharedList: sharedListIdA,
                                            sharedListKey: resultB.keyString,
                                        },
                                    ])
                                }
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should NOT be able to create invites to a private space if current user does not own it',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { contentSharing } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const now = Date.now()
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: 'some-other-user-id',
                                        createdWhen: now,
                                        updatedWhen: now,
                                        private: true,
                                    })

                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([])

                                const {
                                    status,
                                } = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )

                                expect(status).toEqual('permission-denied')
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to load invites to a private space',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { contentSharing } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const nowB = Date.now() + 10
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'
                                const emailB = 'b@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })
                                const listReference: SharedListReference = {
                                    id: sharedListIdA,
                                    type: 'shared-list-reference',
                                }

                                expect(
                                    await contentSharing.options.backend.loadListEmailInvites(
                                        { listReference },
                                    ),
                                ).toEqual({
                                    status: 'success',
                                    data: [],
                                })

                                await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )
                                await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowB,
                                        email: emailB,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.ReadWrite,
                                    },
                                )

                                expect(
                                    await contentSharing.options.backend.loadListEmailInvites(
                                        { listReference },
                                    ),
                                ).toEqual({
                                    status: 'success',
                                    data: [
                                        {
                                            id: expect.anything(),
                                            email: emailA,
                                            createdWhen: nowA,
                                            roleID: SharedListRoleID.Commenter,
                                        },
                                        {
                                            id: expect.anything(),
                                            email: emailB,
                                            createdWhen: nowB,
                                            roleID: SharedListRoleID.ReadWrite,
                                        },
                                    ],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should NOT be able to load invites to a private space if current user does not own it',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { contentSharing } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: 'some-other-user-id',
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                expect(
                                    await contentSharing.options.backend.loadListEmailInvites(
                                        {
                                            listReference: {
                                                type: 'shared-list-reference',
                                                id: sharedListIdA,
                                            },
                                        },
                                    ),
                                ).toEqual({
                                    status: 'permission-denied',
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to delete invites to a private space as the owner',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const { contentSharing } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const nowB = Date.now() + 10
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'
                                const emailB = 'b@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                const resultA: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )
                                const resultB: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowB,
                                        email: emailB,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.ReadWrite,
                                    },
                                )

                                const expectedKeyA = {
                                    id: resultA.keyString,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowA,
                                    updatedWhen: nowA,
                                    expiresWhen:
                                        nowA + LIST_EMAIL_INVITE_VALIDITY_MS,
                                    roleID: SharedListRoleID.Commenter,
                                    disabled: false,
                                    singleUse: true,
                                }
                                const expectedInviteA = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey: resultA.keyString,
                                }

                                expect(resultA.status).toEqual('success')
                                expect(resultA.keyString).toBeDefined()
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([
                                    expectedKeyA,
                                    {
                                        id: resultB.keyString,
                                        sharedList: sharedListIdA,
                                        createdWhen: nowB,
                                        updatedWhen: nowB,
                                        expiresWhen:
                                            nowB +
                                            LIST_EMAIL_INVITE_VALIDITY_MS,
                                        roleID: SharedListRoleID.ReadWrite,
                                        disabled: false,
                                        singleUse: true,
                                    },
                                ])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([
                                    expectedInviteA,
                                    {
                                        id: expect.anything(),
                                        email: emailB,
                                        createdWhen: nowB,
                                        sharedList: sharedListIdA,
                                        sharedListKey: resultB.keyString,
                                    },
                                ])

                                expect(
                                    await contentSharing.options.backend.deleteListEmailInvite(
                                        {
                                            keyString: resultB.keyString,
                                        },
                                    ),
                                ).toEqual({ status: 'success' })

                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([expectedKeyA])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([expectedInviteA])

                                expect(
                                    await contentSharing.options.backend.deleteListEmailInvite(
                                        {
                                            keyString: resultA.keyString,
                                        },
                                    ),
                                ).toEqual({ status: 'success' })

                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            "should NOT be able to delete invites to a private space that you don't own",
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    authService,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                const resultA: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )

                                const expectedKeyA = {
                                    id: resultA.keyString,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowA,
                                    updatedWhen: nowA,
                                    expiresWhen:
                                        nowA + LIST_EMAIL_INVITE_VALIDITY_MS,
                                    roleID: SharedListRoleID.Commenter,
                                    disabled: false,
                                    singleUse: true,
                                }
                                const expectedInviteA = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey: resultA.keyString,
                                }

                                expect(resultA.status).toEqual('success')
                                expect(resultA.keyString).toBeDefined()
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([expectedKeyA])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([expectedInviteA])

                                // Attempt to delete invite as another user
                                const acceptingUserId = 'test-accepting-user-1'
                                await authService.setUser({
                                    id: acceptingUserId,
                                    email: emailA,
                                    emailVerified: true,
                                    displayName: acceptingUserId,
                                })

                                expect(
                                    await contentSharing.options.backend.deleteListEmailInvite(
                                        {
                                            keyString: resultA.keyString,
                                        },
                                    ),
                                ).toEqual({ status: 'permission-denied' })

                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([expectedKeyA])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([expectedInviteA])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to accept invites to a private space that are still valid',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    getSentPrivateListEmailInvite,
                                    contentSharing,
                                    authService,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const nowB = Date.now() + 1000
                                const nowC = Date.now() + 2000
                                const nowD = Date.now() + 3000
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'
                                const emailB = 'b@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                const createInviteResultA: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )
                                // Create multiple invites to verify all keys assoc. to the invites of the same email get deleted upon acception of one invite
                                const createInviteResultB: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowB,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.ReadWrite,
                                    },
                                )
                                const createInviteResultC: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowC,
                                        email: emailB,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.ReadWrite,
                                    },
                                )

                                const expectedInviteA = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey:
                                        createInviteResultA.keyString,
                                }
                                const expectedInviteB = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowB,
                                    sharedList: sharedListIdA,
                                    sharedListKey:
                                        createInviteResultB.keyString,
                                }
                                const expectedInviteC = {
                                    id: expect.anything(),
                                    email: emailB,
                                    createdWhen: nowC,
                                    sharedList: sharedListIdA,
                                    sharedListKey:
                                        createInviteResultC.keyString,
                                }
                                expect(
                                    await manager
                                        .collection('sharedListRole')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListRoleByUser')
                                        .findAllObjects({}),
                                ).toEqual([])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([
                                    expectedInviteA,
                                    expectedInviteB,
                                    expectedInviteC,
                                ])
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([
                                    expect.objectContaining({
                                        id: createInviteResultA.keyString,
                                        sharedList: sharedListIdA,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        roleID: SharedListRoleID.Commenter,
                                    }),
                                    expect.objectContaining({
                                        id: createInviteResultB.keyString,
                                        sharedList: sharedListIdA,
                                        createdWhen: nowB,
                                        updatedWhen: nowB,
                                        roleID: SharedListRoleID.ReadWrite,
                                    }),
                                    expect.objectContaining({
                                        id: createInviteResultC.keyString,
                                        sharedList: sharedListIdA,
                                        createdWhen: nowC,
                                        updatedWhen: nowC,
                                        roleID: SharedListRoleID.ReadWrite,
                                    }),
                                ])
                                expect(getSentPrivateListEmailInvite()).toBe(
                                    null,
                                )

                                // Accept invite as another user
                                const acceptingUserId = 'test-accepting-user-1'
                                await authService.setUser({
                                    id: acceptingUserId,
                                    email: emailA,
                                    emailVerified: true,
                                    displayName: acceptingUserId,
                                })
                                const acceptResult = await contentSharing.options.backend.acceptListEmailInvite(
                                    {
                                        keyString:
                                            createInviteResultA.keyString,
                                        now: nowD,
                                    },
                                )
                                expect(acceptResult.status).toBe('success')

                                const expectedUserRole = {
                                    user: acceptingUserId,
                                    roleID: SharedListRoleID.Commenter,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowD,
                                    updatedWhen: nowD,
                                }
                                expect(
                                    await manager
                                        .collection('sharedListRole')
                                        .findAllObjects({}),
                                ).toEqual([expectedUserRole])
                                expect(
                                    await manager
                                        .collection('sharedListRoleByUser')
                                        .findAllObjects({}),
                                ).toEqual([expectedUserRole])
                                expect(
                                    await manager
                                        .collection('sharedListEmailInvite')
                                        .findAllObjects({}),
                                ).toEqual([
                                    {
                                        ...expectedInviteA,
                                        user: acceptingUserId,
                                        acceptedWhen: nowD,
                                    },
                                    expectedInviteB,
                                    expectedInviteC,
                                ])
                                expect(
                                    await manager
                                        .collection('sharedListKey')
                                        .findAllObjects({}),
                                ).toEqual([
                                    // NOTE: all list keys from emailA should have been deleted on acceptance of a single invite, leaving keys to other emails
                                    expect.objectContaining({
                                        id: createInviteResultC.keyString,
                                        sharedList: sharedListIdA,
                                        createdWhen: nowC,
                                        updatedWhen: nowC,
                                        roleID: SharedListRoleID.ReadWrite,
                                    }),
                                ])
                                expect(getSentPrivateListEmailInvite()).toEqual(
                                    {
                                        email: emailA,
                                        spaceName: sharedListNameA,
                                        roleID: SharedListRoleID.Commenter,
                                        keyString: createInviteResultA.keyString.toString(),
                                        expiresWhen:
                                            nowA +
                                            LIST_EMAIL_INVITE_VALIDITY_MS,
                                    },
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should NOT be able to accept invites to a private space that have expired',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    authService,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                const createInviteResult: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )

                                // Set the key expiry to be in the past
                                await manager
                                    .collection('sharedListKey')
                                    .updateOneObject(
                                        { id: createInviteResult.keyString },
                                        { expiresWhen: nowA - 1000 },
                                    )

                                const expectedInvite = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey: createInviteResult.keyString,
                                }
                                const expectedKey = expect.objectContaining({
                                    id: createInviteResult.keyString,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowA,
                                    updatedWhen: nowA,
                                    expiresWhen: nowA - 1000,
                                    roleID: SharedListRoleID.Commenter,
                                })

                                const assertDataExists = async () => {
                                    expect(
                                        await manager
                                            .collection('sharedListRole')
                                            .findAllObjects({}),
                                    ).toEqual([])
                                    expect(
                                        await manager
                                            .collection('sharedListRoleByUser')
                                            .findAllObjects({}),
                                    ).toEqual([])
                                    expect(
                                        await manager
                                            .collection('sharedListEmailInvite')
                                            .findAllObjects({}),
                                    ).toEqual([expectedInvite])
                                    expect(
                                        await manager
                                            .collection('sharedListKey')
                                            .findAllObjects({}),
                                    ).toEqual([expectedKey])
                                }

                                // Accept invite as another user
                                const acceptingUserId = 'test-accepting-user-1'
                                await authService.setUser({
                                    id: acceptingUserId,
                                    email: emailA,
                                    emailVerified: true,
                                    displayName: acceptingUserId,
                                })
                                await assertDataExists()
                                const acceptResult = await contentSharing.options.backend.acceptListEmailInvite(
                                    {
                                        keyString: createInviteResult.keyString,
                                        now: nowA,
                                    },
                                )
                                expect(acceptResult.status).toBe(
                                    'permission-denied',
                                )
                                await assertDataExists() // No data should have changed
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should NOT be able to accept invites to your own private spaces',
            {
                skipConflictTests: true,
                skipSyncTests: true,
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    authService,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const nowA = Date.now()
                                const sharedListIdA = 'test-list-a'
                                const sharedListNameA = 'test list a'
                                const emailA = 'a@test.com'

                                const { manager } = setup.serverStorage

                                await manager
                                    .collection('sharedList')
                                    .createObject({
                                        id: sharedListIdA,
                                        title: sharedListNameA,
                                        creator: TEST_USER.id,
                                        createdWhen: nowA,
                                        updatedWhen: nowA,
                                        private: true,
                                    })

                                const createInviteResult: any = await contentSharing.options.backend.createListEmailInvite(
                                    {
                                        now: nowA,
                                        email: emailA,
                                        listId: sharedListIdA,
                                        roleID: SharedListRoleID.Commenter,
                                    },
                                )

                                const expectedInvite = {
                                    id: expect.anything(),
                                    email: emailA,
                                    createdWhen: nowA,
                                    sharedList: sharedListIdA,
                                    sharedListKey: createInviteResult.keyString,
                                }
                                const expectedKey = expect.objectContaining({
                                    id: createInviteResult.keyString,
                                    sharedList: sharedListIdA,
                                    createdWhen: nowA,
                                    updatedWhen: nowA,
                                    expiresWhen:
                                        nowA + LIST_EMAIL_INVITE_VALIDITY_MS,
                                    roleID: SharedListRoleID.Commenter,
                                })

                                const assertDataExists = async () => {
                                    expect(
                                        await manager
                                            .collection('sharedListRole')
                                            .findAllObjects({}),
                                    ).toEqual([])
                                    expect(
                                        await manager
                                            .collection('sharedListRoleByUser')
                                            .findAllObjects({}),
                                    ).toEqual([])
                                    expect(
                                        await manager
                                            .collection('sharedListEmailInvite')
                                            .findAllObjects({}),
                                    ).toEqual([expectedInvite])
                                    expect(
                                        await manager
                                            .collection('sharedListKey')
                                            .findAllObjects({}),
                                    ).toEqual([expectedKey])
                                }

                                // Accept invite as same user
                                await assertDataExists()
                                const acceptResult = await contentSharing.options.backend.acceptListEmailInvite(
                                    {
                                        keyString: createInviteResult.keyString,
                                        now: nowA,
                                    },
                                )
                                expect(acceptResult.status).toBe(
                                    'permission-denied',
                                )
                                await assertDataExists() // No data should have changed
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should created shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for a PDF - via extension',
            {
                skipConflictTests: true,
                skipSyncTests: true,
                customTestOpts: {
                    fetchPdfData: async () => ({
                        title: data.PDF_DATA_A.title,
                        fullText: data.PDF_DATA_A.fullText,
                        pdfPageTexts: [data.PDF_DATA_A.fullText],
                        pdfMetadata: {
                            fingerprints: data.PDF_DATA_A.fingerprints,
                            memexIncludedPages: 1,
                            memexTotalPages: 1,
                        },
                    }),
                },
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                const { manager } = setup.serverStorage
                                const now = Date.now()
                                const listTitle = createPageLinkListTitle()
                                const pdfTitle = data.PDF_DATA_A.title
                                // const domain = data.
                                const fullPageUrl = data.PDF_DATA_A.fullUrl
                                const normalizedPageUrl =
                                    data.PDF_DATA_A.normalizedUrl
                                const fingerprintA =
                                    data.PDF_DATA_A.fingerprints[0]
                                const fingerprintB =
                                    data.PDF_DATA_A.fingerprints[1]
                                const domain = data.PDF_DATA_A.domain
                                const fullText = data.PDF_DATA_A.fullText
                                const fullBaseLocatorUrl = buildBaseLocatorUrl(
                                    fingerprintA,
                                    ContentLocatorFormat.PDF,
                                )
                                const normalizedBaseLocatorUrl = normalizeUrl(
                                    fullBaseLocatorUrl,
                                )
                                const userId = TEST_USER.id

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const tabInfo = { tab: { id: 123 } }
                                const {
                                    collabKey,
                                    localListId,
                                    remoteListId,
                                    remoteListEntryId,
                                    listTitle: createdListTitle,
                                } = await contentSharing.schedulePageLinkCreation(
                                    tabInfo,
                                    {
                                        fullPageUrl,
                                        now,
                                        customPageTitle: null,
                                    },
                                )
                                await contentSharing.waitForPageLinkCreation({
                                    fullPageUrl,
                                })

                                const localLocators: any[] = await setup.storageManager
                                    .collection('locators')
                                    .findAllObjects({})
                                // Local DB data should be created first
                                // prettier-ignore
                                {
                                    expect(localListId).toEqual(now)
                                    expect(createdListTitle).toEqual(listTitle)
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: localListId,
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            searchableName: listTitle,
                                            nameTerms: expect.any(Array),
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: localListId,
                                            pageUrl: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: localListId,
                                            remoteId: remoteListId,
                                            private: false
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: remoteListId,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: undefined
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: remoteListId,
                                            entryTitle: pdfTitle,
                                            creator: userId,
                                            normalizedPageUrl: normalizedBaseLocatorUrl,
                                            hasAnnotationsFromOthers: false,
                                            sharedListEntry: remoteListEntryId,
                                            createdWhen: now,
                                            updatedWhen: now,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            fullTitle: pdfTitle,
                                            domain,
                                            hostname: domain,
                                            text: fullText,
                                            terms: expect.any(Array),
                                            urlTerms: expect.any(Array),
                                            titleTerms: expect.any(Array),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            time: now
                                        }
                                    ])
                                    expect(localLocators).toEqual([
                                        {
                                            id: expect.any(Number),
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.NormalizedUrlV1,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullPageUrl,
                                            location: normalizedPageUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintA,
                                            lastVisited: expect.any(Number),
                                        },
                                        {
                                            id: expect.any(Number),
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            locationScheme: LocationSchemeType.NormalizedUrlV1,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullPageUrl,
                                            location: normalizedPageUrl,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintB,
                                            lastVisited: expect.any(Number),
                                        },
                                    ])
                                }

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListId),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        description: null,
                                        private: false,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListEntryId),
                                        creator: userId,
                                        entryTitle: pdfTitle,
                                        originalUrl: fullBaseLocatorUrl,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        fullTitle: pdfTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        location: null,
                                        originalUrl: fullPageUrl,
                                        sharedList: maybeInt(remoteListId),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        location: null,
                                        originalUrl: fullPageUrl,
                                        sharedList: maybeInt(remoteListId),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                    },
                                ])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(collabKey),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: expect.anything(), // TODO: Can we expect an actual value?
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullBaseLocatorUrl,
                                        title: pdfTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        pageEnd: null,
                                        pageMax: null,
                                        pageTotal: null,
                                        readDuration: null,
                                        scrollEndPixel: null,
                                        scrollMaxPixel: null,
                                        scrollEndPercentage: null,
                                        scrollMaxPercentage: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    // Dummy/base locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.MemexCloud,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: null,
                                        fingerprint: null,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Locator for PDF's fingerprints
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        status: null,
                                        version: 0,
                                        user: userId,
                                        localId: localLocators[0].id,
                                        fingerprint: fingerprintA,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        status: null,
                                        version: 0,
                                        user: userId,
                                        localId: localLocators[1].id,
                                        fingerprint: fingerprintB,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: remoteListId,
                                        user: userId,
                                        private: false,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: remoteListId,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should created shared list, entry, page info, key, role + all corresponding personal cloud data when a user creates a shareable page link for an uploaded PDF - via extension',
            {
                skipConflictTests: true,
                skipSyncTests: true,
                customTestOpts: {
                    fetchPdfData: async () => ({
                        title: data.PDF_DATA_B.title,
                        fullText: data.PDF_DATA_B.fullText,
                        pdfPageTexts: [data.PDF_DATA_B.fullText],
                        pdfMetadata: {
                            fingerprints: data.PDF_DATA_B.fingerprints,
                            memexIncludedPages: 1,
                            memexTotalPages: 1,
                        },
                    }),
                },
            },
            () => {
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                // Set up PDF BG to fake PDF upload
                                setup.backgroundModules.pdfBg[
                                    'deps'
                                ].generateUploadId = () => uploadId
                                await setup.backgroundModules.pdfBg[
                                    'deps'
                                ].syncSettings.pdfIntegration.set(
                                    'shouldAutoUpload',
                                    true,
                                )

                                const { manager } = setup.serverStorage
                                const now = Date.now()
                                const listTitle = createPageLinkListTitle()
                                const pdfTitle = data.PDF_DATA_B.title
                                const fullPageUrl = data.PDF_DATA_B.fullUrl
                                const normalizedPageUrl =
                                    data.PDF_DATA_B.normalizedUrl
                                const fingerprintA =
                                    data.PDF_DATA_B.fingerprints[0]
                                const fingerprintB =
                                    data.PDF_DATA_B.fingerprints[1]
                                const domain = data.PDF_DATA_B.domain
                                const fullText = data.PDF_DATA_B.fullText
                                const uploadId = 'test-upload-id'
                                const fullBaseLocatorUrl = buildBaseLocatorUrl(
                                    fingerprintA,
                                    ContentLocatorFormat.PDF,
                                )
                                const normalizedBaseLocatorUrl = normalizeUrl(
                                    fullBaseLocatorUrl,
                                )
                                const userId = TEST_USER.id

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([])
                                }

                                // Personal cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('personalList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentMetadata').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([])
                                expect(await manager.collection('personalContentLocator').findAllObjects({})).toEqual([])
                                }

                                // Local DB data
                                // prettier-ignore
                                {
                                expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([])
                                expect(await setup.storageManager.collection('locators').findAllObjects({})).toEqual([])
                                }

                                const tabInfo = { tab: { id: 123 } }
                                const {
                                    collabKey,
                                    localListId,
                                    remoteListId,
                                    remoteListEntryId,
                                    listTitle: createdListTitle,
                                } = await contentSharing.schedulePageLinkCreation(
                                    tabInfo,
                                    {
                                        fullPageUrl: fullBaseLocatorUrl,
                                        now,
                                        customPageTitle: null,
                                    },
                                )
                                await contentSharing.waitForPageLinkCreation({
                                    fullPageUrl,
                                })

                                const localLocators: any[] = await setup.storageManager
                                    .collection('locators')
                                    .findAllObjects({})
                                // Local DB data should be created first
                                // prettier-ignore
                                {
                                    expect(localListId).toEqual(now)
                                    expect(createdListTitle).toEqual(listTitle)
                                    expect(await setup.storageManager.collection('customLists').findAllObjects({})).toEqual([
                                        {
                                            id: localListId,
                                            name: listTitle,
                                            type: 'page-link',
                                            isDeletable: true,
                                            isNestable: true,
                                            searchableName: listTitle,
                                            nameTerms: expect.any(Array),
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pageListEntries').findAllObjects({})).toEqual([
                                        {
                                            listId: localListId,
                                            pageUrl: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            createdAt: new Date(now)
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('sharedListMetadata').findAllObjects({})).toEqual([
                                        {
                                            localId: localListId,
                                            remoteId: remoteListId,
                                            private: false
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedList').findAllObjects({})).toEqual([
                                        {
                                            sharedList: remoteListId,
                                            creator: userId,
                                            name: listTitle,
                                            type: 'page-link',
                                            lastSync: undefined
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('followedListEntry').findAllObjects({})).toEqual([
                                        {
                                            id: expect.anything(),
                                            followedList: remoteListId,
                                            entryTitle: pdfTitle,
                                            creator: userId,
                                            normalizedPageUrl: normalizedBaseLocatorUrl,
                                            hasAnnotationsFromOthers: false,
                                            sharedListEntry: remoteListEntryId,
                                            createdWhen: now,
                                            updatedWhen: now,
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('pages').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            fullUrl: fullBaseLocatorUrl,
                                            fullTitle: pdfTitle,
                                            domain,
                                            hostname: domain,
                                            text: fullText,
                                            terms: expect.any(Array),
                                            urlTerms: expect.any(Array),
                                            titleTerms: expect.any(Array),
                                        }
                                    ])
                                    expect(await setup.storageManager.collection('visits').findAllObjects({})).toEqual([
                                        {
                                            url: normalizedBaseLocatorUrl,
                                            time: now
                                        }
                                    ])
                                    expect(localLocators).toEqual([
                                        {
                                            id: expect.any(Number),
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            // originalLocation: fullPageUrl,
                                            // location: normalizedPageUrl,
                                            // locationScheme: LocationSchemeType.FilesystemPathV1,
                                            // locationType: ContentLocatorType.Local,
                                            originalLocation: expect.any(String),
                                            location: expect.any(String),
                                            locationScheme: expect.any(String),
                                            locationType: expect.any(String),
                                            format: ContentLocatorFormat.PDF,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintA,
                                            lastVisited: expect.any(Number),
                                        },
                                        {
                                            id: expect.any(Number),
                                            fingerprintScheme: FingerprintSchemeType.PdfV1,
                                            // originalLocation: fullPageUrl,
                                            // location: normalizedPageUrl,
                                            // locationScheme: LocationSchemeType.FilesystemPathV1,
                                            // locationType: ContentLocatorType.Local,
                                            originalLocation: expect.any(String),
                                            location: expect.any(String),
                                            locationScheme: expect.any(String),
                                            locationType: expect.any(String),
                                            format: ContentLocatorFormat.PDF,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            fingerprint: fingerprintB,
                                            lastVisited: expect.any(Number),
                                        },
                                        {
                                            id: expect.any(Number),
                                            locationScheme: LocationSchemeType.UploadStorage,
                                            locationType: ContentLocatorType.Remote,
                                            format: ContentLocatorFormat.PDF,
                                            originalLocation: fullBaseLocatorUrl,
                                            location: uploadId,
                                            normalizedUrl: normalizedBaseLocatorUrl,
                                            primary: true,
                                            valid: true,
                                            version: 0,
                                            status: 'uploaded',
                                            lastVisited: expect.any(Number),
                                        },
                                    ])
                                }

                                // Shared cloud DB data
                                // prettier-ignore
                                {
                                expect(await manager.collection('sharedList').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListId),
                                        type: 'page-link',
                                        creator: userId,
                                        title: listTitle,
                                        description: null,
                                        private: false,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(remoteListEntryId),
                                        creator: userId,
                                        entryTitle: pdfTitle,
                                        originalUrl: fullBaseLocatorUrl,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedPageInfo').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        fullTitle: pdfTitle
                                    }
                                ])
                                expect(await manager.collection('sharedContentLocator').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: null,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        location: uploadId,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: userId,
                                        sharedList: maybeInt(remoteListId),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        originalUrl: fullBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        location: uploadId,
                                    },
                                ])
                                expect(await manager.collection('sharedContentFingerprint').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: null,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        fingerprint: fingerprintA,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: null,
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        fingerprint: fingerprintB,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: maybeInt(remoteListId),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        fingerprint: fingerprintA,
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: maybeInt(remoteListId),
                                        normalizedUrl: normalizedBaseLocatorUrl,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        fingerprint: fingerprintB,
                                    },
                                ])
                                expect(await manager.collection('sharedListKey').findAllObjects({})).toEqual([
                                    {
                                        id: maybeInt(collabKey),
                                        disabled: false,
                                        roleID: SharedListRoleID.ReadWrite,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRole').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('sharedListRoleByUser').findAllObjects({})).toEqual([
                                    {
                                        user: userId,
                                        roleID: SharedListRoleID.Owner,
                                        sharedList: maybeInt(remoteListId),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }

                                // Personal cloud DB data
                                const personalMetadataA: Array<
                                    PersonalContentMetadata & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentMetadata')
                                    .findAllObjects({})
                                const personalListsA: Array<
                                    PersonalList & { id: AutoPk }
                                > = await manager
                                    .collection('personalList')
                                    .findAllObjects({})
                                const personalLocatorsA: Array<
                                    PersonalContentLocator & { id: AutoPk }
                                > = await manager
                                    .collection('personalContentLocator')
                                    .findAllObjects({})

                                // prettier-ignore
                                {
                                expect(personalListsA).toEqual([
                                    {
                                        id: expect.anything(),
                                        localId: expect.anything(), // TODO: Can we expect an actual value?
                                        name: listTitle,
                                        type: 'page-link',
                                        isDeletable: true,
                                        isNestable: true,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalMetadataA).toEqual([
                                    {
                                        id: expect.anything(),
                                        canonicalUrl: fullBaseLocatorUrl,
                                        title: pdfTitle,
                                        lang: null,
                                        description: null,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalContentRead').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        personalContentLocator: personalLocatorsA[0].id,
                                        readWhen: expect.any(Number),
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        pageEnd: null,
                                        pageMax: null,
                                        pageTotal: null,
                                        readDuration: null,
                                        scrollEndPixel: null,
                                        scrollMaxPixel: null,
                                        scrollEndPercentage: null,
                                        scrollMaxPercentage: null,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(personalLocatorsA).toEqual([
                                    // Dummy/base locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: normalizedBaseLocatorUrl,
                                        locationScheme: LocationSchemeType.NormalizedUrlV1,
                                        locationType: ContentLocatorType.MemexCloud,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: null,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Locators for PDF's fingerprints
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.FilesystemPathV1,
                                        locationType: ContentLocatorType.Local,
                                        status: null,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocators[0].id,
                                        fingerprint: fingerprintA,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullPageUrl,
                                        location: normalizedPageUrl,
                                        locationScheme: LocationSchemeType.FilesystemPathV1,
                                        locationType: ContentLocatorType.Local,
                                        status: null,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        localId: localLocators[1].id,
                                        fingerprint: fingerprintB,
                                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                    // Uploaded PDFs have the upload locator
                                    {
                                        id: expect.anything(),
                                        personalContentMetadata: personalMetadataA[0].id,
                                        format: ContentLocatorFormat.PDF,
                                        originalLocation: fullBaseLocatorUrl,
                                        location: uploadId,
                                        locationScheme: LocationSchemeType.UploadStorage,
                                        locationType: ContentLocatorType.Remote,
                                        primary: true,
                                        valid: true,
                                        version: 0,
                                        user: userId,
                                        status: 'uploaded',
                                        localId: localLocators[2].id,
                                        fingerprint: null,
                                        fingerprintScheme: null,
                                        contentSize: null,
                                        createdByDevice: data.DEVICE_ID_A,
                                        lastVisited: expect.anything(),
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    },
                                ])
                                expect(await manager.collection('personalListEntry').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        personalContentMetadata: personalMetadataA[0].id,
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalListShare').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        personalList: personalListsA[0].id,
                                        remoteId: remoteListId,
                                        user: userId,
                                        private: false,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                expect(await manager.collection('personalFollowedList').findAllObjects({})).toEqual([
                                    {
                                        id: expect.anything(),
                                        sharedList: remoteListId,
                                        type: 'page-link',
                                        user: userId,
                                        createdByDevice: data.DEVICE_ID_A,
                                        createdWhen: expect.anything(),
                                        updatedWhen: expect.anything(),
                                    }
                                ])
                                }
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add an annotation and store its metadata when the user creates a new annotation to their own page via the web UI',
            { skipConflictTests: true, skipSyncTests: true },
            () => makeAnnotationFromWebUiTest({ ownPage: true }),
        ),
        backgroundIntegrationTest(
            `should add an annotation and store its metadata when the user creates a new annotation to another user's page via the web UI`,
            { skipConflictTests: true, skipSyncTests: true },
            () => makeAnnotationFromWebUiTest({ ownPage: false }),
        ),
        backgroundIntegrationTest(
            'should add a list, page + 2 public annotations, adding one to the list, with user choosing to keep it public, expecting other annot and the parent page to also be in list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 3,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        createdPageListEntries: [
                                            { listId: 1, pageId: 1 },
                                        ],
                                        protectAnnotations: false, // This is the important part
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add a list, page + 2 public annotations, adding one to the list, with user choosing to make it protected, expecting other annot and the parent page to also be in list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 3,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1],
                                        annotationsIds: [1],
                                        createdPageListEntries: [
                                            { listId: 1, pageId: 1 },
                                        ],
                                        protectAnnotations: true, // This is the important part
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add public annot to a private list, expecting sibling annots+parent page _not_ to be added to that list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: false,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        createdPageListEntries: [],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [],
                                                privateListIds: [1],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add public annot to a private list which parent page is already in, expecting annot list entry to still be added',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: false,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        createdPageListEntries: [],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [],
                                                privateListIds: [1],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add public annot to a public list, expecting list entry to be created for parent page, but not for any public annotations',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        createdPageListEntries: [
                                            { listId: 1, pageId: 1 },
                                        ],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should add private annot to a public list, expecting local list entries to be created for annotation + parent page, but not any sibling public annotations',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1],
                                        listIds: [1],
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 1 },
                                        ],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                // PRIVATE should change to PROTECTED upon list share
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            "should remove private annot from a public list it's in, expecting local list entry to be deleted for annotation",
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 3,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [2, 3],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        annotationsIds: [1, 2],
                                        listIds: [1],
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 1 },
                                        ],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                // PRIVATE should change to PROTECTED upon list share
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                            2: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2, 3],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 3, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    annotationsIds: [2],
                                    listId: 1,
                                    expectedSharingStates: {
                                        2: {
                                            hasLink: true,
                                            sharedListIds: [],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2, 3],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 3, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    annotationsIds: [1],
                                    listId: 1,
                                    expectedSharingStates: {
                                        1: {
                                            hasLink: true,
                                            sharedListIds: [],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 3,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2, 3],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 3, listId: 1 }],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            "should remove public annot from private lists it's in",
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: false,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: false,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1, 2],
                                        annotationsIds: [1],
                                        createdPageListEntries: [],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [],
                                                privateListIds: [1, 2],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    listId: 2,
                                    annotationsIds: [1],
                                    expectedSharingStates: {
                                        1: {
                                            hasLink: true,
                                            sharedListIds: [],
                                            privateListIds: [1],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    listId: 1,
                                    annotationsIds: [1],
                                    expectedSharingStates: {
                                        1: {
                                            hasLink: true,
                                            sharedListIds: [],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    },
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should remove a shared list from a page, resulting in it also being removed from any child annotations, regardless of share state',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 2,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1],
                                        annotationsIds: [1],
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 1 },
                                        ],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )

                                await helper.removePageFromList(setup, {
                                    pageId: 1,
                                    listId: 1,
                                })

                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 2, listId: 2 }],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        // Annotation state transition tests:
        // TODO: Fix this test BG
        backgroundIntegrationTest(
            'should be able to transition an annotation from private to selectively shared state, via being added to a shared list',
            { skipConflictTests: true },
            () => {
                return
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })

                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 2,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 2, listId: 2 }],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1],
                                        annotationsIds: [1],
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 1 },
                                        ],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        // TODO: Fix this test BG
        backgroundIntegrationTest(
            'should be able to transition an annotation from private to selectively shared state, via being part of a private list that becomes shared',
            { skipConflictTests: true },
            () => {
                return
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: false,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                })
                                await helper.createPage(setup, {
                                    id: 2,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: false,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 2,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [2],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1],
                                        annotationsIds: [1, 2],
                                        createdPageListEntries: [],
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: false,
                                                sharedListIds: [],
                                                privateListIds: [1],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PRIVATE,
                                            },
                                            2: {
                                                hasLink: true,
                                                sharedListIds: [],
                                                privateListIds: [1],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.SHARED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [2],
                                })
                                await helper.assertSharedListEntries(setup, [])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertPageListEntries(setup, [])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [2],
                                })

                                await helper.shareList(setup, { id: 1 })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 2, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 2, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [2, 1],
                                })
                            },
                        },
                    ],
                }
            },
        ),

        // TODO: Fix this test BG
        backgroundIntegrationTest(
            "should be able to transition an annotation from public to selectively shared state, via being added to a shared list AND user choosing to 'protect' it",
            { skipConflictTests: true },
            () => {
                return
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 2,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 2, listId: 2 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.shareAnnotationsToSomeLists(
                                    setup,
                                    {
                                        listIds: [1],
                                        annotationsIds: [1],
                                        createdPageListEntries: [
                                            { pageId: 1, listId: 1 },
                                        ],
                                        protectAnnotations: true,
                                        expectedSharingStates: {
                                            1: {
                                                hasLink: true,
                                                sharedListIds: [2, 1],
                                                privateListIds: [],
                                                privacyLevel:
                                                    AnnotationPrivacyLevels.PROTECTED,
                                            },
                                        },
                                    },
                                )

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 2 },
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to transition an annotation from public to selectively shared state, via being removed from a shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 2, listId: 2 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    listId: 2,
                                    annotationsIds: [1],
                                    expectedSharingStates: {
                                        1: {
                                            hasLink: true,
                                            sharedListIds: [1],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to transition an annotation from public to selectively shared state, via being set private AND user choosing to keep lists',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                // This transitions the annotation's state to "selectively shared"
                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    keepListsIfUnsharing: true,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PROTECTED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to transition an annotation from selectively shared to private state, via being set private',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listId: 1,
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { listId: 1, pageId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                // This transitions the annotation's state to "selectively shared"
                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    keepListsIfUnsharing: true,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PROTECTED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.PRIVATE,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PRIVATE,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 2, listId: 1 }],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should be able to transition an annotation from selectively shared to public state, via being set public',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                await helper.createList(setup, {
                                    id: 1,
                                    share: true,
                                })
                                await helper.createList(setup, {
                                    id: 2,
                                    share: true,
                                })
                                await helper.createPage(setup, {
                                    id: 1,
                                    listIds: [1, 2],
                                })
                                await helper.createAnnotation(setup, {
                                    id: 1,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })
                                await helper.createAnnotation(setup, {
                                    id: 2,
                                    pageId: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.unshareAnnotationsFromList(setup, {
                                    listId: 2,
                                    annotationsIds: [1],
                                    expectedSharingStates: {
                                        1: {
                                            hasLink: true,
                                            sharedListIds: [1],
                                            privateListIds: [],
                                            privacyLevel:
                                                AnnotationPrivacyLevels.PROTECTED,
                                        },
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: true,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.PROTECTED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 2, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 1, listId: 1 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [{ annotationId: 1, listId: 1 }],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })

                                await helper.setAnnotationPrivacyLevel(setup, {
                                    id: 1,
                                    level: AnnotationPrivacyLevels.SHARED,
                                    expectedSharingState: {
                                        hasLink: true,
                                        sharedListIds: [1, 2],
                                        privateListIds: [],
                                        privacyLevel:
                                            AnnotationPrivacyLevels.SHARED,
                                    },
                                })

                                await helper.assertSharedAnnotationMetadata(
                                    setup,
                                    {
                                        metadata: [
                                            {
                                                annotationId: 1,
                                                excludeFromLists: false,
                                            },
                                            {
                                                annotationId: 2,
                                                excludeFromLists: false,
                                            },
                                        ],
                                    },
                                )
                                await helper.assertAnnotationPrivacyLevels(
                                    setup,
                                    [
                                        {
                                            annotationId: 1,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                            updated: true,
                                        },
                                        {
                                            annotationId: 2,
                                            level:
                                                AnnotationPrivacyLevels.SHARED,
                                        },
                                    ],
                                )
                                await helper.assertSharedAnnotations(setup, {
                                    ids: [1, 2],
                                })
                                await helper.assertSharedListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertSharedAnnotationListEntries(
                                    setup,
                                    [
                                        { annotationId: 1, listId: 1 },
                                        { annotationId: 1, listId: 2 },
                                        { annotationId: 2, listId: 1 },
                                        { annotationId: 2, listId: 2 },
                                    ],
                                )
                                await helper.assertPageListEntries(setup, [
                                    { pageId: 1, listId: 1 },
                                    { pageId: 1, listId: 2 },
                                ])
                                await helper.assertAnnotationListEntries(
                                    setup,
                                    [],
                                )
                                await helper.assertSharedPageInfo(setup, {
                                    pageIds: [1],
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should cache remote page IDs upon fetch from server, and use that cache on subsequent lookups',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setupTest({ setup })

                                const serverStorage = setup.serverStorage

                                const normalizedPageUrl = normalizeUrl(
                                    data.PAGE_1_DATA.pageDoc.url,
                                )
                                const creatorReference: UserReference = {
                                    type: 'user-reference',
                                    id: TEST_USER.id,
                                }

                                // Ensure page exists locally
                                await setup.storageManager
                                    .collection('pages')
                                    .createObject({
                                        url: normalizedPageUrl,
                                        fullUrl: data.PAGE_1_DATA.pageDoc.url,
                                        fullTitle:
                                            data.PAGE_1_DATA.pageDoc.content
                                                .title,
                                        text: '',
                                    })

                                expect(
                                    await setup.backgroundModules.contentSharing.options.contentSharingSettingsStore.get(
                                        'remotePageIdLookup',
                                    ),
                                ).toEqual(null)
                                expect(
                                    await serverStorage.modules.contentSharing.getPageInfoByCreatorAndUrl(
                                        {
                                            creatorReference,
                                            normalizedUrl: normalizedPageUrl,
                                        },
                                    ),
                                ).toEqual(null)

                                const remotePageId = await setup.backgroundModules.contentSharing.ensureRemotePageId(
                                    normalizedPageUrl,
                                )

                                expect(
                                    await setup.backgroundModules.contentSharing.options.contentSharingSettingsStore.get(
                                        'remotePageIdLookup',
                                    ),
                                ).toEqual({
                                    [normalizedPageUrl]: {
                                        remoteId: remotePageId,
                                        asOf: expect.any(Number),
                                    },
                                })
                                expect(
                                    await serverStorage.modules.contentSharing.getPageInfoByCreatorAndUrl(
                                        {
                                            creatorReference,
                                            normalizedUrl: normalizedPageUrl,
                                        },
                                    ),
                                ).toEqual(
                                    expect.objectContaining({
                                        pageInfo: expect.objectContaining({
                                            normalizedUrl: normalizedPageUrl,
                                        }),
                                        creatorReference: {
                                            id: creatorReference.id,
                                            type: creatorReference.type,
                                        },
                                        reference: {
                                            type: 'shared-page-info-reference',
                                            id: Number(remotePageId),
                                        },
                                    }),
                                )

                                // Removing data from server storage to demonstrate the cache is still used in favor of server storage
                                await serverStorage.modules.contentSharing.deletePageInfo(
                                    {
                                        id: remotePageId,
                                        type: 'shared-page-info-reference',
                                    },
                                )

                                expect(
                                    await setup.backgroundModules.contentSharing.ensureRemotePageId(
                                        normalizedPageUrl,
                                    ),
                                ).toEqual(remotePageId)
                                expect(
                                    await setup.backgroundModules.contentSharing.options.contentSharingSettingsStore.get(
                                        'remotePageIdLookup',
                                    ),
                                ).toEqual({
                                    [normalizedPageUrl]: {
                                        remoteId: remotePageId,
                                        asOf: expect.any(Number),
                                    },
                                })
                                expect(
                                    await serverStorage.modules.contentSharing.getPageInfoByCreatorAndUrl(
                                        {
                                            creatorReference,
                                            normalizedUrl: normalizedPageUrl,
                                        },
                                    ),
                                ).toEqual(null)
                            },
                        },
                    ],
                }
            },
        ),
    ],
    // { includePostSyncProcessor: true },
)

function makeShareAnnotationTest(options: {
    annotationSharingMethod: 'shareAnnotation' | 'shareAnnotations'
    testDuplicateSharing: boolean
    testProtectedBulkShare?: boolean
}): BackgroundIntegrationTestInstance {
    const helper = new SharingTestHelper()

    return {
        steps: [
            {
                execute: async ({ setup }) => {
                    const { personalCloud } = setup.backgroundModules
                    setup.authService.setUser(TEST_USER)
                    personalCloud.actionQueue.forceQueueSkip = true
                    await personalCloud.setup()

                    await helper.createList(setup, { id: 1 })
                    await helper.createPage(setup, { id: 1, listId: 1 })
                    await helper.createPage(setup, { id: 2, listId: 1 })
                    await helper.shareList(setup, { id: 1 })
                    await helper.createAnnotation(setup, { id: 1, pageId: 1 })
                    await helper.createAnnotation(setup, { id: 2, pageId: 1 })

                    if (options.testProtectedBulkShare) {
                        await helper.setAnnotationPrivacyLevel(setup, {
                            id: 2,
                            level: AnnotationPrivacyLevels.PROTECTED,
                            expectedSharingState: {
                                hasLink: false,
                                sharedListIds: [],
                                privateListIds: [],
                                privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                            },
                        })
                    }

                    if (options.annotationSharingMethod === 'shareAnnotation') {
                        await helper.shareAnnotation(setup, {
                            id: 1,
                            expectedSharingState: {
                                sharedListIds: [],
                                privateListIds: [],
                                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                                hasLink: true,
                            },
                        })
                        await helper.shareAnnotation(setup, {
                            id: 2,
                            expectedSharingState: {
                                sharedListIds: [],
                                privateListIds: [],
                                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                                hasLink: true,
                            },
                        })

                        if (options.testDuplicateSharing) {
                            await helper.shareAnnotation(setup, {
                                id: 2,
                                expectedSharingState: {
                                    sharedListIds: [],
                                    privateListIds: [],
                                    privacyLevel:
                                        AnnotationPrivacyLevels.PRIVATE,
                                    hasLink: true,
                                },
                            })
                        }
                    } else if (
                        options.annotationSharingMethod === 'shareAnnotations'
                    ) {
                        const expectedSharingStates = {
                            1: {
                                sharedListIds: [],
                                privateListIds: [],
                                privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                                hasLink: true,
                            },
                            2: !options.testProtectedBulkShare
                                ? {
                                      sharedListIds: [],
                                      privateListIds: [],
                                      privacyLevel:
                                          AnnotationPrivacyLevels.PRIVATE,
                                      hasLink: true,
                                  }
                                : {
                                      sharedListIds: [],
                                      privateListIds: [],
                                      privacyLevel:
                                          AnnotationPrivacyLevels.PROTECTED,
                                      hasLink: false,
                                  },
                        }
                        await helper.shareAnnotations(
                            setup,
                            [
                                { id: 1 },
                                {
                                    id: 2,
                                    expectNotShared:
                                        options.testProtectedBulkShare,
                                },
                            ],
                            {
                                expectedSharingStates,
                            },
                        )
                        if (options.testDuplicateSharing) {
                            await helper.shareAnnotations(
                                setup,
                                [
                                    { id: 1 },
                                    {
                                        id: 2,
                                        expectNotShared:
                                            options.testProtectedBulkShare,
                                    },
                                ],
                                { expectedSharingStates },
                            )
                        }
                    }
                    await helper.assertSharedAnnotationMetadata(setup, {
                        metadata: [
                            { annotationId: 1, excludeFromLists: true },
                            ...(!options.testProtectedBulkShare
                                ? [{ annotationId: 2, excludeFromLists: true }]
                                : []),
                        ],
                    })
                    await helper.assertAnnotationPrivacyLevels(
                        setup,
                        options.testProtectedBulkShare
                            ? [
                                  {
                                      annotationId: 2,
                                      level: AnnotationPrivacyLevels.PROTECTED,
                                  },
                                  {
                                      annotationId: 1,
                                      level: AnnotationPrivacyLevels.PRIVATE,
                                  },
                              ]
                            : [
                                  {
                                      annotationId: 1,
                                      level: AnnotationPrivacyLevels.PRIVATE,
                                  },
                                  {
                                      annotationId: 2,
                                      level: AnnotationPrivacyLevels.PRIVATE,
                                  },
                              ],
                    )
                    await helper.assertSharedAnnotations(setup, {
                        ids: [
                            1,
                            ...(!options.testProtectedBulkShare ? [2] : []),
                        ],
                    })

                    await helper.assertSharedAnnotationListEntries(setup, [])

                    const expectedSharingStatesPostAllLists = () => ({
                        1: {
                            sharedListIds: [1],
                            privateListIds: [],
                            privacyLevel: AnnotationPrivacyLevels.SHARED,
                            hasLink: true,
                        },
                    })
                    await helper.shareAnnotationsToAllLists(setup, {
                        ids: [1],
                        expectedSharingStates: expectedSharingStatesPostAllLists(),
                    })
                    if (options.testDuplicateSharing) {
                        await helper.shareAnnotationsToAllLists(setup, {
                            ids: [1],
                            expectedSharingStates: expectedSharingStatesPostAllLists(),
                        })
                    }

                    await helper.assertSharedAnnotationListEntries(setup, [
                        { annotationId: 1, listId: 1 },
                    ])
                    await helper.assertSharedPageInfo(setup, { pageIds: [1] })
                    await helper.assertSharedAnnotationMetadata(setup, {
                        metadata: [
                            { annotationId: 1, excludeFromLists: false },
                            ...(!options.testProtectedBulkShare
                                ? [{ annotationId: 2, excludeFromLists: true }]
                                : []),
                        ],
                    })
                },
            },
        ],
    }
}

function makeAnnotationFromWebUiTest(options: {
    ownPage: boolean
}): BackgroundIntegrationTestInstance {
    const helper = new SharingTestHelper()
    const testData: TestData = {}
    let storageHooksChangeWatcher: StorageHooksChangeWatcher

    return {
        getSetupOptions: async (): Promise<
            BackgroundIntegrationTestSetupOpts
        > => {
            storageHooksChangeWatcher = new StorageHooksChangeWatcher()
            const serverStorage = await createMemoryServerStorage({
                setupMiddleware: (storageManager) => [
                    new ChangeWatchMiddleware({
                        storageManager,
                        ...storageHooksChangeWatcher,
                    }),
                ],
            })
            return { serverStorage }
        },
        setup: async (context) => {
            const fakeFetch = new FakeFetch()
            const getNow = () => Date.now()

            storageHooksChangeWatcher.setUp({
                getNow,
                normalizeUrl,
                fetch: fakeFetch.fetch as any,
                captureException: async (err) => undefined, // TODO: implement
                getFunctionsConfig: () => ({}), // TODO: implement
                getCurrentUserReference: async () => ({
                    type: 'user-reference',
                    id: (await context.setup.authService.getCurrentUser()).id,
                }),
                serverStorageManager: context.setup.serverStorage.manager,
                services: context.setup.services,
            })
            await setupPreTest(context)
        },
        steps: [
            {
                execute: async ({ setup }) => {
                    const { personalCloud, shareTestList } = await setupTest({
                        setup,
                        testData,
                        createTestList: true,
                    })
                    await shareTestList()
                    await personalCloud.waitForSync()

                    const serverStorage = setup.serverStorage
                    if (!options.ownPage) {
                        await serverStorage.modules.contentSharing.ensurePageInfo(
                            {
                                creatorReference: {
                                    type: 'user-reference',
                                    id: TEST_USER.id,
                                },
                                pageInfo: {
                                    normalizedUrl: normalizeUrl(
                                        data.ANNOTATION_1_1_DATA.pageUrl,
                                    ),
                                    originalUrl: data.PAGE_1_DATA.pageDoc.url,
                                    fullTitle: 'Full title',
                                },
                            },
                        )

                        const userTwo = {
                            id: 'test-two',
                            displayName: 'User two',
                            email: 'two@test.com',
                            emailVerified: true,
                        }
                        setup.authService.setUser(userTwo)
                        await serverStorage.manager.operation(
                            'createObject',
                            'user',
                            userTwo,
                        )
                    }

                    const createdWhen = Date.now()
                    const dummyLocalId = 'aaa'
                    const {
                        sharedAnnotationReferences,
                    } = await serverStorage.modules.contentSharing.createAnnotations(
                        {
                            annotationsByPage: {
                                [normalizeUrl(
                                    data.ANNOTATION_1_1_DATA.pageUrl,
                                )]: [
                                    {
                                        localId: dummyLocalId,
                                        createdWhen,
                                        comment:
                                            data.ANNOTATION_1_1_DATA.comment,
                                    },
                                ],
                            },
                            creator: {
                                type: 'user-reference',
                                id: 'someone-else',
                            },
                            listReferences: [],
                        },
                    )

                    await personalCloud.waitForSync() // wait for receival
                    await personalCloud.integrateAllUpdates()

                    const annotations = await setup.storageManager.operation(
                        'findObjects',
                        'annotations',
                        {},
                    )
                    expect(annotations).toEqual([
                        expect.objectContaining({
                            comment: data.ANNOTATION_1_1_DATA.comment,
                        }),
                    ])
                    expect(
                        await setup.storageManager.operation(
                            'findObjects',
                            'sharedAnnotationMetadata',
                            {},
                        ),
                    ).toEqual([
                        {
                            localId: annotations[0].url,
                            remoteId:
                                sharedAnnotationReferences[dummyLocalId].id,
                            excludeFromLists: false,
                        },
                    ])
                },
            },
        ],
    }
}
