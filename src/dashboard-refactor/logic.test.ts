import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'
import { STORAGE_KEYS as CLOUD_STORAGE_KEYS } from 'src/personal-cloud/constants'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY } from 'src/activity-indicator/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

describe('Dashboard Refactor misc logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to load local lists during init logic', async ({
        device,
    }) => {
        device.backgroundModules.backupModule.isAutomaticBackupEnabled = async () =>
            false
        device.backgroundModules.backupModule.getBackupTimes = async () => ({
            lastBackup: null,
            nextBackup: null,
        })
        const { searchResults } = await setupTest(device)

        const listNames = ['testA', 'testB']
        const listIds = await device.backgroundModules.customLists.createCustomLists(
            { names: listNames },
        )
        const expectedListData = {
            [listIds[0]]: expect.objectContaining({
                id: listIds[0],
                name: listNames[0],
            }),
            [listIds[1]]: expect.objectContaining({
                id: listIds[1],
                name: listNames[1],
            }),
        }

        expect(
            searchResults.state.listsSidebar.localLists.loadingState,
        ).toEqual('pristine')
        expect(searchResults.state.listsSidebar.listData).toEqual({})
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds,
        ).toEqual([])
        expect(searchResults.state.listsSidebar.localLists.allListIds).toEqual(
            [],
        )

        await searchResults.processEvent('init', null)

        expect(
            searchResults.state.listsSidebar.localLists.loadingState,
        ).toEqual('success')
        expect(searchResults.state.listsSidebar.listData).toEqual(
            expectedListData,
        )
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds,
        ).toEqual(listIds)
        expect(searchResults.state.listsSidebar.localLists.allListIds).toEqual(
            listIds,
        )
    })

    it('should trigger search during init logic', async ({ device }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })

        expect(searchResults.logic['searchTriggeredCount']).toBe(0)
        await searchResults.processEvent('init', null)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)
    })

    it('should hydrate state from local storage during init logic', async ({
        device,
    }) => {
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

        expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(false)
        expect(
            searchResultsA.state.searchResults.isSubscriptionBannerShown,
        ).toBe(false)
        expect(
            searchResultsA.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(false)
        expect(searchResultsA.state.searchResults.shouldShowTagsUIs).toBe(false)
        expect(searchResultsA.state.isCloudEnabled).toBe(true)
        await searchResultsA.processEvent('init', null)
        expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(false)
        expect(
            searchResultsA.state.searchResults.isSubscriptionBannerShown,
        ).toBe(true)
        expect(
            searchResultsA.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(true)
        expect(searchResultsA.state.searchResults.shouldShowTagsUIs).toBe(true)
        expect(searchResultsA.state.isCloudEnabled).toBe(false)

        const {
            searchResults: searchResultsB,
            logic: logicB,
        } = await setupTest(device, { withAuth: true })

        await logicA.syncSettings.dashboard.set('listSidebarLocked', true)
        await logicA.syncSettings.dashboard.set(
            'subscribeBannerShownAfter',
            null,
        )
        await logicA.syncSettings.extension.set('areTagsMigratedToSpaces', true)
        await logicB['options'].localStorage.set({
            [CLOUD_STORAGE_KEYS.isSetUp]: true,
        })

        expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(false)
        expect(
            searchResultsB.state.searchResults.isSubscriptionBannerShown,
        ).toBe(false)
        expect(
            searchResultsB.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(false)
        expect(searchResultsB.state.searchResults.shouldShowTagsUIs).toBe(false)
        expect(searchResultsB.state.isCloudEnabled).toBe(true)
        await searchResultsB.processEvent('init', null)
        expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(true)
        expect(
            searchResultsB.state.searchResults.isSubscriptionBannerShown,
        ).toBe(false)
        expect(
            searchResultsB.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(false)
        expect(searchResultsB.state.searchResults.shouldShowTagsUIs).toBe(false)
        expect(searchResultsB.state.isCloudEnabled).toBe(true)
    })

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

    it('should get current user state during init logic', async ({
        device,
    }) => {
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
    })

    it('should get feed activity status during init logic', async ({
        device,
    }) => {
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
    })

    it('should get feed activity status upon click', async ({ device }) => {
        let feedUrlOpened = false

        const { searchResults } = await setupTest(device, {
            withAuth: true,
            openFeedUrl: () => {
                feedUrlOpened = true
            },
        })
        searchResults.processMutation({
            listsSidebar: { hasFeedActivity: { $set: true } },
        })
        await setLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY, true)

        expect(searchResults.state.listsSidebar.hasFeedActivity).toBe(true)
        expect(feedUrlOpened).toBe(false)
        expect(await getLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY)).toBe(
            true,
        )
        await searchResults.processEvent('clickFeedActivityIndicator', null)
        expect(searchResults.state.listsSidebar.hasFeedActivity).toBe(false)
        expect(feedUrlOpened).toBe(true)
        expect(await getLocalStorage(ACTIVITY_INDICATOR_ACTIVE_CACHE_KEY)).toBe(
            false,
        )
    })

    it('should hide banner and set cloud enabled flag on migration finish', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        const initState = () =>
            searchResults.processMutation({
                modals: { showCloudOnboarding: { $set: true } },
                searchResults: { isCloudUpgradeBannerShown: { $set: true } },
                isCloudEnabled: { $set: false },
            })

        initState()

        expect(searchResults.state.isCloudEnabled).toBe(false)
        expect(
            searchResults.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(true)
        expect(searchResults.state.modals.showCloudOnboarding).toBe(true)

        await searchResults.processEvent('closeCloudOnboardingModal', {
            didFinish: false,
        })

        expect(searchResults.state.isCloudEnabled).toBe(false)
        expect(
            searchResults.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(true)
        expect(searchResults.state.modals.showCloudOnboarding).toBe(false)

        initState()

        await searchResults.processEvent('closeCloudOnboardingModal', {
            didFinish: true,
        })

        expect(searchResults.state.isCloudEnabled).toBe(true)
        expect(
            searchResults.state.searchResults.isCloudUpgradeBannerShown,
        ).toBe(false)
        expect(searchResults.state.modals.showCloudOnboarding).toBe(false)
    })
})
