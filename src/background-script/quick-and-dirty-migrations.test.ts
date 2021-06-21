import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-storage/lib/lists/constants'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import range from 'lodash/range'

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
    describe('point-old-mobile-list-entries-to-new', () => {
        it('should modify all list entries pointing to a non-existent list to point to the mobile list', async () => {
            const { migrationProps } = await setupTest()
            const nonExistentListIdA = 99
            const nonExistentListIdB = 98

            // Create new static ID mobile list + some others
            await migrationProps.db.table('customLists').add({
                id: SPECIAL_LIST_IDS.MOBILE,
                name: SPECIAL_LIST_NAMES.MOBILE,
                searchableName: SPECIAL_LIST_NAMES.MOBILE,
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })
            await migrationProps.db.table('customLists').add({
                id: 1,
                name: 'test 1',
                searchableName: 'test 1',
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })
            await migrationProps.db.table('customLists').add({
                id: 2,
                name: 'test 2',
                searchableName: 'test 2',
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })

            // Create some dummy page list entries
            for (const testPageUrl of testPageUrls) {
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: 1,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: 2,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: nonExistentListIdA,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: nonExistentListIdB,
                    createdAt: new Date(),
                })
            }

            const preResult = await migrationProps.db
                .table('pageListEntries')
                .toArray()
            expect(preResult.length).toBe(testPageUrls.length * 4)
            expect(preResult).toEqual(
                expect.arrayContaining(
                    testPageUrls
                        .map((testPageUrl) => [
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: 1,
                            }),
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: 2,
                            }),
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: nonExistentListIdA,
                            }),
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: nonExistentListIdB,
                            }),
                        ])
                        .flat(),
                ),
            )

            await migrations['point-old-mobile-list-entries-to-new'](
                migrationProps,
            )

            const postResult = await migrationProps.db
                .table('pageListEntries')
                .toArray()
            expect(postResult.length).toBe(testPageUrls.length * 3)
            expect(postResult).toEqual(
                expect.arrayContaining(
                    testPageUrls
                        .map((testPageUrl) => [
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: 1,
                            }),
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: 2,
                            }),
                            // This entry should exist for the both entries that pointed to different non-existent lists
                            expect.objectContaining({
                                pageUrl: testPageUrl,
                                fullUrl: 'https://' + testPageUrl,
                                listId: SPECIAL_LIST_IDS.MOBILE,
                            }),
                        ])
                        .flat(),
                ),
            )
        })

        it('should not do anything to data where no list entries point to the old mobile list', async () => {
            const { migrationProps } = await setupTest()

            // Create new static ID mobile list + some others
            await migrationProps.db.table('customLists').add({
                id: SPECIAL_LIST_IDS.MOBILE,
                name: SPECIAL_LIST_NAMES.MOBILE,
                searchableName: SPECIAL_LIST_NAMES.MOBILE,
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })
            await migrationProps.db.table('customLists').add({
                id: 1,
                name: 'test 1',
                searchableName: 'test 1',
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })
            await migrationProps.db.table('customLists').add({
                id: 2,
                name: 'test 2',
                searchableName: 'test 2',
                isDeletable: false,
                isNestable: false,
                createdAt: new Date(),
            })

            // Create some dummy page list entries
            for (const testPageUrl of testPageUrls) {
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: 1,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: 2,
                    createdAt: new Date(),
                })
                await migrationProps.db.table('pageListEntries').add({
                    pageUrl: testPageUrl,
                    fullUrl: 'https://' + testPageUrl,
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    createdAt: new Date(),
                })
            }
            const expected = expect.arrayContaining(
                testPageUrls
                    .map((testPageUrl) => [
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: 1,
                        }),
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: 2,
                        }),
                        expect.objectContaining({
                            pageUrl: testPageUrl,
                            fullUrl: 'https://' + testPageUrl,
                            listId: SPECIAL_LIST_IDS.MOBILE,
                        }),
                    ])
                    .flat(),
            )
            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(expected)

            await migrations['point-old-mobile-list-entries-to-new'](
                migrationProps,
            )

            expect(
                await migrationProps.db.table('pageListEntries').toArray(),
            ).toEqual(expected) // Nothing should have changed
        })
    })

    describe('remove-then-re-add-broken-backup-log-entries', () => {
        it('should remove then re-add any backup log entries for annotationPrivacyLevels with undefined PKs', async () => {
            const { migrationProps } = await setupTest()

            let offset = 0
            const baseTimestamp = Date.now()
            const annotLimitPerPage = 10

            for (const testPageUrl of testPageUrls) {
                for (const _ of range(1, annotLimitPerPage)) {
                    const timestamp = baseTimestamp - offset++

                    await migrationProps.db
                        .table('annotationPrivacyLevels')
                        .add({
                            annotation: testPageUrl + '/#' + timestamp,
                            createdWhen: timestamp,
                            privacyLevel: 100,
                        })

                    await migrationProps.db.table('backupChanges').add({
                        timestamp,
                        collection: 'annotationPrivacyLevels',
                        operation: 'create',
                    })
                }
            }

            offset = 0
            const expectedPrivacyLevels = testPageUrls
                .map((testPageUrl) =>
                    range(1, annotLimitPerPage).map(() => {
                        const timestamp = baseTimestamp - offset++
                        return expect.objectContaining({
                            annotation: testPageUrl + '/#' + timestamp,
                            createdWhen: timestamp,
                            privacyLevel: 100,
                        })
                    }),
                )
                .flat()

            const privacyLevelsPre = await migrationProps.db
                .table('annotationPrivacyLevels')
                .toArray()
            expect(privacyLevelsPre).toEqual(expectedPrivacyLevels)

            expect(
                await migrationProps.db.table('backupChanges').toArray(),
            ).toEqual(
                privacyLevelsPre.map(() => ({
                    timestamp: expect.any(Number),
                    collection: 'annotationPrivacyLevels',
                    operation: 'create',
                })),
            )

            await migrations['remove-then-re-add-broken-backup-log-entries'](
                migrationProps,
            )

            const privacyLevelsPost = await migrationProps.db
                .table('annotationPrivacyLevels')
                .toArray()

            // These should be untouched
            expect(privacyLevelsPost).toEqual(expectedPrivacyLevels)

            expect(
                await migrationProps.db.table('backupChanges').toArray(),
            ).toEqual(
                privacyLevelsPost.map(({ id }) => ({
                    timestamp: expect.any(Number),
                    collection: 'annotationPrivacyLevels',
                    operation: 'create',
                    objectPk: id, // This should now exist
                })),
            )
        })

        it('should not touch backup log entries if PKs all exist as expected', async () => {
            const { migrationProps } = await setupTest()

            let offset = 0
            const baseTimestamp = Date.now()
            const annotLimitPerPage = 10

            for (const testPageUrl of testPageUrls) {
                for (const _ of range(1, annotLimitPerPage)) {
                    const timestamp = baseTimestamp - offset++

                    const objectPk = await migrationProps.db
                        .table('annotationPrivacyLevels')
                        .add({
                            annotation: testPageUrl + '/#' + timestamp,
                            createdWhen: timestamp,
                            privacyLevel: 100,
                        })

                    await migrationProps.db.table('backupChanges').add({
                        timestamp,
                        collection: 'annotationPrivacyLevels',
                        operation: 'create',
                        objectPk,
                    })
                }
            }

            offset = 0
            const expectedPrivacyLevels = testPageUrls
                .map((testPageUrl) =>
                    range(1, annotLimitPerPage).map(() => {
                        const timestamp = baseTimestamp - offset++
                        return expect.objectContaining({
                            annotation: testPageUrl + '/#' + timestamp,
                            createdWhen: timestamp,
                            privacyLevel: 100,
                        })
                    }),
                )
                .flat()

            const privacyLevels = await migrationProps.db
                .table('annotationPrivacyLevels')
                .toArray()
            const expectedBackupLog = expect.arrayContaining(
                privacyLevels.map(({ id }) => ({
                    timestamp: expect.any(Number),
                    collection: 'annotationPrivacyLevels',
                    operation: 'create',
                    objectPk: id,
                })),
            )

            expect(privacyLevels).toEqual(expectedPrivacyLevels)
            expect(
                await migrationProps.db.table('backupChanges').toArray(),
            ).toEqual(expectedBackupLog)

            await migrations['remove-then-re-add-broken-backup-log-entries'](
                migrationProps,
            )

            // These should be untouched
            expect(
                await migrationProps.db
                    .table('annotationPrivacyLevels')
                    .toArray(),
            ).toEqual(expectedPrivacyLevels)

            // These should also be untouched
            expect(
                await migrationProps.db.table('backupChanges').toArray(),
            ).toEqual(expectedBackupLog)
        })
    })

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
