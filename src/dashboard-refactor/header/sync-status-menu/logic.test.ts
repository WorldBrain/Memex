import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from '../../logic.test.util'
import * as DATA from '../../logic.test.data'

describe('Dashboard sync menu logic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        includePostSyncProcessor: true,
    })

    it('should be able to set display state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.syncMenu.isDisplayed).toBe(false)
        await searchResults.processEvent('setSyncStatusMenuDisplayState', {
            isShown: true,
        })
        expect(searchResults.state.syncMenu.isDisplayed).toBe(true)
        await searchResults.processEvent('setSyncStatusMenuDisplayState', {
            isShown: false,
        })
        expect(searchResults.state.syncMenu.isDisplayed).toBe(false)
    })

    it('should be able to set unsynced item count display state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.syncMenu.showUnsyncedItemCount).toBe(false)
        await searchResults.processEvent('setUnsyncedItemCountShown', {
            isShown: true,
        })
        expect(searchResults.state.syncMenu.showUnsyncedItemCount).toBe(true)
        await searchResults.processEvent('setUnsyncedItemCountShown', {
            isShown: false,
        })
        expect(searchResults.state.syncMenu.showUnsyncedItemCount).toBe(false)
    })
})
