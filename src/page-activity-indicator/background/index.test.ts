import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import * as DATA from './index.test.data'
import {
    sharedListEntryToFollowedListEntry,
    sharedListToFollowedList,
} from './utils'
import type { FollowedListEntry } from './types'
import { FOLLOWED_LIST_SYNC_ALARM_NAME } from '../constants'

const calcExpectedLists = (
    expectedListIds: Set<AutoPk>,
    opts?: { lastSync?: number },
) =>
    DATA.sharedLists
        .filter((list) => expectedListIds.has(list.id))
        .map((list) =>
            sharedListToFollowedList(list, { lastSync: opts?.lastSync }),
        )

const calcExpectedListEntries = (
    expectedListIds: Set<AutoPk>,
    opts?: { extraEntries?: FollowedListEntry[] },
) => {
    return expect.arrayContaining([
        ...Object.entries(DATA.listEntries).flatMap(([sharedList, entries]) =>
            expectedListIds.has(Number(sharedList))
                ? entries.map((entry) =>
                      sharedListEntryToFollowedListEntry(
                          {
                              ...entry,
                              id: entry.id,
                              sharedList: Number(sharedList),
                          },
                          {
                              id: expect.any(Number),
                              hasAnnotationsFromOthers: DATA.annotationListEntries[
                                  sharedList
                              ]?.reduce(
                                  (acc, curr) =>
                                      acc ||
                                      curr.normalizedPageUrl ===
                                          entry.normalizedUrl,
                                  false,
                              ),
                          },
                      ),
                  )
                : [],
        ),
        ...(opts?.extraEntries ?? []),
    ])
}

const createExpectedListEntry = (
    entry: any,
    sharedList: AutoPk,
    hasAnnotationsFromOthers: boolean,
) =>
    sharedListEntryToFollowedListEntry(
        { ...entry, sharedList },
        { hasAnnotationsFromOthers, id: expect.any(Number) },
    )

async function setupTest(opts: {
    skipAuth?: boolean
    testData?: {
        ownLists?: boolean
        follows?: boolean
    }
}) {
    const context = await setupBackgroundIntegrationTest()

    if (!opts?.skipAuth) {
        await context.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
    }

    if (opts?.testData) {
        const { manager } = context.serverStorage

        await Promise.all(
            DATA.sharedLists
                .filter(
                    (data) =>
                        opts.testData.ownLists ||
                        data.creator !== DATA.userReferenceA.id,
                )
                .map((data) =>
                    manager.collection('sharedList').createObject(data),
                ),
        )

        await Promise.all(
            Object.entries(DATA.listEntries).flatMap(([sharedList, entries]) =>
                entries.map((data) =>
                    manager.collection('sharedListEntry').createObject({
                        ...data,
                        sharedList: Number(sharedList),
                    }),
                ),
            ),
        )

        await Promise.all(
            Object.values(DATA.annotationListEntries).flatMap((entries) =>
                entries.map((data) =>
                    manager
                        .collection('sharedAnnotationListEntry')
                        .createObject(data),
                ),
            ),
        )

        if (opts.testData.follows) {
            await Promise.all(
                DATA.activityFollows.map(async (data) => {
                    const exists = await manager
                        .collection('sharedList')
                        .findObject({ id: Number(data.objectId) })
                    const listData = DATA.sharedLists.find(
                        (list) => list.id === Number(data.objectId),
                    )
                    if (!exists && listData) {
                        await manager
                            .collection('sharedList')
                            .createObject(listData)
                    }
                    await manager.collection('activityFollow').createObject({
                        ...data,
                        objectId: Number(data.objectId),
                    })
                }),
            )
        }
    }

    return { ...context }
}

