import expect from 'expect'
import type StorageManager from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestInstance,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import * as data from './index.test.data'
import { BackgroundIntegrationTestSetupOpts } from 'src/tests/background-integration-tests'
import { StorageHooksChangeWatcher } from '@worldbrain/memex-common/lib/storage/hooks'
import { createLazyMemoryServerStorage } from 'src/storage/server'
import { FakeFetch } from 'src/util/tests/fake-fetch'
import { indexTestFingerprintedPdf } from 'src/page-indexing/background/index.tests'
import { maybeInt } from '@worldbrain/memex-common/lib/utils/conversion'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SharingTestHelper } from './index.tests'

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
    setup.authService.setUser(TEST_USER)
    personalCloud.actionQueue.forceQueueSkip = true
    await personalCloud.setup()
    await personalCloud.startSync()

    const serverStorage = await setup.getServerStorage()
    await serverStorage.storageManager.operation(
        'createObject',
        'user',
        TEST_USER,
    )

    if (options.createTestList) {
        testData.localListId = await data.createContentSharingTestList(setup)
    }

    const shareTestList = async () => {
        const listShareResult = await contentSharing.shareList({
            listId: testData.localListId,
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

    const getShared = getFromDB(serverStorage.storageManager)
    const getLocal = getFromDB(setup.storageManager)

    return {
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
                                    shareToLists: true,
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
                                    shareToLists: true,
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
                                    shareToLists: true,
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
                                    shareToLists: true,
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
                                    shareToLists: true,
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
                                    shareToLists: true,
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

                                const serverStorage = await setup.getServerStorage()
                                const listReference = await serverStorage.storageModules.contentSharing.createSharedList(
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
                                } = await serverStorage.storageModules.contentSharing.createListKey(
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
        backgroundIntegrationTest(
            'should be able to transition an annotation from private to selectively shared state, via being added to a shared list',
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
        backgroundIntegrationTest(
            'should be able to transition an annotation from private to selectively shared state, via being part of a private list that becomes shared',
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
        backgroundIntegrationTest(
            "should be able to transition an annotation from public to selectively shared state, via being added to a shared list AND user choosing to 'protect' it",
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
    ],
    { includePostSyncProcessor: true },
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
        getSetupOptions: (): BackgroundIntegrationTestSetupOpts => {
            storageHooksChangeWatcher = new StorageHooksChangeWatcher()
            const getServerStorage = createLazyMemoryServerStorage({
                changeWatchSettings: storageHooksChangeWatcher,
            })
            return {
                getServerStorage,
            }
        },
        setup: async (context) => {
            const fakeFetch = new FakeFetch()

            storageHooksChangeWatcher.setUp({
                fetch: fakeFetch.fetch,
                getCurrentUserReference: async () => ({
                    type: 'user-reference',
                    id: (await context.setup.authService.getCurrentUser()).id,
                }),
                serverStorageManager: (await context.setup.getServerStorage())
                    .storageManager,
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

                    const serverStorage = await setup.getServerStorage()
                    if (!options.ownPage) {
                        await serverStorage.storageModules.contentSharing.ensurePageInfo(
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
                        await serverStorage.storageManager.operation(
                            'createObject',
                            'user',
                            userTwo,
                        )
                    }

                    const createdWhen = Date.now()
                    const dummyLocalId = 'aaa'
                    const {
                        sharedAnnotationReferences,
                    } = await serverStorage.storageModules.contentSharing.createAnnotations(
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
