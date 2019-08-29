import expect from 'expect'
import {
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    backgroundIntegrationTestSuite,
} from 'src/tests/integration-tests'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest(
            'should create a list, edit its title and retrieve it',
            () => {
                const customLists = (setup: BackgroundIntegrationTestSetup) =>
                    setup.backgroundModules.customLists
                let listId!: number
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                listId = await customLists(
                                    setup,
                                ).createCustomList({
                                    name: 'My Custom List',
                                })
                            },
                            exepctedStorageChanges: () => [
                                {
                                    type: 'create',
                                    collection: 'customLists',
                                    object: {
                                        name: 'My Custom List',
                                    },
                                },
                            ],
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).insertPageToList({
                                    id: listId,
                                    url: 'http://www.bla.com/',
                                }),
                            exepctedStorageChanges: () => [
                                {
                                    type: 'create',
                                    collection: 'pageListEntries',
                                    object: {
                                        listId,
                                        url: 'http://www.bla.com/',
                                    },
                                },
                            ],
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).updateList({
                                    id: listId,
                                    name: 'Updated List Title',
                                }),
                            expectedStorageChanges: () => [
                                {
                                    type: 'update',
                                    collection: 'customLists',
                                    updates: {
                                        name: 'Updated List Title',
                                    },
                                },
                            ],
                            postCheck: async ({ setup }) => {
                                expect(
                                    await customLists(setup).fetchListById({
                                        id: listId,
                                    }),
                                ).toEqual({
                                    id: expect.any(Number),
                                    name: 'Updated List Title',
                                    isDeletable: true,
                                    isNestable: true,
                                    createdAt: expect.any(Date),
                                    pages: ['http://www.bla.com/'],
                                    active: true,
                                })
                            },
                        },
                    ],
                }
            },
        ),
    ],
)
