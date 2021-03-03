import expect from 'expect'
import sinon from 'sinon'

import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTestInstance,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import * as data from './index.test.data'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

function convertRemoteId(id: string) {
    return parseInt(id, 10)
}

async function setupTest({ setup }: BackgroundIntegrationTestContext) {
    setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
    setup.injectCallFirebaseFunction(async <Returns>() => null as Returns)
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Content sharing',
    [
        backgroundIntegrationTest(
            'should share a new list with its entries',
            { skipConflictTests: true },
            () => {
                let localListId: number
                let remoteListId: string

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                const localListEntries = await setup.storageManager.operation(
                                    'findObjects',
                                    'pageListEntries',
                                    {
                                        sort: [['createdAt', 'desc']],
                                    },
                                )

                                const listShareResult = await contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })
                                remoteListId = listShareResult.remoteListId

                                const serverStorage = await setup.getServerStorage()
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedList',
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        createdWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        title: 'My shared list',
                                        description: null,
                                    },
                                ])
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedListEntry',
                                        { sort: [['createdWhen', 'desc']] },
                                    ),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: convertRemoteId(
                                            listShareResult.remoteListId,
                                        ),
                                        createdWhen: localListEntries[1].createdAt.getTime(),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.eggs.com/foo',
                                        normalizedUrl: 'eggs.com/foo',
                                        entryTitle: 'Eggs.com title',
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: convertRemoteId(
                                            listShareResult.remoteListId,
                                        ),
                                        createdWhen: localListEntries[2].createdAt.getTime(),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.spam.com/foo',
                                        normalizedUrl: 'spam.com/foo',
                                        entryTitle: 'Spam.com title',
                                    },
                                ])
                            },
                            postCheck: async ({ setup }) => {
                                const listMetadata = await setup.storageManager.operation(
                                    'findObjects',
                                    'sharedListMetadata',
                                    {},
                                )
                                expect(listMetadata).toEqual([
                                    {
                                        localId: localListId,
                                        remoteId: remoteListId,
                                    },
                                ])
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
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })

                                // Add new entry
                                await setup.backgroundModules.pages.addPage({
                                    pageDoc: {
                                        url: 'https://www.fish.com/cheese',
                                        content: {
                                            title: 'Fish.com title',
                                        },
                                    },
                                    visits: [],
                                    rejectNoContent: false,
                                })
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: localListId,
                                        url: 'https://www.fish.com/cheese',
                                    },
                                )
                                await contentSharing.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedListEntry',
                                        {},
                                    ),
                                ).toEqual([
                                    expect.objectContaining({
                                        normalizedUrl: 'eggs.com/foo',
                                        entryTitle: 'Eggs.com title',
                                    }),
                                    expect.objectContaining({
                                        normalizedUrl: 'spam.com/foo',
                                        entryTitle: 'Spam.com title',
                                    }),
                                    expect.objectContaining({
                                        normalizedUrl: 'fish.com/cheese',
                                        entryTitle: 'Fish.com title',
                                    }),
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
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                const initialTitle = 'My shared list'
                                localListId = await setup.backgroundModules.customLists.createCustomList(
                                    {
                                        name: initialTitle,
                                    },
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })

                                const updatedTitle =
                                    'My shared list (updated title)'
                                await setup.backgroundModules.customLists.updateList(
                                    {
                                        id: localListId,
                                        oldName: initialTitle,
                                        newName: updatedTitle,
                                    },
                                )
                                await contentSharing.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedList',
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        createdWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        title: updatedTitle,
                                        description: null,
                                    },
                                ])

                                // It should not fail when trying to update other fields than the title of the list
                                await setup.storageManager.operation(
                                    'updateObject',
                                    'customLists',
                                    { id: localListId },
                                    { searchableName: 'something' },
                                )
                                await contentSharing.waitForSync()
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedList',
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        createdWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        title: updatedTitle,
                                        description: null,
                                    },
                                ])
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
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })

                                await setup.backgroundModules.customLists.removePageFromList(
                                    {
                                        id: localListId,
                                        url: 'https://www.spam.com/foo',
                                    },
                                )
                                await contentSharing.waitForSync()

                                const serverStorage = await setup.getServerStorage()
                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedListEntry',
                                        {},
                                    ),
                                ).toEqual([
                                    expect.objectContaining({
                                        entryTitle: 'Eggs.com title',
                                    }),
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should schedule a retry when we cannot upload list entries`,
            { skipConflictTests: true },
            () => {
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })

                                const serverStorage = await setup.getServerStorage()
                                const sharingStorage =
                                    serverStorage.storageModules.contentSharing

                                sinon.replace(
                                    sharingStorage,
                                    'createListEntries',
                                    async () => {
                                        throw Error(
                                            `There's a monkey in your WiFi`,
                                        )
                                    },
                                )
                                try {
                                    await expect(
                                        contentSharing.shareListEntries({
                                            listId: localListId,
                                            queueInteraction: 'queue-and-await',
                                        }),
                                    ).rejects.toThrow(
                                        `There's a monkey in your WiFi`,
                                    )
                                } finally {
                                    sinon.restore()
                                }
                                expect(contentSharing._scheduledRetry).not.toBe(
                                    undefined,
                                )
                                await contentSharing.forcePendingActionsRetry()

                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedListEntry',
                                        {},
                                    ),
                                ).toEqual([
                                    expect.objectContaining({
                                        entryTitle: 'Eggs.com title',
                                    }),
                                    expect.objectContaining({
                                        entryTitle: 'Spam.com title',
                                    }),
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should schedule a retry when we cannot upload changes`,
            { skipConflictTests: true },
            () => {
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })

                                const serverStorage = await setup.getServerStorage()
                                const sharingStorage =
                                    serverStorage.storageModules.contentSharing

                                sinon.replace(
                                    sharingStorage,
                                    'removeListEntries',
                                    async () => {
                                        throw Error(
                                            `There's a monkey in your WiFi`,
                                        )
                                    },
                                )
                                await setup.backgroundModules.customLists.removePageFromList(
                                    {
                                        id: localListId,
                                        url: 'https://www.spam.com/foo',
                                    },
                                )
                                await contentSharing.waitForSync()

                                expect(contentSharing._scheduledRetry).not.toBe(
                                    undefined,
                                )
                                sinon.restore()
                                await contentSharing.forcePendingActionsRetry()
                                await contentSharing.waitForSync()

                                expect(
                                    await serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedListEntry',
                                        {},
                                    ),
                                ).toEqual([
                                    expect.objectContaining({
                                        entryTitle: 'Eggs.com title',
                                    }),
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            `should share newly shared annotations in an already shared list using the 'shareAnnotation' method'`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotation',
                    testDuplicateSharing: false,
                }),
        ),
        backgroundIntegrationTest(
            `should not share annotations more than once in an already shared list using the 'shareAnnotation' method'`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotation',
                    testDuplicateSharing: true,
                }),
        ),
        backgroundIntegrationTest(
            `should share newly shared annotations in an already shared list using the 'shareAnnotations' method'`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotations',
                    testDuplicateSharing: false,
                }),
        ),
        backgroundIntegrationTest(
            `should not share annotations more than once in an already shared list using the 'shareAnnotations' method'`,
            { skipConflictTests: true },
            () =>
                makeShareAnnotationTest({
                    annotationSharingMethod: 'shareAnnotations',
                    testDuplicateSharing: true,
                }),
        ),
        backgroundIntegrationTest(
            'should unshare annotations from lists',
            { skipConflictTests: true },
            () => {
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [annotationUrl],
                                })
                                await contentSharing.waitForSync()

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
                                await contentSharing.waitForSync()

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
                let firstLocalListId: number
                let secondLocalListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

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
                                    await contentSharing.shareListEntries({
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
                                })
                                await contentSharing.shareAnnotation({
                                    annotationUrl: secondAnnotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [firstAnnotationUrl],
                                })
                                await contentSharing.waitForSync()

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
                                await contentSharing.waitForSync()

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
                let localListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await contentSharing.shareList({
                                    listId: localListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: localListId,
                                })
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.waitForSync()

                                await setup.backgroundModules.directLinking.editAnnotation(
                                    null,
                                    annotationUrl,
                                    'Updated comment',
                                )
                                await contentSharing.waitForSync()

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
                let firstLocalListId: number
                let secondLocalListId: number

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

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
                                await contentSharing.shareListEntries({
                                    listId: firstLocalListId,
                                })
                                await contentSharing.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [annotationUrl],
                                })
                                await contentSharing.waitForSync()

                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: secondLocalListId,
                                        ...data.ENTRY_1_DATA,
                                    },
                                )
                                await contentSharing.shareList({
                                    listId: secondLocalListId,
                                })
                                await contentSharing.shareListEntries({
                                    listId: secondLocalListId,
                                })

                                await contentSharing.waitForSync()
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
                let localListIds: number[]

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

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
                                    await contentSharing.shareListEntries({
                                        listId: localListId,
                                    })
                                }
                                await contentSharing.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [annotationUrl],
                                })
                                await contentSharing.waitForSync()

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

                                await contentSharing.unshareAnnotation({
                                    annotationUrl,
                                })

                                expect(
                                    await setup.storageManager.operation(
                                        'findObjects',
                                        'sharedAnnotationMetadata',
                                        {},
                                    ),
                                ).toEqual([])
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
                let localListIds: number[]

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

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
                                    await contentSharing.shareListEntries({
                                        listId: localListId,
                                    })
                                }
                                await contentSharing.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [annotationUrl],
                                })
                                await contentSharing.waitForSync()

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
                                await contentSharing.waitForSync()

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
                                await contentSharing.waitForSync()

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
                let localListIds: number[]

                return {
                    setup: setupTest,
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const {
                                    contentSharing,
                                } = setup.backgroundModules
                                setup.authService.setUser(TEST_USER)

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
                                    await contentSharing.shareListEntries({
                                        listId: localListId,
                                    })
                                }
                                await contentSharing.waitForSync()

                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await contentSharing.shareAnnotation({
                                    annotationUrl,
                                })
                                await contentSharing.shareAnnotationsToLists({
                                    annotationUrls: [annotationUrl],
                                })
                                await contentSharing.waitForSync()

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
                                await contentSharing.waitForSync()

                                // expect(
                                //     await setup.storageManager.operation(
                                //         'findObjects',
                                //         'sharedAnnotationMetadata',
                                //         {},
                                //     ),
                                // ).toEqual([])
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
    ],
    { includePostSyncProcessor: true },
)

