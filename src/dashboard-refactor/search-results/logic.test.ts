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

    describe('root state mutations', () => {
        it('should be able to set page search type', async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(searchResults.state.searchType).toEqual('pages')
            await searchResults.processEvent('setSearchType', {
                searchType: 'notes',
            })
            expect(searchResults.state.searchType).toEqual('notes')
            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })
            expect(searchResults.state.searchType).toEqual('pages')
        })

        it('should be able to set all notes shown', async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(searchResults.state.searchType).toEqual('pages')
            await searchResults.processEvent('setSearchType', {
                searchType: 'notes',
            })
            expect(searchResults.state.searchType).toEqual('notes')
            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })
            expect(searchResults.state.searchType).toEqual('pages')
        })
    })

    describe('page data state mutations', () => {
        it('should be able to toggle page bookmarks', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: true,
            })
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

    describe('page result state mutations', () => {
        it('should be able to show and hide notes', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: true,
            })
            const pageId = DATA.PAGE_3.normalizedUrl

            expect(
                searchResults.state.results[-1].pages.byId[pageId]
                    .areNotesShown,
            ).toBe(false)
            await searchResults.processEvent('setPageNotesShown', {
                day: -1,
                pageId,
                areShown: true,
            })
            expect(
                searchResults.state.results[-1].pages.byId[pageId]
                    .areNotesShown,
            ).toBe(true)
            await searchResults.processEvent('setPageNotesShown', {
                day: -1,
                pageId,
                areShown: false,
            })
            expect(
                searchResults.state.results[-1].pages.byId[pageId]
                    .areNotesShown,
            ).toBe(false)
        })

        it('should be able to set note type', async ({ device }) => {
            const { searchResults, logic } = await setupTest(device, {
                seedData: true,
            })
            const pageId = DATA.PAGE_1.normalizedUrl

            expect(
                searchResults.state.results[-1].pages.byId[pageId].notesType,
            ).toEqual(logic.getInitialPageResultState('').notesType)
            await searchResults.processEvent('setPageNotesType', {
                day: -1,
                pageId,
                noteType: 'followed',
            })
            expect(
                searchResults.state.results[-1].pages.byId[pageId].notesType,
            ).toEqual('followed')
            await searchResults.processEvent('setPageNotesType', {
                day: -1,
                pageId,
                noteType: 'search',
            })
            expect(
                searchResults.state.results[-1].pages.byId[pageId].notesType,
            ).toEqual('search')
            await searchResults.processEvent('setPageNotesType', {
                day: -1,
                pageId,
                noteType: 'user',
            })
            expect(
                searchResults.state.results[-1].pages.byId[pageId].notesType,
            ).toEqual('user')
        })
    })
})
