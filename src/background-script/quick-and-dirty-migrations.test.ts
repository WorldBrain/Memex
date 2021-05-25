import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-storage/lib/lists/constants'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { migrations, MigrationProps } from './quick-and-dirty-migrations'

const testPageUrls = ['test.com/1', 'test.com/2', 'test.com/3', 'test.com/4']

async function setupTest() {
    const setup = await setupBackgroundIntegrationTest()
    const migrationProps: MigrationProps = {
        storex: setup.storageManager,
        db: setup.storageManager.backend['dexieInstance'],
        localStorage: setup.browserAPIs.storage.local,
        backgroundModules: { readwise: setup.backgroundModules.readwise },
        normalizeUrl,
    }

    return { migrationProps, ...setup }
}

describe('quick-and-dirty migration tests', () => {
    describe('staticize-mobile-list-id', () => {
        it('should be able to staticize existing mobile list ID + update all entries', async () => {
            const { migrationProps } = await setupTest()

            const mobileListId = Date.now() // Mimics a dynamically allocated ID

            await migrationProps.db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.MOBILE,
                name: SPECIAL_LIST_NAMES.MOBILE,
                id: mobileListId,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })

            await migrationProps.db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                name: SPECIAL_LIST_NAMES.INBOX,
                id: SPECIAL_LIST_IDS.INBOX,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })

            for (const testPageUrl of testPageUrls) {
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: mobileListId,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: SPECIAL_LIST_IDS.INBOX,
                    createdAt: new Date(),
                })
            }

            expect(
                await migrationProps.db.table('customLists').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.MOBILE,
                        id: mobileListId,
                        isDeletable: false,
                        isNestable: false,
                    }),
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.INBOX,
                        id: SPECIAL_LIST_IDS.INBOX,
                        isDeletable: false,
                        isNestable: false,
                    }),
                ]),
            )
            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: mobileListId,
                        }),
                    ),
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.INBOX,
                        }),
                    ),
                ]),
            )

            await migrations['staticize-mobile-list-id'](migrationProps)

            expect(
                await migrationProps.db.table('customLists').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.MOBILE,
                        id: SPECIAL_LIST_IDS.MOBILE, // This should have changed
                        isDeletable: false,
                        isNestable: false,
                    }),
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.INBOX,
                        id: SPECIAL_LIST_IDS.INBOX,
                        isDeletable: false,
                        isNestable: false,
                    }),
                ]),
            )
            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.MOBILE, // This should have changed
                        }),
                    ),
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.INBOX,
                        }),
                    ),
                ]),
            )
        })

        it('should be create a new mobile list with static ID if never existed to start with', async () => {
            const { migrationProps } = await setupTest()

            await migrationProps.db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                name: SPECIAL_LIST_NAMES.INBOX,
                id: SPECIAL_LIST_IDS.INBOX,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })

            for (const testPageUrl of testPageUrls) {
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: SPECIAL_LIST_IDS.INBOX,
                    createdAt: new Date(),
                })
            }

            expect(
                await migrationProps.db.table('customLists').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.INBOX,
                        id: SPECIAL_LIST_IDS.INBOX,
                        isDeletable: false,
                        isNestable: false,
                    }),
                ]),
            )
            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.INBOX,
                        }),
                    ),
                ]),
            )

            await migrations['staticize-mobile-list-id'](migrationProps)

            expect(
                await migrationProps.db.table('customLists').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.MOBILE, // This should now exist
                        id: SPECIAL_LIST_IDS.MOBILE,
                        isDeletable: false,
                        isNestable: false,
                    }),
                    expect.objectContaining({
                        name: SPECIAL_LIST_NAMES.INBOX,
                        id: SPECIAL_LIST_IDS.INBOX,
                        isDeletable: false,
                        isNestable: false,
                    }),
                ]),
            )
            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(
                expect.arrayContaining([
                    ...testPageUrls.map((testPageUrl) =>
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.INBOX,
                        }),
                    ),
                ]),
            )
        })

        it('should not touch data if mobile list with static ID existed all along', async () => {
            const { migrationProps } = await setupTest()

            await migrationProps.db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.MOBILE,
                name: SPECIAL_LIST_NAMES.MOBILE,
                id: SPECIAL_LIST_IDS.MOBILE,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })

            await migrationProps.db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                name: SPECIAL_LIST_NAMES.INBOX,
                id: SPECIAL_LIST_IDS.INBOX,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })

            for (const testPageUrl of testPageUrls) {
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: SPECIAL_LIST_IDS.INBOX,
                    createdAt: new Date(),
                })
            }

            const runExpectedDataCheck = async () => {
                expect(
                    await migrationProps.db.table('customLists').toArray(),
                ).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            name: SPECIAL_LIST_NAMES.MOBILE,
                            id: SPECIAL_LIST_IDS.MOBILE, // This should have changed
                            isDeletable: false,
                            isNestable: false,
                        }),
                        expect.objectContaining({
                            name: SPECIAL_LIST_NAMES.INBOX,
                            id: SPECIAL_LIST_IDS.INBOX,
                            isDeletable: false,
                            isNestable: false,
                        }),
                    ]),
                )
                expect(
                    await migrationProps.db.table('pageListEntries').toArray(),
                ).toEqual(
                    expect.arrayContaining([
                        ...testPageUrls.map((testPageUrl) =>
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: SPECIAL_LIST_IDS.MOBILE, // This should have changed
                            }),
                        ),
                        ...testPageUrls.map((testPageUrl) =>
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: SPECIAL_LIST_IDS.INBOX,
                            }),
                        ),
                    ]),
                )
            }

            // Nothing should change pre and post migration
            await runExpectedDataCheck()
            await migrations['staticize-mobile-list-id'](migrationProps)
            await runExpectedDataCheck()
        })
    })
})
