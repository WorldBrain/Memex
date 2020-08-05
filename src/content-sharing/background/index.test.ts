import expect from 'expect'
import sinon from 'sinon'

import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import * as data from './index.test.data'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
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

                                const listShareResult = await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId: localListId },
                                )
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
                                        sharedList: parseInt(
                                            listShareResult.remoteListId,
                                            10,
                                        ),
                                        createdWhen: localListEntries[0].createdAt.getTime(),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.eggs.com/foo',
                                        normalizedUrl: 'eggs.com/foo',
                                        entryTitle: 'Eggs.com title',
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList: parseInt(
                                            listShareResult.remoteListId,
                                            10,
                                        ),
                                        createdWhen: localListEntries[1].createdAt.getTime(),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.spam.com/foo',
                                        normalizedUrl: 'spam.com/foo',
                                        entryTitle: 'Spam.com title',
                                    },
                                ])
                            },
                            expectedSyncLogEntries: () => [
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'customLists',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'pages',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'visits',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'pageListEntries',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'pages',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'visits',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'pageListEntries',
                                }),
                                expect.objectContaining({
                                    operation: 'create',
                                    collection: 'sharedListMetadata',
                                }),
                            ],
                            preCheck: async ({ setup }) => {},
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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId: localListId },
                                )

                                // Add new entry
                                await setup.backgroundModules.search.searchIndex.addPage(
                                    {
                                        pageDoc: {
                                            url: 'https://www.fish.com/cheese',
                                            content: {
                                                title: 'Fish.com title',
                                            },
                                        },
                                        visits: [],
                                        rejectNoContent: false,
                                    },
                                )
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: localListId,
                                        url: 'https://www.fish.com/cheese',
                                    },
                                )
                                await setup.backgroundModules.contentSharing.waitForSync()

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
            'should share newly shared annotations in an already shared list',
            { skipConflictTests: true },
            () => {
                let localListId: number

                return {
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId: localListId },
                                )
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    {} as any,
                                    data.ANNOTATION_1_DATA,
                                    { skipPageIndexing: true },
                                )
                                await setup.backgroundModules.contentSharing.shareAnnotation(
                                    {
                                        annotationUrl,
                                    },
                                )
                                await setup.backgroundModules.contentSharing.waitForSync()

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
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_DATA.pageUrl,
                                        ),
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        comment: data.ANNOTATION_1_DATA.comment,
                                        body: data.ANNOTATION_1_DATA.body,
                                        selector: JSON.stringify(
                                            data.ANNOTATION_1_DATA.selector,
                                        ),
                                    },
                                ])
                                const sharedAnnotationListEntries = await getShared(
                                    'sharedAnnotationListEntry',
                                )
                                expect(sharedAnnotationListEntries).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        normalizedPageUrl: normalizeUrl(
                                            data.ANNOTATION_1_DATA.pageUrl,
                                        ),
                                        createdWhen: expect.any(Number),
                                        uploadedWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        sharedList: expect.any(Number),
                                        sharedAnnotation:
                                            sharedAnnotations[0].id,
                                    },
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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                const initialTitle = 'My shared list'
                                localListId = await setup.backgroundModules.customLists.createCustomList(
                                    {
                                        name: initialTitle,
                                    },
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )

                                const updatedTitle =
                                    'My shared list (updated title)'
                                await setup.backgroundModules.customLists.updateList(
                                    {
                                        id: localListId,
                                        oldName: initialTitle,
                                        newName: updatedTitle,
                                    },
                                )
                                await setup.backgroundModules.contentSharing.waitForSync()

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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId: localListId },
                                )

                                await setup.backgroundModules.customLists.removePageFromList(
                                    {
                                        id: localListId,
                                        url: 'https://www.spam.com/foo',
                                    },
                                )
                                await setup.backgroundModules.contentSharing.waitForSync()

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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                const setTimeout = sinon.fake()
                                setup.backgroundModules.contentSharing._setTimeout = setTimeout as any

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
                                        setup.backgroundModules.contentSharing.shareListEntries(
                                            { listId: localListId },
                                        ),
                                    ).rejects.toThrow(
                                        `There's a monkey in your WiFi`,
                                    )
                                } finally {
                                    sinon.restore()
                                }
                                expect(setTimeout.calledOnce).toBe(true)
                                await setTimeout.firstCall.args[0]()

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
                    setup: async ({ setup }) => {
                        setup.backgroundModules.contentSharing.shouldProcessSyncChanges = false
                    },
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await data.createContentSharingTestList(
                                    setup,
                                )
                                await setup.backgroundModules.contentSharing.shareList(
                                    { listId: localListId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId: localListId },
                                )

                                const setTimeout = sinon.fake()
                                setup.backgroundModules.contentSharing._setTimeout = setTimeout as any

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
                                try {
                                    await expect(
                                        setup.backgroundModules.customLists.removePageFromList(
                                            {
                                                id: localListId,
                                                url: 'https://www.spam.com/foo',
                                            },
                                        ),
                                    ).rejects.toThrow(
                                        `There's a monkey in your WiFi`,
                                    )
                                } finally {
                                    sinon.restore()
                                }
                                expect(setTimeout.calledOnce).toBe(true)
                                await setTimeout.firstCall.args[0]()

                                await setup.backgroundModules.contentSharing.waitForSync()

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
    ],
)