function makeShareAnnotationTest(options: {
    annotationSharingMethod: 'shareAnnotation' | 'shareAnnotations'
    testDuplicateSharing: boolean
}): BackgroundIntegrationTestInstance {
    let localListId: number

    return {
        setup: async ({ setup }) => {
            setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
        },
        steps: [
            {
                execute: async ({ setup }) => {
                    const { contentSharing } = setup.backgroundModules
                    setup.authService.setUser(TEST_USER)

                    localListId = await data.createContentSharingTestList(setup)
                    await contentSharing.shareList({
                        listId: localListId,
                    })
                    await contentSharing.shareListEntries({
                        listId: localListId,
                    })
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
                    if (options.annotationSharingMethod === 'shareAnnotation') {
                        await contentSharing.shareAnnotation({
                            annotationUrl: firstAnnotationUrl,
                        })
                        await contentSharing.shareAnnotation({
                            annotationUrl: secondAnnotationUrl,
                        })

                        if (options.testDuplicateSharing) {
                            await contentSharing.shareAnnotation({
                                annotationUrl: secondAnnotationUrl,
                            })
                        }
                    } else if (
                        options.annotationSharingMethod === 'shareAnnotations'
                    ) {
                        await contentSharing.shareAnnotations({
                            annotationUrls: [
                                firstAnnotationUrl,
                                secondAnnotationUrl,
                            ],
                        })
                        if (options.testDuplicateSharing) {
                            await contentSharing.shareAnnotations({
                                annotationUrls: [
                                    firstAnnotationUrl,
                                    secondAnnotationUrl,
                                ],
                            })
                        }
                    }
                    await contentSharing.waitForSync()

                    // It should not try to upload the same annotation twice
                    await contentSharing.shareAnnotation({
                        annotationUrl: secondAnnotationUrl,
                    })
                    await contentSharing.waitForSync()

                    const sharedAnnotationMetadata = await setup.storageManager.operation(
                        'findObjects',
                        'sharedAnnotationMetadata',
                        {},
                    )
                    expect(sharedAnnotationMetadata).toEqual([
                        {
                            localId: firstAnnotationUrl,
                            remoteId: expect.anything(),
                            excludeFromLists: true,
                        },
                        {
                            localId: secondAnnotationUrl,
                            remoteId: expect.anything(),
                            excludeFromLists: true,
                        },
                    ])
                    const remoteAnnotationIds = await contentSharing.storage.getRemoteAnnotationIds(
                        {
                            localIds: [firstAnnotationUrl, secondAnnotationUrl],
                        },
                    )
                    expect(remoteAnnotationIds).toEqual({
                        [firstAnnotationUrl]:
                            sharedAnnotationMetadata[0].remoteId,
                        [secondAnnotationUrl]:
                            sharedAnnotationMetadata[1].remoteId,
                    })

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
                        {
                            id:
                                convertRemoteId(
                                    remoteAnnotationIds[
                                        firstAnnotationUrl
                                    ] as string,
                                ) || remoteAnnotationIds[firstAnnotationUrl],
                            creator: TEST_USER.id,
                            normalizedPageUrl: normalizeUrl(
                                data.ANNOTATION_1_1_DATA.pageUrl,
                            ),
                            createdWhen: expect.any(Number),
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            comment: data.ANNOTATION_1_1_DATA.comment,
                            body: data.ANNOTATION_1_1_DATA.body,
                            selector: JSON.stringify(
                                data.ANNOTATION_1_1_DATA.selector,
                            ),
                        },
                        expect.objectContaining({
                            body: data.ANNOTATION_1_2_DATA.body,
                        }),
                    ])
                    expect(
                        await getShared('sharedAnnotationListEntry'),
                    ).toEqual([])

                    await contentSharing.shareAnnotationsToLists({
                        annotationUrls: [firstAnnotationUrl],
                    })
                    if (options.testDuplicateSharing) {
                        await contentSharing.shareAnnotationsToLists({
                            annotationUrls: [firstAnnotationUrl],
                        })
                    }
                    await contentSharing.waitForSync()

                    expect(
                        await getShared('sharedAnnotationListEntry'),
                    ).toEqual([
                        {
                            id: expect.anything(),
                            creator: TEST_USER.id,
                            normalizedPageUrl: normalizeUrl(
                                data.ANNOTATION_1_1_DATA.pageUrl,
                            ),
                            createdWhen: expect.any(Number),
                            uploadedWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            sharedList: expect.any(Number),
                            sharedAnnotation:
                                convertRemoteId(
                                    remoteAnnotationIds[
                                        firstAnnotationUrl
                                    ] as string,
                                ) || remoteAnnotationIds[firstAnnotationUrl],
                        },
                    ])
                    expect(await getShared('sharedPageInfo')).toEqual([
                        {
                            id: expect.anything(),
                            createdWhen: expect.any(Number),
                            updatedWhen: expect.any(Number),
                            creator: TEST_USER.id,
                            fullTitle: data.PAGE_1_DATA.pageDoc.content.title,
                            normalizedUrl: normalizeUrl(
                                data.ANNOTATION_1_1_DATA.pageUrl,
                            ),
                            originalUrl: data.ENTRY_1_DATA.url,
                        },
                    ])
                    expect(
                        await setup.storageManager.operation(
                            'findObjects',
                            'sharedAnnotationMetadata',
                            {},
                        ),
                    ).toEqual([
                        {
                            localId: firstAnnotationUrl,
                            remoteId: expect.anything(),
                            excludeFromLists: false,
                        },
                        {
                            localId: secondAnnotationUrl,
                            remoteId: expect.anything(),
                            excludeFromLists: true,
                        },
                    ])
                },
            },
        ],
    }
}
