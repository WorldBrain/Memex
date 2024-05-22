import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY } from 'src/activity-indicator/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

describe('Dashboard Refactor misc logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    // TODO: Fix this test

    it(
        'should be able to load local lists during init logic',
        async ({ device }) => {
            device.backgroundModules.backupModule.isAutomaticBackupEnabled = async () =>
                false
            device.backgroundModules.backupModule.getBackupTimes = async () => ({
                lastBackup: null,
                nextBackup: null,
            })
            const { searchResults, annotationsCache } = await setupTest(
                device,
                {
                    withAuth: true,
                },
            )

            const creator: UserReference = {
                type: 'user-reference',
                id: TEST_USER.id,
            }
            const listNames = ['testA', 'testB']
            const testDescription = 'this is a very interesting list'
            const listIds = await device.backgroundModules.customLists.createCustomLists(
                { names: listNames },
            )
            await device.backgroundModules.customLists.storage.createListDescription(
                { listId: listIds[0], description: testDescription },
            )

            expect(searchResults.state.listsSidebar.listLoadState).toEqual(
                'pristine',
            )
            expect(searchResults.state.listsSidebar.lists.byId).toEqual({})
            expect(searchResults.state.listsSidebar.lists.allIds).toEqual([])

            await searchResults.processEvent('init', null)

            expect(searchResults.state.listsSidebar.listLoadState).toEqual(
                'success',
            )
            expect(annotationsCache.lists.byId).toEqual({
                ['0']: expect.objectContaining({
                    localId: listIds[0],
                    name: listNames[0],
                    creator,
                    remoteId: undefined,
                    description: testDescription,
                }),
                ['1']: expect.objectContaining({
                    localId: listIds[1],
                    name: listNames[1],
                    creator,
                    remoteId: undefined,
                    description: undefined,
                }),
            })
            expect(annotationsCache.lists.allIds.length).toBe(2)
        },
        { shouldSkip: true },
    )

    // TODO: Fix this test
    it(
        'should be able to load local + followed + joined lists during init logic',
        async ({ device }) => {
            device.backgroundModules.backupModule.isAutomaticBackupEnabled = async () =>
                false
            device.backgroundModules.backupModule.getBackupTimes = async () => ({
                lastBackup: null,
                nextBackup: null,
            })
            const { searchResults } = await setupTest(device, {
                withAuth: true,
            })

            const {
                modules: { contentSharing },
            } = device.serverStorage
            const user = await device.authService.getCurrentUser()
            const userReferenceA: UserReference = {
                id: user.id,
                type: 'user-reference',
            }
            const userReferenceB: UserReference = {
                id: 'test-user-2',
                type: 'user-reference',
            }

            const sharedListADescription = 'test A description'
            const sharedListARef = await contentSharing.createSharedList({
                userReference: userReferenceB,
                listData: {
                    title: 'testA',
                    description: sharedListADescription,
                },
            })
            // This one just exists, though not following it
            await contentSharing.createSharedList({
                userReference: userReferenceB,
                listData: { title: 'testB' },
            })
            const sharedListCRef = await contentSharing.createSharedList({
                userReference: userReferenceB,
                listData: { title: 'testC' },
            })

            // await activityFollows.storeFollow({
            //     objectId: sharedListARef.id as string,
            //     collection: 'sharedList',
            //     userReference: userReferenceA,
            // })
            // await activityFollows.storeFollow({
            //     objectId: sharedListCRef.id as string,
            //     collection: 'sharedList',
            //     userReference: userReferenceA,
            // })

            await device.backgroundModules.pageActivityIndicator.createFollowedList(
                {
                    creator: userReferenceB.id,
                    name: 'testA',
                    sharedList: sharedListARef.id,
                },
            )
            await device.backgroundModules.pageActivityIndicator.createFollowedList(
                {
                    creator: userReferenceB.id,
                    name: 'testC',
                    sharedList: sharedListCRef.id,
                },
            )

            // Create local data for list A, simulating a joined list (followed + local data)
            await device.storageManager.collection('customLists').createObject({
                id: 1,
                name: 'testA',
                searchableName: 'testA',
                createdAt: new Date(),
            })
            await device.storageManager
                .collection('customListDescriptions')
                .createObject({
                    id: 1,
                    listId: 1,
                    description: sharedListADescription,
                })
            await device.storageManager
                .collection('sharedListMetadata')
                .createObject({
                    localId: 1,
                    remoteId: sharedListARef.id,
                })

            // Create a purely local list
            await device.storageManager.collection('customLists').createObject({
                id: 2,
                name: 'testD',
                searchableName: 'testD',
                createdAt: new Date(),
            })

            const [
                sharedListAData,
                sharedListCData,
            ] = await contentSharing.getListsByReferences([
                sharedListARef,
                sharedListCRef,
            ])

            expect(searchResults.state.listsSidebar.lists.byId).toEqual({})
            expect(searchResults.state.listsSidebar.listLoadState).toEqual(
                'pristine',
            )

            await searchResults.processEvent('init', null)

            expect(searchResults.state.listsSidebar.lists.byId).toEqual({
                ['0']: expect.objectContaining({
                    localId: 1,
                    remoteId: sharedListARef.id,
                    name: 'testA',
                    description: sharedListADescription,
                    creator: userReferenceB,
                }),
                ['1']: expect.objectContaining({
                    localId: 2,
                    remoteId: undefined,
                    name: 'testD',
                    description: undefined,
                    creator: userReferenceA,
                }),
                ['2']: expect.objectContaining({
                    localId: undefined,
                    remoteId: sharedListCRef.id.toString(),
                    name: 'testC',
                    description: undefined,
                    creator: userReferenceB,
                }),
            })
            expect(searchResults.state.listsSidebar.listLoadState).toEqual(
                'success',
            )
        },
        { shouldSkip: true },
    )
    // TODO: Fix this test
    it(
        'should trigger search during init logic',
        async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                overrideSearchTrigger: true,
            })

            expect(searchResults.logic['searchTriggeredCount']).toBe(0)
            await searchResults.processEvent('init', null)
            expect(searchResults.logic['searchTriggeredCount']).toBe(1)
        },

        { shouldSkip: true },
    )

    // TODO: Fix this test
    it(
        'should hydrate state from local storage during init logic',
        async ({ device }) => {
            const {
                searchResults: searchResultsA,
                logic: logicA,
            } = await setupTest(device, { withAuth: true })

            const now = Date.now()
            await logicA.syncSettings.dashboard.set('listSidebarLocked', false)
            await logicA.syncSettings.dashboard.set(
                'subscribeBannerShownAfter',
                now,
            )
            await logicA.syncSettings.extension.set(
                'areTagsMigratedToSpaces',
                false,
            )
            await logicA['options'].localStorage.set({
                [CLOUD_STORAGE_KEYS.isSetUp]: false,
            })

            expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(
                false,
            )
            expect(
                searchResultsA.state.searchResults.isSubscriptionBannerShown,
            ).toBe(false)
            expect(searchResultsA.state.searchResults.shouldShowTagsUIs).toBe(
                false,
            )
            await searchResultsA.processEvent('init', null)
            expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(
                false,
            )
            expect(
                searchResultsA.state.searchResults.isSubscriptionBannerShown,
            ).toBe(true)
            expect(searchResultsA.state.searchResults.shouldShowTagsUIs).toBe(
                true,
            )

            const {
                searchResults: searchResultsB,
                logic: logicB,
            } = await setupTest(device, { withAuth: true })

            await logicA.syncSettings.dashboard.set('listSidebarLocked', true)
            await logicA.syncSettings.dashboard.set(
                'subscribeBannerShownAfter',
                null,
            )
            await logicA.syncSettings.extension.set(
                'areTagsMigratedToSpaces',
                true,
            )
            await logicB['options'].localStorage.set({
                [CLOUD_STORAGE_KEYS.isSetUp]: true,
            })

            expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(
                false,
            )
            expect(
                searchResultsB.state.searchResults.isSubscriptionBannerShown,
            ).toBe(false)
            expect(searchResultsB.state.searchResults.shouldShowTagsUIs).toBe(
                false,
            )
            await searchResultsB.processEvent('init', null)
            expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(true)
            expect(
                searchResultsB.state.searchResults.isSubscriptionBannerShown,
            ).toBe(false)
            expect(searchResultsB.state.searchResults.shouldShowTagsUIs).toBe(
                false,
            )
        },
        { shouldSkip: true },
    )

    // it('should get sharing access state during init logic', async ({
    //     device,
    // }) => {
    //     const { searchResults: searchResultsA } = await setupTest(device)

    //     device.backgroundModules.auth.remoteFunctions.isAuthorizedForFeature = async () =>
    //         true

    //     expect(searchResultsA.state.searchResults.sharingAccess).toEqual(
    //         'feature-disabled',
    //     )
    //     await searchResultsA.processEvent('init', null)
    //     expect(searchResultsA.state.searchResults.sharingAccess).toEqual(
    //         'sharing-allowed',
    //     )

    //     const { searchResults: searchResultsB } = await setupTest(device)

    //     device.backgroundModules.auth.remoteFunctions.isAuthorizedForFeature = async () =>
    //         false

    //     expect(searchResultsB.state.searchResults.sharingAccess).toEqual(
    //         'feature-disabled',
    //     )
    //     await searchResultsB.processEvent('init', null)
    //     expect(searchResultsB.state.searchResults.sharingAccess).toEqual(
    //         'feature-disabled',
    //     )
    // })

    it(
        'should get current user state during init logic',
        async ({ device }) => {
            const { searchResults: searchResultsA } = await setupTest(device, {
                withAuth: true,
            })

            expect(searchResultsA.state.currentUser).toBeNull()
            await searchResultsA.processEvent('init', null)
            expect(searchResultsA.state.currentUser).toEqual(TEST_USER)

            const { searchResults: searchResultsB } = await setupTest(device, {
                withAuth: false,
            })

            expect(searchResultsB.state.currentUser).toBeNull()
            await searchResultsB.processEvent('init', null)
            expect(searchResultsB.state.currentUser).toEqual(TEST_USER)
        },
        { shouldSkip: true },
    )

    it(
        'should get feed activity status during init logic',
        async ({ device }) => {
            device.backgroundModules.backupModule.isAutomaticBackupEnabled = async () =>
                false
            device.backgroundModules.backupModule.getBackupTimes = async () => ({
                lastBackup: null,
                nextBackup: null,
            })
            device.backgroundModules.activityIndicator.remoteFunctions.checkActivityStatus = async () =>
                'has-unseen'
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            const { searchResults: logicA } = await setupTest(device)
            expect(logicA.state.listsSidebar.hasFeedActivity).toBe(false)
            await logicA.init()
            expect(logicA.state.listsSidebar.hasFeedActivity).toBe(true)

            device.backgroundModules.activityIndicator.remoteFunctions.checkActivityStatus = async () =>
                'all-seen'
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            const { searchResults: logicB } = await setupTest(device)
            expect(logicB.state.listsSidebar.hasFeedActivity).toBe(false)
            await logicB.init()
            expect(logicB.state.listsSidebar.hasFeedActivity).toBe(false)

            device.backgroundModules.activityIndicator.remoteFunctions.checkActivityStatus = async () =>
                'error'
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            const { searchResults: logicC } = await setupTest(device)
            expect(logicC.state.listsSidebar.hasFeedActivity).toBe(false)
            await logicC.init()
            expect(logicC.state.listsSidebar.hasFeedActivity).toBe(false)

            device.backgroundModules.activityIndicator.remoteFunctions.checkActivityStatus = async () =>
                'not-logged-in'
            await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, false)
            const { searchResults: logicD } = await setupTest(device)
            expect(logicD.state.listsSidebar.hasFeedActivity).toBe(false)
            await logicD.init()
            expect(logicD.state.listsSidebar.hasFeedActivity).toBe(false)

            await logicA.cleanup()
            await logicB.cleanup()
            await logicC.cleanup()
            await logicD.cleanup()
        },
        { shouldSkip: true },
    )
})
