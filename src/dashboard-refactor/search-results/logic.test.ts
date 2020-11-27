import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { SearchResultsLogic } from './logic'
import * as DATA from './logic.test.data'

async function setupTest(
    device: UILogicTestDevice,
    args: { seedData?: boolean } = {},
) {
    const logic = new SearchResultsLogic()
    const searchResults = device.createElement(logic)

    if (args.seedData) {
        await searchResults.processEvent('setPageSearchResult', {
            result: DATA.PAGE_SEARCH_RESULT_1,
        })
    }

    return { searchResults, logic }
}

describe('Dashboard search results logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to toggle page bookmarks', async ({ device }) => {
        const { searchResults } = await setupTest(device, { seedData: true })
        const pageId = DATA.PAGE_2.normalizedUrl

        expect(searchResults.state.pageData.byId[pageId].isBookmarked).toBe(
            false,
        )
        await searchResults.processEvent('setPageBookmark', {
            id: pageId,
            isBookmarked: true,
        })
        expect(searchResults.state.pageData.byId[pageId].isBookmarked).toBe(
            true,
        )
        await searchResults.processEvent('setPageBookmark', {
            id: pageId,
            isBookmarked: false,
        })
        expect(searchResults.state.pageData.byId[pageId].isBookmarked).toBe(
            false,
        )
    })
})
