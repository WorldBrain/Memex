import expect from 'expect'
import {
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    backgroundIntegrationTestSuite,
} from 'src/tests/integration-tests'
import { StorageDiff } from 'src/tests/storage-change-detector'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Custom lists',
    [
        backgroundIntegrationTest(
            'should create a list, edit its title and retrieve it',
            () => {
                const customLists = (setup: BackgroundIntegrationTestSetup) =>
                    setup.backgroundModules.customLists
                let listId!: any
                let listEntry!: any
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
                            expectedStorageChanges: (): StorageDiff => ({
                                customLists: {
                                    [listId]: {
                                        type: 'create',
                                        object: {
                                            id: listId,
                                            createdAt: expect.any(Date),
                                            name: 'My Custom List',
                                            isDeletable: true,
                                            isNestable: true,
                                        },
                                    },
                                },
                            }),
                        },
                        {
                            execute: async ({ setup }) => {
                                listEntry = (await customLists(
                                    setup,
                                ).insertPageToList({
                                    id: listId,
                                    url: 'http://www.bla.com/',
                                })).object
                            },
                            expectedStorageChanges: (): StorageDiff => ({
                                pageListEntries: {
                                    [`[${listId},"${listEntry.pageUrl}"]`]: {
                                        type: 'create',
                                        object: {
                                            listId,
                                            createdAt: expect.any(Date),
                                            fullUrl: 'http://www.bla.com/',
                                            pageUrl: 'bla.com',
                                        },
                                    },
                                },
                            }),
                        },
                        {
                            execute: async ({ setup }) =>
                                customLists(setup).updateList({
                                    id: listId,
                                    name: 'Updated List Title',
                                }),
                            expectedStorageChanges: (): StorageDiff => ({
                                customLists: {
                                    [listId]: {
                                        type: 'modify',
                                        updates: {
                                            name: 'Updated List Title',
                                        },
                                    },
                                },
                            }),
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
