import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { SearchResultsLogic } from '../logic'
import { Events, RootState } from '../types'
import * as DATA from './logic.test.data'
import * as utils from './util'
import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import { TestLogicContainer } from 'ui-logic-core/lib/testing'

type DataSeeder = (logic: TestLogicContainer<RootState, Events>) => void
type DataSeederCreator = (
    data?: StandardSearchResponse | AnnotationsSearchResponse,
) => DataSeeder

const setPageSearchResult: DataSeederCreator = (
    result = DATA.PAGE_SEARCH_RESULT_1,
) => (logic) => logic.processEvent('setPageSearchResult', { result })

const setNoteSearchResult: DataSeederCreator = (
    result: any = DATA.ANNOT_SEARCH_RESULT_2,
) => (logic) => logic.processEvent('setAnnotationSearchResult', { result })

async function setupTest(
    device: UILogicTestDevice,
    args: { seedData?: DataSeeder } = {},
) {
    const logic = new SearchResultsLogic({})
    const searchResults = device.createElement(logic)

    if (args.seedData) {
        args.seedData(searchResults)
    }

    return { searchResults, logic }
}

describe('Dashboard search results logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    describe('root state mutations', () => {
        it('should be able to set page search type', async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )
            await searchResults.processEvent('setSearchType', {
                searchType: 'notes',
            })
            expect(searchResults.state.searchResults.searchType).toEqual(
                'notes',
            )
            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })
            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )
        })

        it('should be able to set all notes shown', async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )
            await searchResults.processEvent('setSearchType', {
                searchType: 'notes',
            })
            expect(searchResults.state.searchResults.searchType).toEqual(
                'notes',
            )
            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })
            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )
        })
    })

    describe('page data state mutations', () => {
        it('should be able to toggle page bookmarks', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(),
            })
            const pageId = DATA.PAGE_2.normalizedUrl

            expect(
                searchResults.state.searchResults.pageData.byId[pageId]
                    .isBookmarked,
            ).toBe(false)
            await searchResults.processEvent('setPageBookmark', {
                id: pageId,
                isBookmarked: true,
            })
            expect(
                searchResults.state.searchResults.pageData.byId[pageId]
                    .isBookmarked,
            ).toBe(true)
            await searchResults.processEvent('setPageBookmark', {
                id: pageId,
                isBookmarked: false,
            })
            expect(
                searchResults.state.searchResults.pageData.byId[pageId]
                    .isBookmarked,
            ).toBe(false)
        })
    })

    describe('nested page result state mutations', () => {
        describe('page search results', () => {
            it('should be able to show and hide notes', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = -1
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(false)
                await searchResults.processEvent('setPageNotesShown', {
                    day,
                    pageId,
                    areShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(true)
                await searchResults.processEvent('setPageNotesShown', {
                    day,
                    pageId,
                    areShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(false)
            })

            it('should be able to set note type', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = -1
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual(utils.getInitialPageResultState('').notesType)
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'followed',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('followed')
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'search',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('search')
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'user',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('user')
            })

            it('should be able to set new note input value', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = -1
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual(
                    utils.getInitialPageResultState('').newNoteForm.inputValue,
                )
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'followed',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('followed')
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'search',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('search')
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'user',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('user')
            })
        })

        describe('note search results', () => {
            it('should be able to show and hide notes', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setNoteSearchResult(),
                })
                const day = DATA.DAY_2
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(false)
                await searchResults.processEvent('setPageNotesShown', {
                    day,
                    pageId,
                    areShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(true)
                await searchResults.processEvent('setPageNotesShown', {
                    day,
                    pageId,
                    areShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].areNotesShown,
                ).toBe(false)
            })

            it('should be able to set note type', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setNoteSearchResult(),
                })
                const day = DATA.DAY_2
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual(utils.getInitialPageResultState('').notesType)
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'followed',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('followed')
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'search',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('search')
                await searchResults.processEvent('setPageNotesType', {
                    day,
                    pageId,
                    noteType: 'user',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].notesType,
                ).toEqual('user')
            })

            it('should be able to set new note input value', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setNoteSearchResult(),
                })
                const day = DATA.DAY_2
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual(
                    utils.getInitialPageResultState('').newNoteForm.inputValue,
                )
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'followed',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('followed')
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'search',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('search')
                await searchResults.processEvent('setPageNewNoteValue', {
                    day,
                    pageId,
                    value: 'user',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('user')
            })
        })
    })
})
