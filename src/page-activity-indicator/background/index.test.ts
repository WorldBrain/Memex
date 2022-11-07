import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import * as DATA from './index.test.data'
import {
    sharedListEntryToFollowedListEntry,
    sharedListToFollowedList,
} from './utils'
import type { FollowedListEntry } from './types'

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
                              sharedList: Number(sharedList),
                          },
                          { id: expect.any(Number) },
                      ),
                  )
                : [],
        ),
        ...(opts?.extraEntries ?? []),
    ])
}

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
        const { manager } = await context.getServerStorage()

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
    it('should do nothing when not logged in', async () => {
        const { backgroundModules, storageManager } = await setupTest({
            skipAuth: true,
            testData: { follows: true, ownLists: true },
        })

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
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
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
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
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds, { lastSync: undefined }))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(ownListIds))

        // Do it again to assert idempotency
        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds, { lastSync: 2 }))
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
            getServerStorage,
        } = await setupTest({
            testData: { ownLists: true },
        })

        const ownListIds = new Set(
            DATA.sharedLists
                .filter((list) => list.creator === DATA.userReferenceA.id)
                .map((list) => list.id),
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds))

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
        const serverStorage = await getServerStorage()
        const newListEntries = [
            {
                sharedList,
                creator: DATA.users[0].id,
                normalizedUrl: 'test.com/c',
                originalUrl: 'https://test.com/c',
                createdWhen: 1,
                updatedWhen: 1,
            },
            {
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

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

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

    it('should delete followedList and followedListEntries when a sharedList no longer exists', async () => {
        const {
            backgroundModules,
            storageManager,
            getServerStorage,
        } = await setupTest({
            testData: { ownLists: true },
        })

        const ownListIds = new Set(
            DATA.sharedLists
                .filter((list) => list.creator === DATA.userReferenceA.id)
                .map((list) => list.id),
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds))

        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(ownListIds))

        // Delete an owned sharedList so that sync will result in removal of local data
        const serverStorage = await getServerStorage()
        await serverStorage.manager
            .collection('sharedList')
            .deleteOneObject({ id: DATA.sharedLists[0].id })
        ownListIds.delete(DATA.sharedLists[0].id)

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds, { lastSync: 2 }))
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
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(followedListIds))

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
            getServerStorage,
        } = await setupTest({
            testData: { follows: true },
        })

        const followedListIds = new Set<AutoPk>(
            DATA.activityFollows.map((follow) => Number(follow.objectId)),
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(followedListIds))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(followedListIds))

        // Delete a follow so that sync will result in removal of local data
        const serverStorage = await getServerStorage()
        await serverStorage.manager.collection('activityFollow').deleteObjects({
            objectId: Number(DATA.activityFollows[2].objectId),
        })
        followedListIds.delete(Number(DATA.activityFollows[2].objectId))

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(followedListIds, { lastSync: 2 }))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(followedListIds))

        // Do it again to assert idempotency
        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 3 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(followedListIds, { lastSync: 3 }))
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
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(expectedListIds))

        // Do it again to assert idempotency
        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 2 }))
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
            getServerStorage,
        } = await setupTest({
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

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(expectedListIds))

        // Delete a follow + owned sharedList so that sync will result in removal of local data
        const serverStorage = await getServerStorage()
        await serverStorage.manager.collection('activityFollow').deleteObjects({
            objectId: Number(DATA.activityFollows[2].objectId),
        })
        await serverStorage.manager
            .collection('sharedList')
            .deleteOneObject({ id: DATA.sharedLists[0].id })
        expectedListIds.delete(Number(DATA.activityFollows[2].objectId))
        expectedListIds.delete(DATA.sharedLists[0].id)

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 2 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 2 }))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(expectedListIds))

        // Do it again to assert idempotency
        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { now: 3 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(expectedListIds, { lastSync: 3 }))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(expectedListIds))
    })
})
