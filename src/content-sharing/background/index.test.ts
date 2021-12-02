import orderBy from 'lodash/orderBy'
import expect from 'expect'
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
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SharingTestHelper } from './index.tests'

function convertRemoteId(id: string) {
    return parseInt(id, 10)
}

async function setupPreTest({ setup }: BackgroundIntegrationTestContext) {
    setup.injectCallFirebaseFunction(async <Returns>() => null as Returns)
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

    return {
        directLinking,
        contentSharing,
        personalCloud,
        shareTestList,
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
                const testData: TestData = {}

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
            'should unshare annotations from lists',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                    shareTestList,
                                    directLinking,
                                } = await setupTest({
                                    setup,
                                    testData,
                                    createTestList: true,
                                })
                                testData.remoteListId = await shareTestList()
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                    shareToLists: true,
                                })
                                await personalCloud.waitForSync()

                                const remoteAnnotationIds = await contentSharing.storage.getRemoteAnnotationIds(
                                    {
                                        localIds: [annotationUrl],
                                    },
                                )

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                    )

                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([
                                    expect.objectContaining({
                                        sharedAnnotation: convertRemoteId(
                                            remoteAnnotationIds[
                                                annotationUrl
                                            ] as string,
                                        ),
                                    }),
                                ])
                                await contentSharing.unshareAnnotationsFromLists(
                                    {
                                        annotationUrls: [annotationUrl],
                                    },
                                )
                                await personalCloud.waitForSync()

                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([])
                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([
                                    expect.objectContaining({
                                        id: convertRemoteId(
                                            remoteAnnotationIds[
                                                annotationUrl
                                            ] as string,
                                        ),
                                    }),
                                ])
                                expect(
                                    await setup.storageManager
                                        .collection('sharedAnnotationMetadata')
                                        .findObjects({}),
                                ).toEqual([
                                    {
                                        localId: annotationUrl,
                                        remoteId: expect.anything(),
                                        excludeFromLists: true,
                                    },
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share already shared annotations adding a page to another shared list',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()
                const testData: TestData = {}
                let firstLocalListId: number
                let secondLocalListId: number

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                    directLinking,
                                } = await setupTest({
                                    setup,
                                    testData,
                                })

                                firstLocalListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                secondLocalListId = await setup.backgroundModules.customLists.createCustomList(
                                    {
                                        name: 'Second list',
                                    },
                                )
                                for (const localListId of [
                                    firstLocalListId,
                                    secondLocalListId,
                                ]) {
                                    await contentSharing.shareList({
                                        listId: localListId,
                                    })
                                }
                                const remoteListIds = await Promise.all(
                                    [firstLocalListId, secondLocalListId].map(
                                        (localId) =>
                                            contentSharing.storage.getRemoteListId(
                                                {
                                                    localId,
                                                },
                                            ),
                                    ),
                                )

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_2_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl: firstAnnotationUrl,
                                    shareToLists: true,
                                })
                                await contentSharing.shareAnnotation({
                                    annotationUrl: secondAnnotationUrl,
                                })
                                await personalCloud.waitForSync()

                                const remoteAnnotationIds = await contentSharing.storage.getRemoteAnnotationIds(
                                    {
                                        localIds: [
                                            firstAnnotationUrl,
                                            secondAnnotationUrl,
                                        ],
                                    },
                                )
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: secondLocalListId,
                                        ...data.ENTRY_1_DATA,
                                    },
                                )
                                await personalCloud.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                        { order: [['id', 'asc']] },
                                    )
                                const sharedAnnotations = await getShared(
                                    'sharedAnnotation',
                                )
                                expect(sharedAnnotations).toEqual([
                                    {
                                        id:
                                            convertRemoteId(
                                                remoteAnnotationIds[
                                                    firstAnnotationUrl
                                                ] as string,
                                            ) ||
                                            remoteAnnotationIds[
                                                firstAnnotationUrl
                                            ],
                                        creator: TEST_USER.id,
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        comment:
                                            data.ANNOTATION_1_1_DATA.comment,
                                        body: data.ANNOTATION_1_1_DATA.body,
                                        selector: JSON.stringify(
                                            data.ANNOTATION_1_1_DATA.selector,
                                        ),
                                    },
                                    expect.objectContaining({
                                        body: data.ANNOTATION_1_2_DATA.body,
                                    }),
                                ])
                                const sharedAnnotationListEntries = await getShared(
                                    'sharedAnnotationListEntry',
                                )
                                const sharedAnnotationId =
                                    convertRemoteId(
                                        remoteAnnotationIds[
                                            firstAnnotationUrl
                                        ] as string,
                                    ) || remoteAnnotationIds[firstAnnotationUrl]
                                expect(sharedAnnotationListEntries).toEqual([
                                    expect.objectContaining({
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        sharedList: convertRemoteId(
                                            remoteListIds[0],
                                        ),
                                        sharedAnnotation: sharedAnnotationId,
                                    }),
                                    expect.objectContaining({
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        sharedList: convertRemoteId(
                                            remoteListIds[1],
                                        ),
                                        sharedAnnotation: sharedAnnotationId,
                                    }),
                                ])
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
                const testData: TestData = {}

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                    shareTestList,
                                    directLinking,
                                } = await setupTest({
                                    setup,
                                    testData,
                                    createTestList: true,
                                })
                                testData.remoteListId = await shareTestList()
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await personalCloud.waitForSync()

                                await setup.backgroundModules.directLinking.editAnnotation(
                                    null,
                                    annotationUrl,
                                    'Updated comment',
                                )
                                await personalCloud.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                    )
                                const sharedAnnotations = await getShared(
                                    'sharedAnnotation',
                                )
                                expect(sharedAnnotations).toEqual([
                                    expect.objectContaining({
                                        comment: 'Updated comment',
                                        body: data.ANNOTATION_1_1_DATA.body,
                                    }),
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should share already shared annotations when sharing a list containing already shared pages',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()
                const testData: TestData = {}
                let firstLocalListId: number
                let secondLocalListId: number

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                    directLinking,
                                } = await setupTest({ setup, testData })
                                firstLocalListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                secondLocalListId = await setup.backgroundModules.customLists.createCustomList(
                                    {
                                        name: 'Second list',
                                    },
                                )
                                await contentSharing.shareList({
                                    listId: firstLocalListId,
                                })
                                await personalCloud.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                    shareToLists: true,
                                })
                                await personalCloud.waitForSync()

                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: secondLocalListId,
                                        ...data.ENTRY_1_DATA,
                                    },
                                )
                                await contentSharing.shareList({
                                    listId: secondLocalListId,
                                })

                                await personalCloud.waitForSync()
                                const remoteListIds = await Promise.all(
                                    [firstLocalListId, secondLocalListId].map(
                                        (localId) =>
                                            contentSharing.storage.getRemoteListId(
                                                {
                                                    localId,
                                                },
                                            ),
                                    ),
                                )
                                const remoteAnnotationIds = await contentSharing.storage.getRemoteAnnotationIds(
                                    {
                                        localIds: [annotationUrl],
                                    },
                                )

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                        { order: [['id', 'asc']] },
                                    )
                                const sharedAnnotations = await getShared(
                                    'sharedAnnotation',
                                )
                                expect(sharedAnnotations).toEqual([
                                    {
                                        id:
                                            convertRemoteId(
                                                remoteAnnotationIds[
                                                    annotationUrl
                                                ] as string,
                                            ) ||
                                            remoteAnnotationIds[annotationUrl],
                                        creator: TEST_USER.id,
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        comment:
                                            data.ANNOTATION_1_1_DATA.comment,
                                        body: data.ANNOTATION_1_1_DATA.body,
                                        selector: JSON.stringify(
                                            data.ANNOTATION_1_1_DATA.selector,
                                        ),
                                    },
                                ])
                                const sharedAnnotationListEntries = await getShared(
                                    'sharedAnnotationListEntry',
                                )
                                const sharedAnnotationId =
                                    convertRemoteId(
                                        remoteAnnotationIds[
                                            annotationUrl
                                        ] as string,
                                    ) || remoteAnnotationIds[annotationUrl]
                                expect(sharedAnnotationListEntries).toEqual([
                                    expect.objectContaining({
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        sharedList: convertRemoteId(
                                            remoteListIds[0],
                                        ),
                                        sharedAnnotation: sharedAnnotationId,
                                    }),
                                    expect.objectContaining({
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_1_DATA.pageUrl,
                                        ),
                                        sharedList: convertRemoteId(
                                            remoteListIds[1],
                                        ),
                                        sharedAnnotation: sharedAnnotationId,
                                    }),
                                ])

                                expect(
                                    await contentSharing.getAllRemoteLists(),
                                ).toEqual([
                                    {
                                        localId: firstLocalListId,
                                        remoteId: remoteListIds[0],
                                        name: 'My shared list',
                                    },
                                    {
                                        localId: secondLocalListId,
                                        remoteId: remoteListIds[1],
                                        name: 'Second list',
                                    },
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should unshare an annotation',
            { skipConflictTests: true },
            () => {
                const helper = new SharingTestHelper()
                const testData: TestData = {}
                let localListIds: number[]

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    directLinking,
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({ setup, testData })

                                localListIds = [
                                    await data.createContentSharingTestList(
                                        setup,
                                    ),
                                    await data.createContentSharingTestList(
                                        setup,
                                        { dontIndexPages: true },
                                    ),
                                ]
                                for (const localListId of localListIds) {
                                    await contentSharing.shareList({
                                        listId: localListId,
                                    })
                                }
                                await personalCloud.waitForSync()

                                const annotationUrl = await directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )

                                expect(
                                    await setup.storageManager.operation(
                                        'findObjects',
                                        'sharedAnnotationMetadata',
                                        {},
                                    ),
                                ).toEqual([])

                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                    shareToLists: true,
                                })

                                expect(
                                    await setup.storageManager.operation(
                                        'findObjects',
                                        'sharedAnnotationMetadata',
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        localId: annotationUrl,
                                        remoteId: expect.any(String),
                                        excludeFromLists: false,
                                    },
                                ])

                                await personalCloud.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                        { order: [['id', 'asc']] },
                                    )
                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([
                                    expect.objectContaining({
                                        body: data.ANNOTATION_1_1_DATA.body,
                                    }),
                                ])
                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([
                                    expect.objectContaining({}),
                                    expect.objectContaining({}),
                                ])

                                await directLinking.setAnnotationPrivacyLevel(
                                    {},
                                    {
                                        annotation: annotationUrl,
                                        privacyLevel:
                                            AnnotationPrivacyLevels.PRIVATE,
                                    },
                                )

                                await personalCloud.waitForSync()

                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([])
                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([])
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
                const testData: TestData = {}
                let localListIds: number[]

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({ setup, testData })

                                localListIds = [
                                    await data.createContentSharingTestList(
                                        setup,
                                    ),
                                    await data.createContentSharingTestList(
                                        setup,
                                        { dontIndexPages: true },
                                    ),
                                ]
                                for (const localListId of localListIds) {
                                    await contentSharing.shareList({
                                        listId: localListId,
                                    })
                                }
                                await personalCloud.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                    shareToLists: true,
                                })

                                await personalCloud.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                        { order: [['id', 'asc']] },
                                    )
                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([
                                    expect.objectContaining({
                                        body: data.ANNOTATION_1_1_DATA.body,
                                    }),
                                ])
                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([
                                    expect.objectContaining({}),
                                    expect.objectContaining({}),
                                ])

                                await setup.backgroundModules.customLists.removePageFromList(
                                    {
                                        id: localListIds[0],
                                        url: data.PAGE_1_DATA.pageDoc.url,
                                    },
                                )
                                await personalCloud.waitForSync()

                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([expect.objectContaining({})])

                                await setup.backgroundModules.customLists.removePageFromList(
                                    {
                                        id: localListIds[1],
                                        url: data.PAGE_1_DATA.pageDoc.url,
                                    },
                                )
                                await personalCloud.waitForSync()

                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([])
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
                const testData: TestData = {}
                let localListIds: number[]

                return {
                    setup: setupPreTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                    personalCloud,
                                } = await setupTest({ setup, testData })

                                localListIds = [
                                    await data.createContentSharingTestList(
                                        setup,
                                    ),
                                    await data.createContentSharingTestList(
                                        setup,
                                        { dontIndexPages: true },
                                    ),
                                ]
                                for (const localListId of localListIds) {
                                    await contentSharing.shareList({
                                        listId: localListId,
                                    })
                                }
                                await personalCloud.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                    shareToLists: true,
                                })

                                await personalCloud.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                const getShared = (collection: string) =>
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        collection,
                                        {},
                                        { order: [['id', 'asc']] },
                                    )
                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([
                                    expect.objectContaining({
                                        body: data.ANNOTATION_1_1_DATA.body,
                                    }),
                                ])
                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
                                ).toEqual([
                                    expect.objectContaining({}),
                                    expect.objectContaining({}),
                                ])

                                await setup.backgroundModules.directLinking.deleteAnnotation(
                                    null,
                                    annotationUrl,
                                )
                                await personalCloud.waitForSync()

                                expect(
                                    await getShared('sharedAnnotation'),
                                ).toEqual([])
                                expect(
                                    await getShared(
                                        'sharedAnnotationListEntry',
                                    ),
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
        setup: async ({ setup }) => {},
        steps: [
            {
                execute: async ({ setup }) => {
                    const {
                        contentSharing,
                        personalCloud,
                    } = setup.backgroundModules
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
                            level: AnnotationPrivacyLevels.SHARED_PROTECTED,
                        })
                    }

                    if (options.annotationSharingMethod === 'shareAnnotation') {
                        await helper.shareAnnotation(setup, { id: 1 })
                        await helper.shareAnnotation(setup, { id: 2 })

                        if (options.testDuplicateSharing) {
                            await helper.shareAnnotation(setup, { id: 2 })
                        }
                    } else if (
                        options.annotationSharingMethod === 'shareAnnotations'
                    ) {
                        await helper.shareAnnotations(setup, { ids: [1, 2] })
                        if (options.testDuplicateSharing) {
                            await helper.shareAnnotations(setup, {
                                ids: [1, 2],
                            })
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
                    await helper.assertSharedAnnotations(setup, {
                        ids: [
                            1,
                            ...(!options.testProtectedBulkShare ? [2] : []),
                        ],
                    })

                    await helper.assertSharedAnnotationEntries(setup, {
                        entries: [],
                    })

                    await helper.shareAnnotationsToLists(setup, { ids: [1] })
                    if (options.testDuplicateSharing) {
                        await helper.shareAnnotationsToLists(setup, {
                            ids: [1],
                        })
                    }

                    await helper.assertSharedAnnotationEntries(setup, {
                        entries: [{ annotationId: 1, listId: 1 }],
                    })
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
