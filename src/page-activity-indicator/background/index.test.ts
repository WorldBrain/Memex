import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import * as DATA from './index.test.data'
import {
    sharedListEntryToFollowedListEntry,
    sharedListToFollowedList,
} from './utils'

const calcExpectedLists = (wantedListIds?: Set<AutoPk>) =>
    DATA.sharedLists
        .filter((list) => wantedListIds?.has(list.id) ?? true)
        .map(sharedListToFollowedList)
const calcExpectedListEntries = (wantedListIds?: Set<AutoPk>) =>
    Object.entries(DATA.listEntries).flatMap(([sharedList, entries]) =>
        wantedListIds?.has(sharedList) ?? true
            ? entries.map((entry) =>
                  sharedListEntryToFollowedListEntry({
                      ...entry,
                      sharedList,
                  }),
              )
            : [],
    )

async function setupTest(opts: {
    testData?: {
        ownLists?: boolean
        follows?: boolean
    }
}) {
    const context = await setupBackgroundIntegrationTest()

    await context.authService.loginWithEmailAndPassword(
        TEST_USER.email,
        'password',
    )

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
                    manager
                        .collection('sharedListEntry')
                        .createObject({ ...data, sharedList }),
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
                DATA.activityFollows.map((data) =>
                    manager.collection('activityFollow').createObject(data),
                ),
            )
        }
    }

    return { ...context }
}

describe('Page activity indicator background module tests', () => {
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
            { from: 1 },
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
            { from: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds))

        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(ownListIds))
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
            { from: 1 },
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
            { from: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(ownListIds))
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
            DATA.activityFollows.map((follow) => follow.objectId),
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
            { from: 1 },
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
            DATA.activityFollows.map((follow) => follow.objectId),
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
            { from: 1 },
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
        await serverStorage.manager
            .collection('activityFollow')
            .deleteOneObject({ objectId: DATA.activityFollows[2].objectId })
        followedListIds.delete(DATA.activityFollows[2].objectId)

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { from: 1 },
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

    it('should create followedList and followedListEntries based on both owned and followed sharedLists and their entries', async () => {
        const { backgroundModules, storageManager } = await setupTest({
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
            { from: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists())
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries())
    })

    it('should delete followedList and followedListEntries when a sharedList is no longer followed and another no longer exists', async () => {
        const {
            backgroundModules,
            storageManager,
            getServerStorage,
        } = await setupTest({
            testData: { follows: true, ownLists: true },
        })

        const listIds = new Set(DATA.sharedLists.map((list) => list.id))

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual([])
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual([])

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { from: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists())
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries())

        // Delete a follow + owned sharedList so that sync will result in removal of local data
        const serverStorage = await getServerStorage()
        await serverStorage.manager
            .collection('activityFollow')
            .deleteOneObject({ objectId: DATA.activityFollows[2].objectId })
        await serverStorage.manager
            .collection('sharedList')
            .deleteOneObject({ id: DATA.sharedLists[0].id })
        listIds.delete(DATA.activityFollows[2].objectId)
        listIds.delete(DATA.sharedLists[0].id)

        await backgroundModules.pageActivityIndicator.syncFollowedListsAndEntries(
            { from: 1 },
        )

        expect(
            await storageManager.collection('followedList').findAllObjects({}),
        ).toEqual(calcExpectedLists(listIds))
        expect(
            await storageManager
                .collection('followedListEntry')
                .findAllObjects({}),
        ).toEqual(calcExpectedListEntries(listIds))
    })
})
