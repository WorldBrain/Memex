import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import {
    setupTest,
    setPageSearchResult,
    setNoteSearchResult,
    makeNewShareStates,
    objectFilter,
} from '../logic.test.util'
import * as DATA from '../logic.test.data'
import * as utils from './util'
import { ResultHoverState } from './types'
import { PAGE_SEARCH_DUMMY_DAY } from '../constants'
import {
    AnnotationSharingState,
    AnnotationSharingStates,
} from 'src/content-sharing/background/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

describe('Dashboard search results logic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        includePostSyncProcessor: true,
    })

    it('should be able to copy note links', async ({ device }) => {
        let clipboard = ''
        const { searchResults, analytics } = await setupTest(device, {
            copyToClipboard: async (text) => {
                clipboard = text
                return true
            },
        })
        const link = 'test'

        expect(clipboard).toEqual('')
        expect(analytics.popNew()).toEqual([])

        await searchResults.processEvent('copyShareLink', {
            link,
            analyticsAction: 'copyPageLink',
        })

        expect(clipboard).toEqual(link)
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'ContentSharing',
                    action: 'copyPageLink',
                },
            },
        ])

        await searchResults.processEvent('copyShareLink', {
            link,
            analyticsAction: 'copyNoteLink',
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
            expect(
                searchResults.state.searchResults.shouldFormsAutoFocus,
            ).toEqual(false)

            await searchResults.processEvent('setSearchType', {
                searchType: 'pages',
            })

            expect(searchResults.logic['searchTriggeredCount']).toBe(2)
            expect(searchResults.state.searchResults.searchType).toEqual(
                'pages',
            )
            expect(
                searchResults.state.searchResults.shouldFormsAutoFocus,
            ).toEqual(false)
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

        it('should be able to set search copy paster shown state', async ({
            device,
        }) => {
            const { searchResults } = await setupTest(device)

            expect(
                searchResults.state.searchResults.isSearchCopyPasterShown,
            ).toEqual(false)

            await searchResults.processEvent('setSearchCopyPasterShown', {
                isShown: true,
            })

            expect(
                searchResults.state.searchResults.isSearchCopyPasterShown,
            ).toEqual(true)

            await searchResults.processEvent('setSearchCopyPasterShown', {
                isShown: false,
            })

            expect(
                searchResults.state.searchResults.isSearchCopyPasterShown,
            ).toEqual(false)
        })

        it('should be able to set list search share menu shown state', async ({
            device,
        }) => {
            const { searchResults } = await setupTest(device, {
                withAuth: true,
            })

            expect(
                searchResults.state.searchResults.isListShareMenuShown,
            ).toEqual(false)

            await searchResults.processEvent('setListShareMenuShown', {
                isShown: true,
            })

            expect(
                searchResults.state.searchResults.isListShareMenuShown,
            ).toEqual(true)

            await searchResults.processEvent('setListShareMenuShown', {
                isShown: false,
            })

            expect(
                searchResults.state.searchResults.isListShareMenuShown,
            ).toEqual(false)
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
                added: DATA.LISTS_1[0].id,
                skipPageIndexing: true,
            })
            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: DATA.LISTS_1[1].id,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[0].id, DATA.LISTS_1[1].id])

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                deleted: DATA.LISTS_1[0].id,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[1].id])

            await searchResults.processEvent('setPageLists', {
                id: pageId,
                fullPageUrl: 'https://' + pageId,
                added: DATA.LISTS_1[2].id,
                skipPageIndexing: true,
            })

            expect(
                searchResults.state.searchResults.pageData.byId[pageId].lists,
            ).toEqual([DATA.LISTS_1[1].id, DATA.LISTS_1[2].id])
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
                added: list.id,
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

        it('should be able to drag and drop a page result, setting the drag image', async ({
            device,
        }) => {
            const mockElement = { style: { display: undefined } }
            const mockDocument = { getElementById: () => mockElement }

            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                mockDocument,
            })
            searchResults['options']
            const page = DATA.PAGE_1

            const dataTransfer = new DataTransfer()

            expect(dataTransfer['img']).toEqual(undefined)
            expect(dataTransfer.getData('text/plain')).toEqual('')
            expect(mockElement.style.display).toEqual(undefined)
            expect(searchResults.state.searchResults.draggedPageId).toEqual(
                undefined,
            )

            await searchResults.processEvent('dragPage', {
                pageId: page.normalizedUrl,
                day: PAGE_SEARCH_DUMMY_DAY,
                dataTransfer,
            })

            expect(dataTransfer['img']).toEqual(mockElement)
            expect(dataTransfer.getData('text/plain')).toEqual(
                `{"fullPageUrl":"https://test.com","normalizedPageUrl":"test.com"}`,
            )
            expect(mockElement.style.display).toEqual('block')
            expect(searchResults.state.searchResults.draggedPageId).toEqual(
                page.normalizedUrl,
            )

            await searchResults.processEvent('dropPage', {
                pageId: page.normalizedUrl,
                day: PAGE_SEARCH_DUMMY_DAY,
            })

            expect(searchResults.state.searchResults.draggedPageId).toEqual(
                undefined,
            )
        })

        it('should be able to update note share info for all notes of a page', async ({
            device,
        }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
            })
            const pageId = DATA.PAGE_1.normalizedUrl
            const day = PAGE_SEARCH_DUMMY_DAY

            const noteIds = searchResults.state.searchResults.noteData.allIds.filter(
                (noteId) =>
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .pageUrl === pageId,
            )
            const notesById = noteIds.reduce(
                (acc, noteId) => ({
                    ...acc,
                    [noteId]:
                        searchResults.state.searchResults.noteData.byId[noteId],
                }),
                {},
            )

            await searchResults.processEvent('updatePageNotesShareInfo', {
                day,
                pageId,
                shareStates: makeNewShareStates(notesById, {
                    isShared: false,
                }),
            })
            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                    }),
                )
            }

            await searchResults.processEvent('updatePageNotesShareInfo', {
                day,
                pageId,
                shareStates: makeNewShareStates(notesById, {
                    isShared: true,
                }),
            })

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                    }),
                )
            }

            await searchResults.processEvent('updatePageNotesShareInfo', {
                day,
                pageId,
                shareStates: makeNewShareStates(notesById, {
                    isShared: false,
                    isBulkShareProtected: true,
                }),
            })

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                    }),
                )
            }

            // NOTE: Now that they're all protected, the next call shouldn't change anything
            await searchResults.processEvent('updatePageNotesShareInfo', {
                day,
                pageId,
                shareStates: makeNewShareStates(notesById, {
                    isShared: false,
                    isBulkShareProtected: false,
                }),
            })

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                    }),
                )
            }
        })

        it('should be able to update note share info for all result notes', async ({
            device,
        }) => {
            const { searchResults } = await setupTest(device, {
                seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
            })

            const noteIds = searchResults.state.searchResults.noteData.allIds
            const notesById = searchResults.state.searchResults.noteData.byId

            await searchResults.processEvent(
                'updateAllPageResultNotesShareInfo',
                {
                    shareStates: makeNewShareStates(notesById, {
                        isShared: false,
                    }),
                },
            )
            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                    }),
                )
            }

            await searchResults.processEvent(
                'updateAllPageResultNotesShareInfo',
                {
                    shareStates: makeNewShareStates(notesById, {
                        isShared: true,
                    }),
                },
            )

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                    }),
                )
            }

            await searchResults.processEvent(
                'updateAllPageResultNotesShareInfo',
                {
                    shareStates: makeNewShareStates(notesById, {
                        isShared: false,
                        isBulkShareProtected: true,
                    }),
                },
            )

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                    }),
                )
            }

            // NOTE: Now that they're all protected, the next call shouldn't change anything
            await searchResults.processEvent(
                'updateAllPageResultNotesShareInfo',
                {
                    shareStates: makeNewShareStates(notesById, {
                        isShared: false,
                        isBulkShareProtected: false,
                    }),
                },
            )

            for (const noteId of noteIds) {
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                    }),
                )
            }
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

            it('should be able to show and hide page share menu', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                    withAuth: true,
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_3.normalizedUrl

                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isShareMenuShown,
                ).toBe(false)
                await searchResults.processEvent('setPageShareMenuShown', {
                    day,
                    pageId,
                    isShown: true,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isShareMenuShown,
                ).toBe(true)
                await searchResults.processEvent('setPageShareMenuShown', {
                    day,
                    pageId,
                    isShown: false,
                })
                expect(
                    searchResults.state.searchResults.results[day].pages.byId[
                        pageId
                    ].isShareMenuShown,
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
                expect(
                    searchResults.state.searchResults.shouldFormsAutoFocus,
                ).toEqual(false)
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
                expect(
                    searchResults.state.searchResults.shouldFormsAutoFocus,
                ).toEqual(true)
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
                expect(
                    searchResults.state.searchResults.shouldFormsAutoFocus,
                ).toEqual(false)
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
                        shouldShare: false,
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
                        editNoteForm: {
                            ...utils.getInitialFormState(),
                            inputValue: newNoteComment,
                        },
                    }),
                )

                expect(
                    searchResults.state.searchResults.noteData.allIds,
                ).toEqual([latestNoteId])
            })

            it('should block new note save with login modal if logged out + save has share intent', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(),
                    withAuth: false,
                })
                const day = PAGE_SEARCH_DUMMY_DAY
                const pageId = DATA.PAGE_1.normalizedUrl

                expect(searchResults.state.modals.showLogin).toBe(false)
                expect(
                    searchResults.state.searchResults.noteData.allIds,
                ).toEqual([])

                await searchResults.processEvent('savePageNewNote', {
                    day,
                    pageId,
                    fullPageUrl: 'https://' + pageId,
                    shouldShare: true,
                })

                expect(searchResults.state.modals.showLogin).toBe(true)
                expect(
                    searchResults.state.searchResults.noteData.allIds,
                ).toEqual([])
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
                    expect(
                        searchResults.state.searchResults.shouldFormsAutoFocus,
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
                    expect(
                        searchResults.state.searchResults.shouldFormsAutoFocus,
                    ).toBe(true)
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
                    await device.storageManager
                        .collection('customLists')
                        .createObject({
                            id: list.id,
                            name: list.name,
                        })

                    await searchResults.processEvent('setPageLists', {
                        id: pageId,
                        fullPageUrl: 'https://' + pageId,
                        added: list.id,
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

            it('should be able to show and hide note share menu', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                    withAuth: true,
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('hide')

                await searchResults.processEvent('setNoteShareMenuShown', {
                    noteId,
                    shouldShow: true,
                    mouseEvent: {} as any,
                    platform: 'MacIntel',
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('show')

                await searchResults.processEvent('setNoteShareMenuShown', {
                    noteId,
                    shouldShow: false,
                    mouseEvent: {} as any,
                    platform: 'MacIntel',
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('hide')
            })

            it('should be able to click note share holding meta + alt to share immediately', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                    withAuth: true,
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('hide')

                // First simulate a Mac (different expected shortcut)
                await searchResults.processEvent('setNoteShareMenuShown', {
                    noteId,
                    shouldShow: true,
                    mouseEvent: { altKey: true, metaKey: true } as any,
                    platform: 'MacIntel',
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('show-n-share')

                await searchResults.processEvent('setNoteShareMenuShown', {
                    noteId,
                    shouldShow: false,
                    mouseEvent: {} as any,
                    platform: 'MacIntel',
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('hide')

                // Then simulate a non-Mac
                await searchResults.processEvent('setNoteShareMenuShown', {
                    noteId,
                    shouldShow: true,
                    mouseEvent: { altKey: true, ctrlKey: true } as any,
                    platform: 'not-mac',
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .shareMenuShowStatus,
                ).toEqual('show-n-share')
            })

            it('should be able to update note share info', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: true,
                    }),
                )
            })

            it('should modify suggestion cache upon adding lists to annotations', async ({
                device,
            }) => {
                await device.storageManager
                    .collection('customLists')
                    .createObject({
                        ...DATA.LISTS_1[0],
                        createdAt: new Date('2020-01-01'),
                    })
                await device.storageManager
                    .collection('customLists')
                    .createObject({
                        ...DATA.LISTS_1[1],
                        createdAt: new Date('2020-01-02'),
                    })

                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                })
                await searchResults.init()
                const noteId = DATA.NOTE_2.url

                const LIST_SUGGESTIONS = [
                    {
                        localId: DATA.LISTS_1[0].id,
                        name: DATA.LISTS_1[0].name,
                        createdAt: expect.any(Number),
                        focused: false,
                        remoteId: null,
                    },
                    {
                        localId: DATA.LISTS_1[1].id,
                        name: DATA.LISTS_1[1].name,
                        createdAt: expect.any(Number),
                        focused: false,
                        remoteId: null,
                    },
                ]

                expect(
                    await device.backgroundModules.customLists.fetchInitialListSuggestions(
                        { limit: 10 },
                    ),
                ).toEqual([LIST_SUGGESTIONS[0], LIST_SUGGESTIONS[1]])

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[1].id,
                })

                expect(
                    await device.backgroundModules.customLists.fetchInitialListSuggestions(
                        { limit: 10 },
                    ),
                ).toEqual([LIST_SUGGESTIONS[1], LIST_SUGGESTIONS[0]])

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[0].id,
                })

                expect(
                    await device.backgroundModules.customLists.fetchInitialListSuggestions(
                        { limit: 10 },
                    ),
                ).toEqual([LIST_SUGGESTIONS[0], LIST_SUGGESTIONS[1]])
            })

            it('should be able to update note share info, filtering out shared lists on unshare if requested else inheriting parent page lists', async ({
                device,
            }) => {
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'test-share-1',
                    })

                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                })
                await searchResults.init()
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[0].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[1].id,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    keepListsIfUnsharing: true,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.SHARED,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                    keepListsIfUnsharing: false,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id], // Private list should remain
                    }),
                )
            })

            it('should be able to save note as private in edit state, filtering out shared lists on unshare if requested else inheriting parent page lists', async ({
                device,
            }) => {
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'test-share-1',
                    })

                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                    withAuth: true,
                })
                await searchResults.init()
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[0].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[1].id,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    shouldShare: true,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    shouldShare: false,
                    keepListsIfUnsharing: true,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    shouldShare: true,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    shouldShare: false,
                    keepListsIfUnsharing: false,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id], // Private list should remain
                    }),
                )
            })

            it('should keep selectively shared annotation in "selectively shared" state upon main edit save btn press', async ({
                device,
            }) => {
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'test-share-1',
                    })

                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                    withAuth: true,
                })
                await searchResults.init()
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[0].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[1].id,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    isProtected: true,
                    shouldShare: false,
                    mainBtnPressed: true,
                })

                // Should be same as above still
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )
            })

            it('should be able to set note list state', async ({ device }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                const noteId = DATA.NOTE_2.url

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .lists,
                ).toEqual([])

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[0].id,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .lists,
                ).toEqual([DATA.LISTS_1[0].id])

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: DATA.LISTS_1[1].id,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .lists,
                ).toEqual([DATA.LISTS_1[0].id, DATA.LISTS_1[1].id])

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    deleted: DATA.LISTS_1[0].id,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .lists,
                ).toEqual([DATA.LISTS_1[1].id])
                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    deleted: DATA.LISTS_1[1].id,
                })
                expect(
                    searchResults.state.searchResults.noteData.byId[noteId]
                        .lists,
                ).toEqual([])
            })

            it('should set note to protected when adding a _shared_ list while note is private', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id, // This one is private - don't protect annot
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[1].id, // This one is shared - protect annot!
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[0].id,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[0].id],
                    }),
                )
            })

            it('should set note to protected when removing a _shared_ list while note is public', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[2])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'my-shared-list-0',
                    })
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[0].id,
                    protectAnnotation: false,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[1].id,
                    protectAnnotation: false,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[2].id,
                    protectAnnotation: false,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    deleted: DATA.LISTS_1[1].id,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[2].id],
                    }),
                )
            })

            it('should add shared list to parent page + public siblings when adding to private note, making note selectively shared', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[2])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'my-shared-list-0',
                    })
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
            })

            it('should remove shared list from page, auto-removing it from all children annotations, regardless of share state', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[2])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[0].id,
                        remoteId: 'my-shared-list-0',
                    })
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [noteIdA]: {
                                    isShared: { $set: true },
                                },
                                [noteIdB]: {
                                    isBulkShareProtected: { $set: true },
                                },
                            },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id,
                    protectAnnotation: false,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[1].id,
                    protectAnnotation: false,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[2].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[0].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[1].id,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: DATA.LISTS_1[2].id,
                })
                await searchResults.processEvent('setPageLists', {
                    id: pageIdA,
                    fullPageUrl: DATA.PAGE_1.fullUrl,
                    added: DATA.LISTS_1[2].id, // This list is private, so manually adding it to the page here
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )

                await searchResults.processEvent('setPageLists', {
                    id: pageIdA,
                    fullPageUrl: DATA.PAGE_1.fullUrl,
                    deleted: DATA.LISTS_1[2].id,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[0].id, DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            // This should still be here as it's private - removing from page shouldn't affect children annots
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [
                            DATA.LISTS_1[0].id,
                            DATA.LISTS_1[1].id,
                            // This should still be here as it's private - removing from page shouldn't affect children annots
                            DATA.LISTS_1[2].id,
                        ],
                    }),
                )

                await searchResults.processEvent('setPageLists', {
                    id: pageIdA,
                    fullPageUrl: DATA.PAGE_1.fullUrl,
                    deleted: DATA.LISTS_1[0].id,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[2].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[2].id],
                    }),
                )
            })

            it('should be able to add public note to shared space, also adding parent page+other public annots', async ({
                device,
            }) => {
                for (const listData of DATA.LISTS_1) {
                    await device.storageManager
                        .collection('customLists')
                        .createObject({ id: listData.id, name: listData.name })

                    if (listData.remoteId) {
                        await device.storageManager
                            .collection('sharedListMetadata')
                            .createObject({
                                localId: listData.id,
                                remoteId: listData.remoteId,
                            })
                    }
                }
                const { searchResults } = await setupTest(device, {
                    runInitLogic: true,
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })

                const privateListIdA = DATA.LISTS_1[0].id
                const publicListIdA = DATA.LISTS_1[1].id
                const publicListIdB = DATA.LISTS_1[2].id
                const noteId = DATA.NOTE_2.url
                const otherNoteIdA = DATA.NOTE_1.url
                const otherNoteIdB = DATA.NOTE_3.url
                const pageId = DATA.NOTE_2.pageUrl

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [noteId]: {
                                    isShared: { $set: true },
                                    isBulkShareProtected: { $set: false },
                                },
                                [otherNoteIdA]: {
                                    isShared: { $set: true },
                                    isBulkShareProtected: { $set: false },
                                },
                                [otherNoteIdB]: {
                                    isShared: { $set: true },
                                    isBulkShareProtected: { $set: false },
                                },
                            },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdA
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdB
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: publicListIdA,
                    protectAnnotation: false,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdA
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdB
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: privateListIdA,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA, privateListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdA
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdB
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    deleted: publicListIdA,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [privateListIdA],
                        isShared: false,
                        isBulkShareProtected: true,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdA
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdB
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId,
                    added: publicListIdB,
                })

                expect(
                    searchResults.state.searchResults.noteData.byId[noteId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [privateListIdA, publicListIdB],
                        isShared: false,
                        isBulkShareProtected: true,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdA
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA, publicListIdB],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[
                        otherNoteIdB
                    ],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA, publicListIdB],
                        isShared: true,
                        isBulkShareProtected: false,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageId],
                ).toEqual(
                    expect.objectContaining({
                        lists: [publicListIdA, publicListIdB],
                    }),
                )
            })

            it('should be able to make a selectively shared annotation private, removing any shared lists without touching sibling annots or parent page lists', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id, // This list is private - doesn't affect things
                })
                // Make note selectively shared, by choosing to protect it upon shared list add
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[1].id,
                    protectAnnotation: true,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId: noteIdA,
                    privacyLevel: AnnotationPrivacyLevels.PRIVATE,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
            })

            it('should be able to make a selectively shared annotation protected, removing any shared lists without touching sibling annots or parent page lists', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id, // This list is private - doesn't affect things
                })
                // Make note selectively shared, by choosing to protect it upon shared list add
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[1].id,
                    protectAnnotation: true,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('updateNoteShareInfo', {
                    noteId: noteIdA,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
            })

            it('should be able to make a selectively shared annotation protected via edit save btn, removing any shared lists without touching sibling annots or parent page lists', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[1])
                await device.storageManager
                    .collection('sharedListMetadata')
                    .createObject({
                        localId: DATA.LISTS_1[1].id,
                        remoteId: 'my-shared-list-1',
                    })

                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()

                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: { [noteIdB]: { isShared: { $set: true } } },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[0].id, // This list is private - doesn't affect things
                })
                // Make note selectively shared, by choosing to protect it upon shared list add
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: DATA.LISTS_1[1].id,
                    protectAnnotation: true,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[1].id, DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )

                await searchResults.processEvent('saveNoteEdit', {
                    noteId: noteIdA,
                    shouldShare: false,
                    isProtected: true,
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [DATA.LISTS_1[0].id],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: true,
                        lists: [DATA.LISTS_1[1].id],
                    }),
                )
            })

            it('should be able to add a private annotation to a private list, then share that list, making the annotations selectively shared and add the parent page to the list', async ({
                device,
            }) => {
                const testRemoteListId = 'remote-list-0'
                device.backgroundModules.contentSharing.remoteFunctions.shareList = async () =>
                    ({ remoteListId: testRemoteListId } as any)
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                })
                await device.storageManager
                    .collection('customLists')
                    .createObject(DATA.LISTS_1[0])

                const listIdA = DATA.LISTS_1[0].id
                const pageIdA = DATA.PAGE_1.normalizedUrl
                const noteIdA = DATA.NOTE_1.url
                const noteIdB = DATA.NOTE_2.url

                await searchResults.init()
                searchResults.processMutation({
                    searchResults: {
                        noteData: {
                            byId: {
                                [noteIdB]: {
                                    isBulkShareProtected: { $set: true },
                                },
                            },
                        },
                    },
                })

                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [],
                    }),
                )

                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdA,
                    added: listIdA,
                })
                await searchResults.processEvent('setNoteLists', {
                    noteId: noteIdB,
                    added: listIdA,
                })

                expect(
                    searchResults.state.listsSidebar.listData[listIdA],
                ).toEqual(
                    expect.objectContaining({
                        id: listIdA,
                        remoteId: undefined,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: false,
                        isShared: false,
                        lists: [listIdA],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [listIdA],
                    }),
                )

                await searchResults.processEvent('shareList', {
                    listId: listIdA,
                })

                expect(
                    searchResults.state.listsSidebar.listData[listIdA],
                ).toEqual(
                    expect.objectContaining({
                        id: listIdA,
                        remoteId: testRemoteListId,
                    }),
                )
                expect(
                    searchResults.state.searchResults.pageData.byId[pageIdA],
                ).toEqual(
                    expect.objectContaining({
                        lists: [listIdA],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdA],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [listIdA],
                    }),
                )
                expect(
                    searchResults.state.searchResults.noteData.byId[noteIdB],
                ).toEqual(
                    expect.objectContaining({
                        isBulkShareProtected: true,
                        isShared: false,
                        lists: [listIdA],
                    }),
                )
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
                    shouldShare: false,
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

            it('should block save of edited note state with login modal if logged out + save has share intent', async ({
                device,
            }) => {
                const { searchResults } = await setupTest(device, {
                    seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_2),
                    withAuth: false,
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

                expect(searchResults.state.modals.showLogin).toBe(false)
                await searchResults.processEvent('saveNoteEdit', {
                    noteId,
                    shouldShare: true,
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
                expect(searchResults.state.modals.showLogin).toBe(true)
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
