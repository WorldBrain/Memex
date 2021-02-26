import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import {
    setupTest,
    setPageSearchResult,
    setNoteSearchResult,
} from '../logic.test.util'
import * as DATA from '../logic.test.data'
import * as utils from './util'
import { NoteResultHoverState, ResultHoverState } from './types'
import { PAGE_SEARCH_DUMMY_DAY } from '../constants'

describe('Dashboard search results logic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        includePostSyncProcessor: true,
    })

    describe('root state mutations', () => {
        it('should be able to set page search type', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                overrideSearchTrigger: true,
            })

            expect(searchResults.logic['searchTriggeredCount']).toBe(0)
            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )

            await searchResults.processEvent('setSearchType', {
                searchType: 'notes',
            })

            expect(searchResults.logic['searchTriggeredCount']).toBe(1)
            expect(searchResults.state.searchResults.searchType).toEqual(
                'notes',
            )

            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })

            expect(searchResults.logic['searchTriggeredCount']).toBe(2)
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
        it('should be able to set page tags', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(),
            })
            const pageId = DATA.PAGE_2.normalizedUrl
            const fullPageUrl = DATA.PAGE_2.fullUrl

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].tags,
            ).toEqual([])

            await searchResults.processEvent('setPageTags', {
                id: pageId,
                fullPageUrl,
                added: DATA.TAG_1,
            })
            await searchResults.processEvent('setPageTags', {
                id: pageId,
                fullPageUrl,
                added: DATA.TAG_2,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].tags,
            ).toEqual([DATA.TAG_1, DATA.TAG_2])

            await searchResults.processEvent('setPageTags', {
                id: pageId,
                fullPageUrl,
                deleted: DATA.TAG_1,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].tags,
            ).toEqual([DATA.TAG_2])

            await searchResults.processEvent('setPageTags', {
                id: pageId,
                fullPageUrl,
                added: DATA.TAG_3,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].tags,
            ).toEqual([DATA.TAG_2, DATA.TAG_3])
        })

        it('should be able to set page lists', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(),
            })
            const pageId = DATA.PAGE_2.normalizedUrl

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([])

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: DATA.LISTS_1[0].name,
                skipPageIndexing: true,
            })
            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: DATA.LISTS_1[1].name,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[0].name, DATA.LISTS_1[1].name])

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                deleted: DATA.LISTS_1[0].name,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[1].name])

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: DATA.LISTS_1[2].name,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[1].name, DATA.LISTS_1[2].name])
        })

        it('should be able to cancel page deletion', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
            })
            const pageId = DATA.PAGE_1.normalizedUrl
            delete DATA.PAGE_1.fullUrl

            expect(
                await device.storageManager
                    .collection('pages')
                    .findOneObject({ url: pageId }),
            ).toEqual(
                expect.objectContaining({
                    url: pageId,
                    title: DATA.PAGE_1.fullTitle,
                }),
            )
            expect(searchResults.state.modals.deletingPageArgs).toEqual(
                undefined,
            )
            expect(
                searchResults.state.searchResults.pageData.byId[pageId],
            ).toEqual(
                expect.objectContaining({
                    ...DATA.PAGE_1,
                }),
            )

            await searchResults.processEvent('setDeletingPageArgs', {
                pageId,
                day: PAGE_SEARCH_DUMMY_DAY,
            })
            expect(searchResults.state.modals.deletingPageArgs).toEqual({
                pageId,
                day: PAGE_SEARCH_DUMMY_DAY,
            })

            await searchResults.processEvent('cancelPageDelete', null)

            expect(
                await device.storageManager
                    .collection('pages')
                    .findOneObject({ url: pageId }),
            ).toEqual(
                expect.objectContaining({
                    url: pageId,
                    title: DATA.PAGE_1.fullTitle,
                }),
            )
            expect(searchResults.state.modals.deletingPageArgs).toEqual(
                undefined,
            )
            expect(
                searchResults.state.searchResults.pageData.byId[pageId],
            ).toEqual(
                expect.objectContaining({
                    ...DATA.PAGE_1,
                }),
            )
        })

        it('should be able to confirm page deletion', async ({ device }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
            })
            const pageId = DATA.PAGE_1.normalizedUrl
            delete DATA.PAGE_1.fullUrl

            expect(
                await device.storageManager
                    .collection('pages')
                    .findOneObject({ url: pageId }),
            ).toEqual(
                expect.objectContaining({
                    url: pageId,
                    title: DATA.PAGE_1.fullTitle,
                }),
            )
            expect(searchResults.state.modals.deletingPageArgs).toEqual(
                undefined,
            )
            expect(
                searchResults.state.searchResults.pageData.allIds.includes(
                    pageId,
                ),
            ).toEqual(true)
            expect(
                searchResults.state.searchResults.pageData.byId[pageId],
            ).toEqual(
                expect.objectContaining({
                    ...DATA.PAGE_1,
                }),
            )
            expect(
                searchResults.state.searchResults.results[
                    PAGE_SEARCH_DUMMY_DAY
                ].pages.allIds.includes(pageId),
            ).toEqual(true)

            await searchResults.processEvent('setDeletingPageArgs', {
                pageId,
                day: PAGE_SEARCH_DUMMY_DAY,
            })
            expect(searchResults.state.modals.deletingPageArgs).toEqual({
                pageId,
                day: PAGE_SEARCH_DUMMY_DAY,
            })

            expect(searchResults.state.searchResults.pageDeleteState).toEqual(
                'pristine',
            )
            const deleteP = searchResults.processEvent(
                'confirmPageDelete',
                null,
            )
            expect(searchResults.state.searchResults.pageDeleteState).toEqual(
                'running',
            )
            await deleteP
            expect(searchResults.state.searchResults.pageDeleteState).toEqual(
                'success',
            )

            expect(
                await device.storageManager
                    .collection('pages')
                    .findOneObject({ url: pageId }),
            ).toEqual(null)
            expect(searchResults.state.modals.deletingPageArgs).toEqual(
                undefined,
            )
            expect(
                searchResults.state.searchResults.pageData.allIds.includes(
                    pageId,
                ),
            ).toEqual(false)
            expect(
                searchResults.state.searchResults.pageData.byId[pageId],
            ).toEqual(undefined)
            expect(
                searchResults.state.searchResults.results[PAGE_SEARCH_DUMMY_DAY]
                    .pages.byId[pageId],
            ).toEqual(undefined)
            expect(
                searchResults.state.searchResults.results[
                    PAGE_SEARCH_DUMMY_DAY
                ].pages.allIds.includes(pageId),
            ).toEqual(false)
        })

        it('should be able to remove a page from the search filtered list', async ({
            device,
        }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
            })
            const pageId = DATA.PAGE_2.normalizedUrl
            const list = DATA.LISTS_1[0]

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: list.name,
                skipPageIndexing: true,
            })

            searchResults.processMutation({
                listsSidebar: { selectedListId: { $set: list.id } },
            })
            expect(
                searchResults.state.searchResults.results[
                    PAGE_SEARCH_DUMMY_DAY
                ].pages.allIds.includes(pageId),
            ).toBe(true)

            await searchResults.processEvent('removePageFromList', {
                day: PAGE_SEARCH_DUMMY_DAY,
                pageId,
            })

            expect(
                searchResults.state.searchResults.results[
                    PAGE_SEARCH_DUMMY_DAY
                ].pages.allIds.includes(pageId),
            ).toBe(false)
        })
    })

    describe('nested page result state mutations', () => {
        describe('page search results', () => {
            it('should be able to show and hide copy paster', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isCopyPasterShown,
                ).toBe(false)
                await searchResults.processEvent('setPageCopyPasterShown', {
                    day,
                    pageId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isCopyPasterShown,
                ).toBe(true)
                await searchResults.processEvent('setPageCopyPasterShown', {
                    day,
                    pageId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isCopyPasterShown,
                ).toBe(false)
            })

            it('should be able to show and hide tag picker', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isTagPickerShown,
                ).toBe(false)
                await searchResults.processEvent('setPageTagPickerShown', {
                    day,
                    pageId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isTagPickerShown,
                ).toBe(true)
                await searchResults.processEvent('setPageTagPickerShown', {
                    day,
                    pageId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isTagPickerShown,
                ).toBe(false)
            })

            it('should be able to show and hide list picker', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isListPickerShown,
                ).toBe(false)
                await searchResults.processEvent('setPageListPickerShown', {
                    day,
                    pageId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isListPickerShown,
                ).toBe(true)
                await searchResults.processEvent('setPageListPickerShown', {
                    day,
                    pageId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isListPickerShown,
                ).toBe(false)
            })

            it('should be able to show and hide notes', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
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
                const day = PAGE_SEARCH_DUMMY_DAY
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

            it('should be able to set page result hover state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl
                const states: ResultHoverState[] = [
                    'footer',
                    'main-content',
                    'tags',
                    null,
                ]

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].hoverState,
                ).toEqual(null)

                for (const hover of states) {
                    await searchResults.processEvent('setPageHover', {
                        day,
                        pageId,
                        hover,
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].hoverState,
                    ).toEqual(hover)
                }
            })

            it('should be able to set new note input value', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual(utils.getInitialFormState().inputValue)

                await searchResults.processEvent('setPageNewNoteCommentValue', {
                    day,
                    pageId,
                    value: 'followed',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('followed')

                await searchResults.processEvent('setPageNewNoteCommentValue', {
                    day,
                    pageId,
                    value: 'search',
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual('search')

                await searchResults.processEvent('setPageNewNoteCommentValue', {
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

            it('should be able to set new note tag picker shown state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.isTagPickerShown,
                ).toEqual(utils.getInitialFormState().isTagPickerShown)

                await searchResults.processEvent(
                    'setPageNewNoteTagPickerShown',
                    {
                        day,
                        pageId,
                        isShown: true,
                    },
                )
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.isTagPickerShown,
                ).toEqual(true)

                await searchResults.processEvent(
                    'setPageNewNoteTagPickerShown',
                    {
                        day,
                        pageId,
                        isShown: false,
                    },
                )
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.isTagPickerShown,
                ).toEqual(false)
            })

            it('should be able to set new note tag state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.tags,
                ).toEqual(utils.getInitialFormState().tags)

                await searchResults.processEvent('setPageNewNoteTags', {
                    day,
                    pageId,
                    tags: ['test'],
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.tags,
                ).toEqual(['test'])

                await searchResults.processEvent('setPageNewNoteTags', {
                    day,
                    pageId,
                    tags: ['test', 'again'],
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.tags,
                ).toEqual(['test', 'again'])
            })

            it('should be able to cancel new note state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl
                const newNoteComment = 'test'
                const newNoteTags = ['test']

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm,
                ).toEqual(utils.getInitialFormState())

                await searchResults.processEvent('setPageNewNoteCommentValue', {
                    day,
                    pageId,
                    value: newNoteComment,
                })

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual(newNoteComment)

                await searchResults.processEvent('setPageNewNoteTags', {
                    day,
                    pageId,
                    tags: newNoteTags,
                })

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.tags,
                ).toEqual(newNoteTags)

                await searchResults.processEvent('cancelPageNewNote', {
                    day,
                    pageId,
                })

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm,
                ).toEqual(utils.getInitialFormState())
            })

            it('should be able to save new note state', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl
                const newNoteComment = 'test'
                const newNoteTags = ['test']

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm,
                ).toEqual(utils.getInitialFormState())

                await searchResults.processEvent('setPageNewNoteCommentValue', {
                    day,
                    pageId,
                    value: newNoteComment,
                })

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.inputValue,
                ).toEqual(newNoteComment)

                await searchResults.processEvent('setPageNewNoteTags', {
                    day,
                    pageId,
                    tags: newNoteTags,
                })

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].newNoteForm.tags,
                ).toEqual(newNoteTags)

                expect(
                    searchResults.state.searchResults.newNoteCreateState,
                ).toEqual('pristine')
                const saveNoteP = searchResults.processEvent(
                    'savePageNewNote',
                    {
                        day,
                        pageId,
                        fullPageUrl: 'https://' + pageId,
                        skipPageIndexing: true,
                    },
                )
                expect(
                    searchResults.state.searchResults.newNoteCreateState,
                ).toEqual('running')
                await saveNoteP
                expect(
                    searchResults.state.searchResults.newNoteCreateState,
                ).toEqual('success')

                const latestNoteId =
                    searchResults.state.searchResults.noteData.allIds[
                        searchResults.state.searchResults.noteData.allIds
                            .length - 1
                    ]

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ],
                ).toEqual(
                    expect.objectContaining({
                        newNoteForm: utils.getInitialFormState(),
                        noteIds: expect.objectContaining({
                            user: [latestNoteId],
                        }),
                    }),
                )

                expect(
                    searchResults.state.searchResults.noteData.byId[
                        latestNoteId
                    ],
                ).toEqual(
                    expect.objectContaining({
                        comment: newNoteComment,
                        tags: newNoteTags,
                        url: latestNoteId,
                        isEditing: false,
                        editNoteForm: utils.getInitialFormState(),
                    }),
                )

                expect(
                    searchResults.state.searchResults.noteData.allIds,
                ).toEqual([latestNoteId])
            })

            describe('note search results', () => {
                it('should be able to show and hide notes', async ({
                    device,
                }) => {
                    const { searchResults } = await setupTest(device, {
                        seedData: setNoteSearchResult(),
                    })
                    const day = DATA.DAY_2
                    const pageId = DATA.PAGE_3.normalizedUrl

                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].areNotesShown,
                    ).toBe(false)
                    await searchResults.processEvent('setPageNotesShown', {
                        day,
                        pageId,
                        areShown: true,
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].areNotesShown,
                    ).toBe(true)
                    await searchResults.processEvent('setPageNotesShown', {
                        day,
                        pageId,
                        areShown: false,
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].areNotesShown,
                    ).toBe(false)
                })

                it('should be able to set note type', async ({ device }) => {
                    const { searchResults } = await setupTest(device, {
                        seedData: setNoteSearchResult(),
                    })
                    const day = DATA.DAY_2
                    const pageId = DATA.PAGE_1.normalizedUrl

                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].notesType,
                    ).toEqual(utils.getInitialPageResultState('').notesType)
                    await searchResults.processEvent('setPageNotesType', {
                        day,
                        pageId,
                        noteType: 'followed',
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].notesType,
                    ).toEqual('followed')
                    await searchResults.processEvent('setPageNotesType', {
                        day,
                        pageId,
                        noteType: 'search',
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].notesType,
                    ).toEqual('search')
                    await searchResults.processEvent('setPageNotesType', {
                        day,
                        pageId,
                        noteType: 'user',
                    })
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].notesType,
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
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].newNoteForm.inputValue,
                    ).toEqual(utils.getInitialFormState().inputValue)
                    await searchResults.processEvent(
                        'setPageNewNoteCommentValue',
                        {
                            day,
                            pageId,
                            value: 'followed',
                        },
                    )
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].newNoteForm.inputValue,
                    ).toEqual('followed')
                    await searchResults.processEvent(
                        'setPageNewNoteCommentValue',
                        {
                            day,
                            pageId,
                            value: 'search',
                        },
                    )
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].newNoteForm.inputValue,
                    ).toEqual('search')
                    await searchResults.processEvent(
                        'setPageNewNoteCommentValue',
                        {
                            day,
                            pageId,
                            value: 'user',
                        },
                    )
                    expect(
                        searchResults.state.searchResults.results[day].pages
                            .byId[pageId].newNoteForm.inputValue,
                    ).toEqual('user')
                })

                it('should be able to remove a page from the search filtered list, removing results from all days it occurs under', async ({
                    device,
                }) => {
                    const { searchResults } = await setupTest(device, {
                        seedData: setNoteSearchResult(
                            DATA.ANNOT_SEARCH_RESULT_2,
                        ),
                    })
                    const pageId = DATA.PAGE_1.normalizedUrl
                    const list = DATA.LISTS_1[0]

                    await searchResults.processEvent('setPageLists', {
                        id: pageId,
                        fullPageUrl: 'https://' + pageId,
                        added: list.name,
                        skipPageIndexing: true,
                    })

                    searchResults.processMutation({
                        listsSidebar: { selectedListId: { $set: list.id } },
                    })

                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_1
                        ].pages.allIds.includes(pageId),
                    ).toBe(true)
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_2
                        ].pages.allIds.includes(pageId),
                    ).toBe(true)

                    await searchResults.processEvent('removePageFromList', {
                        day: DATA.DAY_1,
                        pageId,
                    })

                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_1
                        ].pages.allIds.includes(pageId),
                    ).toBe(false)
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_2
                        ].pages.allIds.includes(pageId),
                    ).toBe(false)
                })

                it('should be able to confirm page deletion, removing results from all days it occurs under', async ({
                    device,
                }) => {
                    const { searchResults } = await setupTest(device, {
                        seedData: setNoteSearchResult(
                            DATA.ANNOT_SEARCH_RESULT_2,
                        ),
                    })
                    const pageId = DATA.PAGE_1.normalizedUrl
                    delete DATA.PAGE_1.fullUrl

                    expect(
                        await device.storageManager
                            .collection('pages')
                            .findOneObject({ url: pageId }),
                    ).toEqual(
                        expect.objectContaining({
                            url: pageId,
                            title: DATA.PAGE_1.fullTitle,
                        }),
                    )
                    expect(searchResults.state.modals.deletingPageArgs).toEqual(
                        undefined,
                    )
                    expect(
                        searchResults.state.searchResults.pageData.allIds.includes(
                            pageId,
                        ),
                    ).toEqual(true)
                    expect(
                        searchResults.state.searchResults.pageData.byId[pageId],
                    ).toEqual(
                        expect.objectContaining({
                            ...DATA.PAGE_1,
                        }),
                    )
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_1
                        ].pages.allIds.includes(pageId),
                    ).toEqual(true)
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_2
                        ].pages.allIds.includes(pageId),
                    ).toEqual(true)

                    await searchResults.processEvent('setDeletingPageArgs', {
                        pageId,
                        day: DATA.DAY_1,
                    })
                    expect(searchResults.state.modals.deletingPageArgs).toEqual(
                        {
                            pageId,
                            day: DATA.DAY_1,
                        },
                    )

                    expect(
                        searchResults.state.searchResults.pageDeleteState,
                    ).toEqual('pristine')
                    const deleteP = searchResults.processEvent(
                        'confirmPageDelete',
                        null,
                    )
                    expect(
                        searchResults.state.searchResults.pageDeleteState,
                    ).toEqual('running')
                    await deleteP
                    expect(
                        searchResults.state.searchResults.pageDeleteState,
                    ).toEqual('success')

                    expect(
                        await device.storageManager
                            .collection('pages')
                            .findOneObject({ url: pageId }),
                    ).toEqual(null)
                    expect(searchResults.state.modals.deletingPageArgs).toEqual(
                        undefined,
                    )
                    expect(
                        searchResults.state.searchResults.pageData.allIds.includes(
                            pageId,
                        ),
                    ).toEqual(false)
                    expect(
                        searchResults.state.searchResults.pageData.byId[pageId],
                    ).toEqual(undefined)
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_1
                        ].pages.allIds.includes(pageId),
                    ).toEqual(false)
                    expect(
                        searchResults.state.searchResults.results[
                            DATA.DAY_2
                        ].pages.allIds.includes(pageId),
                    ).toEqual(false)
                    expect(
                        searchResults.state.searchResults.results[DATA.DAY_1]
                            .pages.byId[pageId],
                    ).toEqual(undefined)
                    expect(
                        searchResults.state.searchResults.results[DATA.DAY_2]
                            .pages.byId[pageId],
                    ).toEqual(undefined)
                })
            })
        })

        describe('nested page note result state mutations', () => {
            it('should be able to toggle note edit state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isEditing,
                ).toEqual(false)

                await searchResults.processEvent('setNoteEditing', {
                    noteId,
                    isEditing: true,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isEditing,
                ).toEqual(true)

                await searchResults.processEvent('setNoteEditing', {
                    noteId,
                    isEditing: false,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isEditing,
                ).toEqual(false)
            })

            it('should be able to toggle note copy paster shown state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isCopyPasterShown,
                ).toEqual(false)

                await searchResults.processEvent('setNoteCopyPasterShown', {
                    noteId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isCopyPasterShown,
                ).toEqual(true)

                await searchResults.processEvent('setNoteCopyPasterShown', {
                    noteId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isCopyPasterShown,
                ).toEqual(false)
            })

            it('should be able to toggle note replies shown state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .areRepliesShown,
                ).toEqual(false)

                await searchResults.processEvent('setNoteRepliesShown', {
                    noteId,
                    areShown: true,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .areRepliesShown,
                ).toEqual(true)

                await searchResults.processEvent('setNoteRepliesShown', {
                    noteId,
                    areShown: false,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .areRepliesShown,
                ).toEqual(false)
            })

            it('should be able to set note result hover state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url
                const states: NoteResultHoverState[] = [
                    'footer',
                    'main-content',
                    'note',
                    'tags',
                    null,
                ]

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .hoverState,
                ).toEqual(null)

                for (const hover of states) {
                    await searchResults.processEvent('setNoteHover', {
                        noteId,
                        hover,
                    })
                    expect(
                        searchResults.state.searchResults.noteData.byId[noteId]
                            .hoverState,
                    ).toEqual(hover)
                }
            })

            it('should be able to toggle note tag picker shown state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isTagPickerShown,
                ).toEqual(false)

                await searchResults.processEvent('setNoteTagPickerShown', {
                    noteId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isTagPickerShown,
                ).toEqual(true)

                await searchResults.processEvent('setNoteTagPickerShown', {
                    noteId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isTagPickerShown,
                ).toEqual(false)
            })

            it('should be able to set note tag state', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .editNoteForm.tags,
                ).toEqual([])

                await searchResults.processEvent('setNoteTags', {
                    noteId,
                    added: DATA.TAG_1,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .tags,
                ).toEqual([DATA.TAG_1])

                await searchResults.processEvent('setNoteTags', {
                    noteId,
                    added: DATA.TAG_2,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .tags,
                ).toEqual([DATA.TAG_1, DATA.TAG_2])

                await searchResults.processEvent('setNoteTags', {
                    noteId,
                    deleted: DATA.TAG_1,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .tags,
                ).toEqual([DATA.TAG_2])
                await searchResults.processEvent('setNoteTags', {
                    noteId,
                    deleted: DATA.TAG_2,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .tags,
                ).toEqual([])
            })

            it('should show beta feature modal on note share when account feature disabled', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(searchResults.state.modals.showBetaFeature).toBeFalsy()
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isShareMenuShown,
                ).toEqual(false)

                await searchResults.processEvent('showNoteShareMenu', {
                    noteId,
                })

                expect(searchResults.state.modals.showBetaFeature).toEqual(true)
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isShareMenuShown,
                ).toEqual(false)
            })

            it('should be able to show note share menu', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                await searchResults.processMutation({
                    searchResults: {
                        sharingAccess: { $set: 'sharing-allowed' },
                    },
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isShareMenuShown,
                ).toEqual(false)

                await searchResults.processEvent('showNoteShareMenu', {
                    noteId,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .isShareMenuShown,
                ).toEqual(true)
            })

            it('should be update note share info', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteSharingInfo[noteId],
                ).toEqual(undefined)

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    info: { status: 'not-yet-shared', taskState: 'pristine' },
                })
                expect(
                    searchResults.state.searchResults.noteSharingInfo[noteId],
                ).toEqual({
                    status: 'not-yet-shared',
                    taskState: 'pristine',
                })

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    info: { status: 'shared', taskState: 'success' },
                })
                expect(
                    searchResults.state.searchResults.noteSharingInfo[noteId],
                ).toEqual({
                    status: 'shared',
                    taskState: 'success',
                })

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    info: { status: 'unshared', taskState: 'error' },
                })
                expect(
                    searchResults.state.searchResults.noteSharingInfo[noteId],
                ).toEqual({
                    status: 'unshared',
                    taskState: 'error',
                })
            })

            it('should be able to copy note links', async ({ device }) => {
                let clipboard = ''
                const { searchResults, analytics } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                    copyToClipboard: async (text) => {
                        clipboard = text
                        return true
                    },
                })
                const noteId = DATA.NOTE_2.url
                const link = 'test'

                expect(clipboard).toEqual('')
                expect(analytics.popNew()).toEqual([])

                await searchResults.processEvent('copySharedNoteLink', {
                    noteId,
                    link,
                })

                expect(clipboard).toEqual(link)
                expect(analytics.popNew()).toEqual([
                    {
                        eventArgs: {
                            category: 'ContentSharing',
                            action: 'copyNoteLink',
                        },
                    },
                ])
            })

            it('should be able to set note edit comment value state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .editNoteForm.inputValue,
                ).toEqual(DATA.NOTE_2.comment)

                await searchResults.processEvent('setNoteEditCommentValue', {
                    noteId,
                    value: 'test',
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .editNoteForm.inputValue,
                ).toEqual('test')

                await searchResults.processEvent('setNoteEditCommentValue', {
                    noteId,
                    value: 'test again',
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .editNoteForm.inputValue,
                ).toEqual('test again')
            })

            it('should be able to cancel edited note state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url
                const updatedComment = 'test'

                await searchResults.processEvent('setNoteEditing', {
                    noteId,
                    isEditing: true,
                })
                await searchResults.processEvent('setNoteEditCommentValue', {
                    noteId,
                    value: updatedComment,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        comment: DATA.NOTE_2.comment,
                        isEditing: true,
                        editNoteForm: expect.objectContaining({
                            inputValue: updatedComment,
                        }),
                    }),
                )

                await searchResults.processEvent('cancelNoteEdit', {
                    noteId,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        comment: DATA.NOTE_2.comment,
                        isEditing: false,
                        editNoteForm: expect.objectContaining({
                            inputValue: DATA.NOTE_2.comment,
                        }),
                    }),
                )
            })

            it('should be able to save edited note state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url
                const updatedComment = 'test'

                await searchResults.processEvent('setNoteEditing', {
                    noteId,
                    isEditing: true,
                })
                await searchResults.processEvent('setNoteEditCommentValue', {
                    noteId,
                    value: updatedComment,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        tags: [],
                        comment: DATA.NOTE_2.comment,
                        isEditing: true,
                        editNoteForm: expect.objectContaining({
                            inputValue: updatedComment,
                        }),
                    }),
                )

                expect(
                    searchResults.state.searchResults.noteUpdateState,
                ).toEqual('pristine')
                const editP = searchResults.processEvent('saveNoteEdit', {
                    noteId,
                })
                expect(
                    searchResults.state.searchResults.noteUpdateState,
                ).toEqual('running')
                await editP
                expect(
                    searchResults.state.searchResults.noteUpdateState,
                ).toEqual('success')

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        comment: updatedComment,
                        isEditing: false,
                        editNoteForm: expect.objectContaining({
                            inputValue: updatedComment,
                        }),
                    }),
                )
            })

            it('should be able to cancel note deletion', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_1.url

                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({ url: noteId }),
                ).toEqual(
                    expect.objectContaining({
                        url: noteId,
                        comment: DATA.NOTE_1.comment,
                    }),
                )
                expect(searchResults.state.modals.deletingNoteArgs).toEqual(
                    undefined,
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        ...DATA.NOTE_1,
                    }),
                )

                await searchResults.processEvent('setDeletingNoteArgs', {
                    noteId,
                    pageId: DATA.PAGE_1.normalizedUrl,
                    day: PAGE_SEARCH_DUMMY_DAY,
                })
                expect(searchResults.state.modals.deletingNoteArgs).toEqual({
                    noteId,
                    pageId: DATA.PAGE_1.normalizedUrl,
                    day: PAGE_SEARCH_DUMMY_DAY,
                })

                await searchResults.processEvent('cancelNoteDelete', null)

                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({ url: noteId }),
                ).toEqual(
                    expect.objectContaining({
                        url: noteId,
                        comment: DATA.NOTE_1.comment,
                    }),
                )
                expect(searchResults.state.modals.deletingNoteArgs).toEqual(
                    undefined,
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        ...DATA.NOTE_1,
                    }),
                )
            })

            it('should be able to confirm note deletion', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_1.url

                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({ url: noteId }),
                ).toEqual(
                    expect.objectContaining({
                        url: noteId,
                        comment: DATA.NOTE_1.comment,
                    }),
                )
                expect(searchResults.state.modals.deletingNoteArgs).toEqual(
                    undefined,
                )
                expect(
                    searchResults.state.searchResults.noteData.allIds.includes(
                        noteId,
                    ),
                ).toEqual(true)
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        ...DATA.NOTE_1,
                    }),
                )

                await searchResults.processEvent('setDeletingNoteArgs', {
                    noteId,
                    pageId: DATA.PAGE_1.normalizedUrl,
                    day: PAGE_SEARCH_DUMMY_DAY,
                })
                expect(searchResults.state.modals.deletingNoteArgs).toEqual({
                    noteId,
                    pageId: DATA.PAGE_1.normalizedUrl,
                    day: PAGE_SEARCH_DUMMY_DAY,
                })

                expect(
                    searchResults.state.searchResults.noteDeleteState,
                ).toEqual('pristine')
                const deleteP = searchResults.processEvent(
                    'confirmNoteDelete',
                    null,
                )
                expect(
                    searchResults.state.searchResults.noteDeleteState,
                ).toEqual('running')
                await deleteP
                expect(
                    searchResults.state.searchResults.noteDeleteState,
                ).toEqual('success')

                expect(
                    await device.storageManager
                        .collection('annotations')
                        .findOneObject({ url: noteId }),
                ).toEqual(null)
                expect(searchResults.state.modals.deletingNoteArgs).toEqual(
                    undefined,
                )
                expect(
                    searchResults.state.searchResults.noteData.allIds.includes(
                        noteId,
                    ),
                ).toEqual(false)
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(undefined)
            })
        })
    })
})
