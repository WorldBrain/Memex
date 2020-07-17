import expect from 'expect'

import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

async function createTestList(setup: BackgroundIntegrationTestSetup) {
    const localListId = await setup.backgroundModules.customLists.createCustomList(
        {
            name: 'My shared list',
        },
    )
    await setup.backgroundModules.search.searchIndex.addPage({
        pageDoc: {
            url: 'https://www.spam.com/foo',
            content: {
                title: 'Spam.com title',
            },
        },
        visits: [],
        rejectNoContent: false,
    })
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        url: 'https://www.spam.com/foo',
    })
    await setup.backgroundModules.search.searchIndex.addPage({
        pageDoc: {
            url: 'https://www.eggs.com/foo',
            content: {
                title: 'Eggs.com title',
            },
        },
        visits: [],
        rejectNoContent: false,
    })
    await setup.backgroundModules.customLists.insertPageToList({
        id: localListId,
        url: 'https://www.eggs.com/foo',
    })

    return localListId
}

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Content sharing',
    [
        backgroundIntegrationTest(
            'should share a new list with its entries',
            () => {
                let localListId: number
                let remoteListId: string

                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await createTestList(setup)
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
                                        {},
                                    ),
                                ).toEqual([
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList:
                                            listShareResult.remoteListId,
                                        createdWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.eggs.com/foo',
                                        normalizedUrl: 'eggs.com/foo',
                                        entryTitle: 'Eggs.com title',
                                    },
                                    {
                                        id: expect.anything(),
                                        creator: TEST_USER.id,
                                        sharedList:
                                            listShareResult.remoteListId,
                                        createdWhen: expect.any(Number),
                                        updatedWhen: expect.any(Number),
                                        originalUrl: 'https://www.spam.com/foo',
                                        normalizedUrl: 'spam.com/foo',
                                        entryTitle: 'Spam.com title',
                                    },
                                ])
                            },
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
            () => {
                let localListId: number

                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                localListId = await createTestList(setup)
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
                                await setup.backgroundModules.contentSharing.waitForListSync(
                                    {
                                        localListId,
                                    },
                                )

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
            () => {
                let localListId: number

                return {
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
                                await setup.backgroundModules.contentSharing.waitForListSync(
                                    {
                                        localListId,
                                    },
                                )

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
    ],
)
