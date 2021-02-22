import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'
import { getListShareUrl } from 'src/content-sharing/utils'

describe('Dashboard Refactor modals logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to set the Share List modal visibility state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)
        const listId = 123
        searchResults.processMutation({
            listsSidebar: {
                listData: {
                    [listId]: {
                        $set: {
                            id: listId,
                            listCreationState: 'pristine',
                            name: 'test',
                        },
                    },
                },
            },
        })

        expect(searchResults.state.modals.shareListId).toBeUndefined()
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'pristine',
        )

        await searchResults.processEvent('setShareListId', {
            listId,
        })

        expect(searchResults.state.modals.shareListId).toEqual(listId)
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'success',
        )

        await searchResults.processEvent('setShareListId', {})

        expect(searchResults.state.modals.shareListId).toBeUndefined()
    })

    it('should be able to set the Share List modal state, detecting that the list has already been shared', async ({
        device,
    }) => {
        const listId = 123
        const remoteListId = 'test'
        device.backgroundModules.contentSharing.remoteFunctions.getRemoteListId = async () =>
            remoteListId

        const { searchResults } = await setupTest(device)

        searchResults.processMutation({
            listsSidebar: {
                listData: {
                    [listId]: {
                        $set: {
                            id: listId,
                            listCreationState: 'pristine',
                            name: 'test',
                        },
                    },
                },
            },
        })

        expect(searchResults.state.modals.shareListId).toBeUndefined()
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'pristine',
        )
        expect(
            searchResults.state.listsSidebar.listData[listId].isShared,
        ).toBeFalsy()
        expect(
            searchResults.state.listsSidebar.listData[listId].shareUrl,
        ).toBeUndefined()

        await searchResults.processEvent('setShareListId', {
            listId,
        })

        expect(searchResults.state.modals.shareListId).toEqual(listId)
        expect(searchResults.state.listsSidebar.listShareLoadingState).toEqual(
            'success',
        )
        expect(
            searchResults.state.listsSidebar.listData[listId].isShared,
        ).toEqual(true)
        expect(
            searchResults.state.listsSidebar.listData[listId].shareUrl,
        ).toEqual(getListShareUrl({ remoteListId }))
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
