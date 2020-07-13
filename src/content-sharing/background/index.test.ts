import expect from 'expect'

import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Content sharing',
    [
        backgroundIntegrationTest(
            'should share a new list with its entries',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                setup.authService.setUser(TEST_USER)

                                const listId = await setup.backgroundModules.customLists.createCustomList(
                                    {
                                        name: 'My shared list',
                                    },
                                )
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: listId,
                                        url: 'https://www.spam.com/foo',
                                    },
                                )
                                await setup.backgroundModules.customLists.insertPageToList(
                                    {
                                        id: listId,
                                        url: 'https://www.eggs.com/foo',
                                    },
                                )

                                const {
                                    serverListId,
                                } = await setup.backgroundModules.contentSharing.shareList(
                                    { listId },
                                )
                                await setup.backgroundModules.contentSharing.shareListEntries(
                                    { listId },
                                )

                                const serverStorage = await setup.getServerStorage()
                                expect(
                                    serverStorage.storageManager.operation(
                                        'findObjects',
                                        'sharedList',
                                        {},
                                    ),
                                ).toEqual([{}])
                            },
                            preCheck: async ({ setup }) => {},
                            postCheck: async ({ setup }) => {
                                // const listMetadata = await setup.storageManager.operation('findObjects', 'sharedListMetadata', {})
                                // expect(listMetadata).toEqual([
                                //     {}
                                // ])
                            },
                        },
                    ],
                }
            },
        ),
    ],
)
