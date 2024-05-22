import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'

describe('Dashboard Refactor modals logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()
    // TODO: Fix this test
    it('should be able to set the Share List modal visibility state', async ({
        device,
    }) => {
        return
        await device.backgroundModules.customLists.createCustomList({
            name: 'test a',
        })
        const { searchResults, annotationsCache } = await setupTest(device, {
            withAuth: true,
            runInitLogic: true,
        })

        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        searchResults.processMutation({
            listsSidebar: { showMoreMenuListId: { $set: listData.unifiedId } },
        })

        expect(searchResults.state.modals.shareListId).toBeUndefined()
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            listData.unifiedId,
        )
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'pristine',
        )

        await searchResults.processEvent('setShareListId', {
            listId: listData.unifiedId,
        })

        expect(searchResults.state.modals.shareListId).toEqual(
            listData.unifiedId,
        )
        expect(
            searchResults.state.listsSidebar.showMoreMenuListId,
        ).toBeUndefined()
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'success',
        )

        await searchResults.processEvent('setShareListId', {})

        expect(searchResults.state.modals.shareListId).toBeUndefined()
    })
    // TODO: Fix this test
    it('should be able to set the Login modal visibility', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showLogin).toEqual(false)
        await searchResults.processEvent('setShowLoginModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showLogin).toEqual(true)
        await searchResults.processEvent('setShowLoginModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showLogin).toEqual(false)
    })
    // TODO: Fix this test
    it('should be able to set the display name setup modal visibility', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showDisplayNameSetup).toEqual(false)
        await searchResults.processEvent('setShowDisplayNameSetupModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showDisplayNameSetup).toEqual(true)
        await searchResults.processEvent('setShowDisplayNameSetupModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showDisplayNameSetup).toEqual(false)
    })
    // TODO: Fix this test
    it('should be able to set the Show Subscription modal visibility', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showSubscription).toEqual(false)
        await searchResults.processEvent('setShowSubscriptionModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showSubscription).toEqual(true)
        await searchResults.processEvent('setShowSubscriptionModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showSubscription).toEqual(false)
    })
    // TODO: Fix this test
    it('should be able to set the Note Share Onboarding modal visibility', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showNoteShareOnboarding).toEqual(
            false,
        )
        await searchResults.processEvent('setShowNoteShareOnboardingModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showNoteShareOnboarding).toEqual(true)
        await searchResults.processEvent('setShowNoteShareOnboardingModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showNoteShareOnboarding).toEqual(
            false,
        )
    })
    // TODO: Fix this test
    it('clicking activity feed while logged out should display login modal', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device, {
            withAuth: false,
        })
        expect(searchResults.state.modals.showLogin).not.toBe(true)
        await searchResults.processEvent('switchToFeed', null)
        expect(searchResults.state.modals.showLogin).toBe(true)
    })
})
