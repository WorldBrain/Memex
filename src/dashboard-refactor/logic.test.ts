import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'
import { STORAGE_KEYS } from './constants'

describe('Dashboard Refactor misc logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to load local lists during init logic', async ({
        device,
    }) => {
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
        expect(searchResults.state.listsSidebar.localLists.listIds).toEqual([])

        await searchResults.processEvent('init', null)

        expect(
            searchResults.state.listsSidebar.localLists.loadingState,
        ).toEqual('success')
        expect(searchResults.state.listsSidebar.listData).toEqual(
            expectedListData,
        )
        expect(searchResults.state.listsSidebar.localLists.listIds).toEqual(
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
        } = await setupTest(device)

        await logicA['options'].localStorage.set({
            [STORAGE_KEYS.listSidebarLocked]: false,
        })

        expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(false)
        await searchResultsA.processEvent('init', null)
        expect(searchResultsA.state.listsSidebar.isSidebarLocked).toBe(false)

        const {
            searchResults: searchResultsB,
            logic: logicB,
        } = await setupTest(device)

        await logicB['options'].localStorage.set({
            [STORAGE_KEYS.listSidebarLocked]: true,
        })

        expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(false)
        await searchResultsB.processEvent('init', null)
        expect(searchResultsB.state.listsSidebar.isSidebarLocked).toBe(true)
    })

    it('should get sharing access state during init logic', async ({
        device,
    }) => {
        const { searchResults: searchResultsA } = await setupTest(device)

        device.backgroundModules.auth.remoteFunctions.isAuthorizedForFeature = async () =>
            true

        expect(searchResultsA.state.searchResults.sharingAccess).toEqual(
            'feature-disabled',
        )
        await searchResultsA.processEvent('init', null)
        expect(searchResultsA.state.searchResults.sharingAccess).toEqual(
            'sharing-allowed',
        )

        const { searchResults: searchResultsB } = await setupTest(device)

        device.backgroundModules.auth.remoteFunctions.isAuthorizedForFeature = async () =>
            false

        expect(searchResultsB.state.searchResults.sharingAccess).toEqual(
            'feature-disabled',
        )
        await searchResultsB.processEvent('init', null)
        expect(searchResultsB.state.searchResults.sharingAccess).toEqual(
            'feature-disabled',
        )
    })
})