describe('Page activity indicator background module tests', () => {
    it('should schedule periodic sync list entries alarm', async () => {
        // TODO: fix this test to work with the Alarms API
        const { backgroundModules } = await setupTest({})

        expect(backgroundModules.jobScheduler.scheduler['jobs'].size).toBe(0)
        // await backgroundModules.pageActivityIndicator.setup()
        expect(backgroundModules.jobScheduler.scheduler['jobs'].size).toBe(1)
        expect(
            backgroundModules.jobScheduler.scheduler['jobs'].get(
                FOLLOWED_LIST_SYNC_ALARM_NAME,
            ),
        ).toEqual({
            name: FOLLOWED_LIST_SYNC_ALARM_NAME,
            periodInMinutes: 2,
            job:
                backgroundModules.pageActivityIndicator[
                    'syncFollowedListEntriesWithNewActivity'
                ],
        })
    })

    it('should be able to derive page activity status from stored followedLists data', async () => {
        const { backgroundModules, serverStorage } = await setupTest({
            testData: { follows: true, ownLists: true },
        })

        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/a'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/b'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/c'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })

        await backgroundModules.pageActivityIndicator.syncFollowedLists()
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/a'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/b'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/c'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })

        await backgroundModules.pageActivityIndicator.syncFollowedListEntries({
            now: 1,
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/a'),
        ).toEqual({
            status: 'has-annotations',
            remoteListIds: [DATA.sharedLists[0].id],
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/b'),
        ).toEqual({
            status: 'no-annotations',
            remoteListIds: [DATA.sharedLists[0].id],
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/c'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })

        // Delete annotations on the server, re-sync, then assert the status changes
        await serverStorage.manager
            .collection('sharedAnnotationListEntry')
            .deleteObjects({})

        await backgroundModules.pageActivityIndicator.syncFollowedListEntries({
            now: 2,
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/a'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] }) // This has no-activity as the entries are created by the current user + no annotations from other users
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/b'),
        ).toEqual({
            status: 'no-annotations',
            remoteListIds: [DATA.sharedLists[0].id],
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/c'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })

        // Re-add an annotation from another user to test.com/b to ensure it flips status from { status: 'no-annotations', remoteListIds: [] } to { status: 'has-annotations', remoteListIds: [] }
        await serverStorage.manager
            .collection('sharedAnnotationListEntry')
            .createObject({
                ...DATA.annotationListEntries[DATA.sharedLists[0].id][1],
                normalizedPageUrl: 'test.com/b',
            })

        await backgroundModules.pageActivityIndicator.syncFollowedListEntries({
            now: 2,
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/a'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/b'),
        ).toEqual({
            status: 'has-annotations',
            remoteListIds: [DATA.sharedLists[0].id],
        })
        expect(
            await backgroundModules.pageActivityIndicator[
                'getPageActivityStatus'
            ]('https://test.com/c'),
        ).toEqual({ status: 'no-activity', remoteListIds: [] })
    })

    it('should be able to delete all followedList and followedListEntries in one swoop', async () => {
        const { backgroundModules, storageManager } = await setupTest({
            testData: { follows: true, ownLists: true },
        })

        const expectedListIds = new Set([
            DATA.sharedLists[0].id,
            DATA.sharedLists[1].id,
            DATA.sharedLists[3].id,
        ])

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedLists()
        await backgroundModules.pageActivityIndicator.syncFollowedListEntries({
            now: 1,
        })

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(expectedListIds))

        await backgroundModules.pageActivityIndicator.deleteAllFollowedListsData()

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])
    })

    describe('pull sync followed lists tests', () => {
        it('should do nothing when not logged in', async () => {
            const { backgroundModules, storageManager } = await setupTest({
                skipAuth: true,
                testData: { follows: true, ownLists: true },
            })

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])
        })

        it('should do nothing when no owned or followed sharedLists', async () => {
            const { backgroundModules, storageManager } = await setupTest({})

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])
        })

        it('should create followedList and followedListEntries based on owned sharedLists and their entries', async () => {
            const { backgroundModules, storageManager } = await setupTest({
                testData: { ownLists: true },
            })

            const ownListIds = new Set(
                DATA.sharedLists
                    .filter((list) => list.creator === DATA.userReferenceA.id)
                    .map((list) => list.id),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(ownListIds))

            // Do it again to assert idempotency
            await backgroundModules.pageActivityIndicator.syncFollowedLists()
            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(ownListIds))
        })

        it('should create followedListEntries based on sharedListEntries created after lastSync time', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const ownListIds = new Set(
                DATA.sharedLists
                    .filter((list) => list.creator === DATA.userReferenceA.id)
                    .map((list) => list.id),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(ownListIds))

            // Update lastSync time for one followedList, then create two new sharedListEntries: one pre-lastSync time, one post
            const sharedList = DATA.sharedLists[0].id
            await storageManager
                .collection('followedList')
                .updateOneObject({ sharedList }, { lastSync: 2 })
            const newListEntries = [
                {
                    id: 'test-shared-list-entry-a',
                    sharedList,
                    creator: DATA.users[0].id,
                    normalizedUrl: 'test.com/c',
                    originalUrl: 'https://test.com/c',
                    createdWhen: 1,
                    updatedWhen: 1,
                },
                {
                    id: 'test-shared-list-entry-b',
                    sharedList,
                    creator: DATA.users[0].id,
                    normalizedUrl: 'test.com/d',
                    originalUrl: 'https://test.com/d',
                    createdWhen: 4,
                    updatedWhen: 4,
                },
            ]
            for (const entry of newListEntries) {
                await serverStorage.manager
                    .collection('sharedListEntry')
                    .createObject(entry)
            }

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([
                sharedListToFollowedList(DATA.sharedLists[0], { lastSync: 2 }),
                sharedListToFollowedList(DATA.sharedLists[1], { lastSync: 1 }),
            ])

            // The entry updated post-lastSync time should now be there, but not the one pre-lastSync time
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedListEntries(ownListIds, {
                    extraEntries: [
                        sharedListEntryToFollowedListEntry(newListEntries[1], {
                            id: expect.any(Number),
                        }),
                    ],
                }),
            )
        })

        it('should set hasAnnotations flag on existing followedListEntry if new annotation from another user exists on resync', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const ownListIds = new Set(
                DATA.sharedLists
                    .filter((list) => list.creator === DATA.userReferenceA.id)
                    .map((list) => list.id),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][1],
                    DATA.sharedLists[1].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][0],
                    DATA.sharedLists[1].id,
                    false,
                ),
            ])

            // Create an annotation list entry for one of the existing list entries, by different user
            await serverStorage.manager
                .collection('sharedAnnotationListEntry')
                .createObject({
                    creator: DATA.users[2].id,
                    sharedList: DATA.sharedLists[1].id,
                    normalizedPageUrl: 'test.com/a',
                    updatedWhen: 1,
                    createdWhen: 1,
                    uploadedWhen: 1,
                })

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([
                sharedListToFollowedList(DATA.sharedLists[0], { lastSync: 1 }),
                sharedListToFollowedList(DATA.sharedLists[1], { lastSync: 2 }),
            ])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][1],
                    DATA.sharedLists[1].id,
                    false,
                ),
                createExpectedListEntry(
                    {
                        ...DATA.listEntries[DATA.sharedLists[1].id][0],
                        updatedWhen: 2,
                    },
                    DATA.sharedLists[1].id,
                    true,
                ),
            ])

            // And another one
            await serverStorage.manager
                .collection('sharedAnnotationListEntry')
                .createObject({
                    creator: DATA.users[2].id,
                    sharedList: DATA.sharedLists[1].id,
                    normalizedPageUrl: 'test.com/b',
                    updatedWhen: 3,
                    createdWhen: 3,
                    uploadedWhen: 3,
                })

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 3 },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    {
                        ...DATA.listEntries[DATA.sharedLists[1].id][1],
                        updatedWhen: 3,
                    },
                    DATA.sharedLists[1].id,
                    true,
                ),
                createExpectedListEntry(
                    {
                        ...DATA.listEntries[DATA.sharedLists[1].id][0],
                        updatedWhen: 2,
                    },
                    DATA.sharedLists[1].id,
                    true,
                ),
            ])

            // Now delete them, to ensure it works the other way around
            await serverStorage.manager
                .collection('sharedAnnotationListEntry')
                .deleteObjects({
                    sharedList: DATA.sharedLists[1].id,
                })

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 4 },
            )

            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    {
                        ...DATA.listEntries[DATA.sharedLists[1].id][1],
                        updatedWhen: 4,
                    },
                    DATA.sharedLists[1].id,
                    false,
                ),
                createExpectedListEntry(
                    {
                        ...DATA.listEntries[DATA.sharedLists[1].id][0],
                        updatedWhen: 4,
                    },
                    DATA.sharedLists[1].id,
                    false,
                ),
            ])
        })

        it('should NOT set hasAnnotations flag on existing followedListEntry if new annotation from CURRENT user exists on resync', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const ownListIds = new Set(
                DATA.sharedLists
                    .filter((list) => list.creator === DATA.userReferenceA.id)
                    .map((list) => list.id),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][1],
                    DATA.sharedLists[1].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][0],
                    DATA.sharedLists[1].id,
                    false,
                ),
            ])

            // Create an annotation list entry for one of the existing list entries, by current user (should not change status)
            await serverStorage.manager
                .collection('sharedAnnotationListEntry')
                .createObject({
                    creator: DATA.users[0].id,
                    sharedList: DATA.sharedLists[1].id,
                    normalizedPageUrl: 'test.com/a',
                    updatedWhen: 1,
                    createdWhen: 1,
                    uploadedWhen: 1,
                })

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][1],
                    DATA.sharedLists[0].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[0].id][0],
                    DATA.sharedLists[0].id,
                    true,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][1],
                    DATA.sharedLists[1].id,
                    false,
                ),
                createExpectedListEntry(
                    DATA.listEntries[DATA.sharedLists[1].id][0],
                    DATA.sharedLists[1].id,
                    false,
                ),
            ])
        })

        it('should delete followedList and followedListEntries when a sharedList no longer exists', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const ownListIds = new Set(
                DATA.sharedLists
                    .filter((list) => list.creator === DATA.userReferenceA.id)
                    .map((list) => list.id),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(ownListIds))

            // Delete an owned sharedList so that sync will result in removal of local data
            await serverStorage.manager
                .collection('sharedList')
                .deleteOneObject({ id: DATA.sharedLists[0].id })
            ownListIds.delete(DATA.sharedLists[0].id)

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(ownListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(ownListIds))
        })

        it('should create followedList and followedListEntries based on followed sharedLists and their entries', async () => {
            const { backgroundModules, storageManager } = await setupTest({
                testData: { follows: true },
            })

            const followedListIds = new Set<AutoPk>(
                DATA.activityFollows.map((follow) => Number(follow.objectId)),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()
            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(followedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(followedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(followedListIds))
        })

        it('should delete followedList and followedListEntries when a sharedList is no longer followed', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { follows: true },
            })

            const followedListIds = new Set<AutoPk>(
                DATA.activityFollows.map((follow) => Number(follow.objectId)),
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()
            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(followedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(followedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(followedListIds))

            // Delete a follow so that sync will result in removal of local data
            await serverStorage.manager
                .collection('activityFollow')
                .deleteObjects({
                    objectId: Number(DATA.activityFollows[2].objectId),
                })
            followedListIds.delete(Number(DATA.activityFollows[2].objectId))

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(followedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(followedListIds))

            // Do it again to assert idempotency
            await backgroundModules.pageActivityIndicator.syncFollowedLists()
            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(followedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(followedListIds))
        })

        it('should create followedList and followedListEntries based on both owned and followed sharedLists and their entries', async () => {
            const { backgroundModules, storageManager } = await setupTest({
                testData: { follows: true, ownLists: true },
            })

            const expectedListIds = new Set([
                DATA.sharedLists[0].id,
                DATA.sharedLists[1].id,
                DATA.sharedLists[3].id,
            ])

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(expectedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))

            // Do it again to assert idempotency
            await backgroundModules.pageActivityIndicator.syncFollowedLists()
            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 2 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))
        })

        it('should delete followedList and followedListEntries when a sharedList is no longer followed and another sharedList no longer exists', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
            } = await setupTest({
                testData: { follows: true, ownLists: true },
            })

            const expectedListIds = new Set([
                DATA.sharedLists[0].id,
                DATA.sharedLists[1].id,
                DATA.sharedLists[3].id,
            ])

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(expectedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))

            // Delete a follow + owned sharedList so that sync will result in removal of local data
            await serverStorage.manager
                .collection('activityFollow')
                .deleteObjects({
                    objectId: Number(DATA.activityFollows[2].objectId),
                })
            await serverStorage.manager
                .collection('sharedList')
                .deleteOneObject({ id: DATA.sharedLists[0].id })
            expectedListIds.delete(Number(DATA.activityFollows[2].objectId))
            expectedListIds.delete(DATA.sharedLists[0].id)

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))

            // Do it again to assert idempotency
            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))
        })

        it('should be able to sync new entries of only those followed lists which have had activity since last sync', async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage,
                fetch,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const expectedListIds = new Set([
                DATA.sharedLists[0].id,
                DATA.sharedLists[1].id,
            ])

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(expectedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedListEntries(
                { now: 1 },
            )

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))

            // Add newer entry for one list + mock out Cloudflare fetch to return newer activity timestamp for that list
            const newSharedListEntry = {
                id: 'test-shared-list-entry-a',
                creator: DATA.users[1].id,
                sharedList: DATA.sharedLists[0].id,
                normalizedUrl: 'test.com/c',
                originalUrl: 'https://test.com/c',
                createdWhen: 2,
                updatedWhen: 2,
            }
            await serverStorage.manager
                .collection('sharedListEntry')
                .createObject(newSharedListEntry)
            fetch.mock('*', 200, {
                response: [[DATA.sharedLists[0].id.toString(), 2]],
                sendAsJson: true,
            })

            expect(fetch.calls()).toEqual([])

            await backgroundModules.pageActivityIndicator[
                'syncFollowedListEntriesWithNewActivity'
            ]({ now: 3 })

            expect(fetch.calls().length).toBe(1)
            // TODO: This is the actual req. It does show up, but jest assert fails saying "Received: serializes to the same string"
            // .toEqual([
            //         LIST_TIMESTAMP_WORKER_URLS.staging + '/',
            //         {
            //             method: 'POST',
            //             body: JSON.stringify({
            //                 sharedListIds: [...expectedListIds].map((id) =>
            //                     id.toString(),
            //                 ),
            //             }),
            //         },
            //     ],
            // ])

            // Assert only one list had lastSync updated
            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([
                sharedListToFollowedList(DATA.sharedLists[0], { lastSync: 3 }),
                sharedListToFollowedList(DATA.sharedLists[1], { lastSync: 1 }),
            ])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedListEntries(expectedListIds, {
                    extraEntries: [
                        sharedListEntryToFollowedListEntry(newSharedListEntry, {
                            id: expect.any(Number),
                            hasAnnotationsFromOthers: false,
                        }),
                    ],
                }),
            )

            // Let's add an annotation to that new entry, to assert it also can update from just the annotation change
            await serverStorage.manager
                .collection('sharedAnnotationListEntry')
                .createObject({
                    creator: DATA.users[1].id,
                    sharedList: DATA.sharedLists[0].id,
                    normalizedPageUrl: 'test.com/c',
                    updatedWhen: 4,
                    createdWhen: 4,
                    uploadedWhen: 4,
                })
            fetch.mock('*', 200, {
                response: [[DATA.sharedLists[0].id.toString(), 4]],
                overwriteRoutes: true,
                sendAsJson: true,
            })

            expect(fetch.calls().length).toBe(1)

            await backgroundModules.pageActivityIndicator[
                'syncFollowedListEntriesWithNewActivity'
            ]({ now: 5 })

            expect(fetch.calls().length).toBe(2)

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([
                sharedListToFollowedList(DATA.sharedLists[0], { lastSync: 5 }),
                sharedListToFollowedList(DATA.sharedLists[1], { lastSync: 1 }),
            ])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedListEntries(expectedListIds, {
                    extraEntries: [
                        sharedListEntryToFollowedListEntry(
                            { ...newSharedListEntry, updatedWhen: 5 },
                            {
                                id: expect.any(Number),
                                hasAnnotationsFromOthers: true,
                            },
                        ),
                    ],
                }),
            )
        })

        it("should be able to sync entries for newly created followed lists which haven't been synced yet", async () => {
            const {
                backgroundModules,
                storageManager,
                serverStorage: getServerStorage,
                fetch,
            } = await setupTest({
                testData: { ownLists: true },
            })

            const expectedListIds = new Set([
                DATA.sharedLists[0].id,
                DATA.sharedLists[1].id,
            ])

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            await backgroundModules.pageActivityIndicator.syncFollowedLists()

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(
                calcExpectedLists(expectedListIds, { lastSync: undefined }),
            )
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])

            fetch.mock('*', 200, {
                response: [[...expectedListIds].map((id) => [id, 2])],
                sendAsJson: true,
            })

            expect(fetch.calls()).toEqual([])
            await backgroundModules.pageActivityIndicator[
                'syncFollowedListEntriesWithNewActivity'
            ]({ now: 1 })
            expect(fetch.calls().length).toBe(1)

            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 1 }))
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual(calcExpectedListEntries(expectedListIds))
        })
    })
})
