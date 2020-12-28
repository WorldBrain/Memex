import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'

describe('Dashboard Refactor modals logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to set the Share List modal visibility', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showShareList).toEqual(false)
        await searchResults.processEvent('setShowShareListModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showShareList).toEqual(true)
        await searchResults.processEvent('setShowShareListModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showShareList).toEqual(false)
    })

    it('should be able to set the Beta Feature modal visibility', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.modals.showBetaFeature).toEqual(false)
        await searchResults.processEvent('setShowBetaFeatureModal', {
            isShown: true,
        })
        expect(searchResults.state.modals.showBetaFeature).toEqual(true)
        await searchResults.processEvent('setShowBetaFeatureModal', {
            isShown: false,
        })
        expect(searchResults.state.modals.showBetaFeature).toEqual(false)
    })

    it('should be able to set the Show Subscription modal visibility', async ({
        device,
    }) => {
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

    it('should be able to set the Note Share Onboarding modal visibility', async ({
        device,
    }) => {
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
})
