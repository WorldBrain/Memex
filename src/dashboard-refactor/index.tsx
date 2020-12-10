import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'

import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    constructor(props: Props) {
        super(props, new DashboardLogic(props))
    }

    private renderListsSidebar() {
        const lockedState = {
            isSidebarLocked: this.state.listsSidebar.isSidebarLocked,
            toggleSidebarLockedState: () =>
                this.processEvent('setSidebarLocked', {
                    isLocked: !this.state.listsSidebar.isSidebarLocked,
                }),
        }

        return (
            <ListsSidebarContainer
                lockedState={lockedState}
                peekState={{
                    isSidebarPeeking: this.state.listsSidebar.isSidebarPeeking,
                    toggleSidebarPeekState: () =>
                        this.processEvent('setSidebarPeeking', {
                            isPeeking: !this.state.listsSidebar
                                .isSidebarPeeking,
                        }),
                }}
                searchBarProps={{
                    searchQuery: this.state.listsSidebar.searchQuery,
                    sidebarLockedState: lockedState,
                    isSearchBarFocused: false,
                    hasPerfectMatch: true,
                    onCreateNew: () => this.processEvent('addNewList', null),
                    onFocus: () => null,
                    onSearchQueryChange: (query) =>
                        this.processEvent('setSearchQuery', { query }),
                    onInputClear: () => null,
                }}
                listsGroups={[
                    {
                        isExpanded: true,
                        loadingState: 'pristine',
                        listsArray: [],
                    },
                    {
                        title: 'My collections',
                        onAddBtnClick: () =>
                            this.processEvent('addNewList', null),
                        isExpanded: true,
                        onExpandBtnClick: () =>
                            this.processEvent('setLocalListsExpanded', {
                                isExpanded: !this.state.listsSidebar.localLists
                                    .isExpanded,
                            }),
                        loadingState: this.state.listsSidebar.localLists
                            .loadingState,
                        listsArray: [], // TODO: sort out types and properly derive this from `state.listData`
                    },
                    {
                        title: 'Followed collections',
                        isExpanded: true,
                        onExpandBtnClick: () =>
                            this.processEvent('setFollowedListsExpanded', {
                                isExpanded: !this.state.listsSidebar
                                    .followedLists.isExpanded,
                            }),
                        loadingState: this.state.listsSidebar.followedLists
                            .loadingState,
                        listsArray: [], // TODO: sort out types and properly derive this from `state.listData`
                    },
                ]}
            />
        )
    }

    private renderSearchResults() {
        return (
            <SearchResultsContainer
                {...this.state.searchResults}
                onPageNotesSortSelection={(day, pageId) => (sortingFn) =>
                    this.processEvent('setPageNotesSort', {
                        day,
                        pageId,
                        sortingFn,
                    })}
                onPageNotesTypeSelection={(day, pageId) => (noteType) =>
                    this.processEvent('setPageNotesType', {
                        day,
                        pageId,
                        noteType,
                    })}
                onShowAllNotesClick={() =>
                    this.processEvent('setAllNotesShown', {
                        areShown: !this.state.searchResults.areAllNotesShown,
                    })
                }
                onNotesSearchSwitch={() =>
                    this.processEvent('setSearchType', { searchType: 'notes' })
                }
                onPagesSearchSwitch={() =>
                    this.processEvent('setSearchType', { searchType: 'pages' })
                }
                pageInteractionProps={{
                    onBookmarkBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageBookmark', {
                            id: pageId,
                            isBookmarked: !this.state.searchResults.pageData
                                .byId[pageId].isBookmarked,
                        }),
                    onNotesBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageNotesShown', {
                            day,
                            pageId,
                            areShown: !this.state.searchResults.results[day]
                                .pages.byId[pageId].areNotesShown,
                        }),
                    onTagPickerBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageTagPickerShown', {
                            day,
                            pageId,
                            isShown: !this.state.searchResults.results[day]
                                .pages.byId[pageId].isTagPickerShown,
                        }),
                    onListPickerBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageListPickerShown', {
                            day,
                            pageId,
                            isShown: !this.state.searchResults.results[day]
                                .pages.byId[pageId].isListPickerShown,
                        }),
                    onCopyPasterBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageCopyPasterShown', {
                            day,
                            pageId,
                            isShown: !this.state.searchResults.results[day]
                                .pages.byId[pageId].isCopyPasterShown,
                        }),
                    onTrashBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageDeleteModalShown', {
                            id: pageId,
                            isShown: !this.state.searchResults.pageData.byId[
                                pageId
                            ].isDeleteModalShown,
                        }),
                    onShareBtnClick: (day, pageId) => () => null, // TODO: figure out share btn
                }}
                newNoteInteractionProps={{
                    onCancel: (day, pageId) => () =>
                        this.processEvent('cancelPageNewNote', {
                            day,
                            pageId,
                        }),
                    onCommentChange: (day, pageId) => (value) =>
                        this.processEvent('setPageNewNoteCommentValue', {
                            day,
                            pageId,
                            value,
                        }),
                    onTagsUpdate: (day, pageId) => (tags) =>
                        this.processEvent('setPageNewNoteTags', {
                            day,
                            pageId,
                            tags,
                        }),
                    onSave: (day, pageId) => () =>
                        this.processEvent('savePageNewNote', {
                            day,
                            pageId,
                        }),
                }}
                noteInteractionProps={{
                    onEditBtnClick: (noteId) => () =>
                        this.processEvent('setNoteEditing', {
                            noteId,
                            isEditing: true,
                        }),
                    onTagPickerBtnClick: (noteId) => () =>
                        this.processEvent('setNoteTagPickerShown', {
                            noteId,
                            isShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].isTagPickerShown,
                        }),
                    onBookmarkBtnClick: (noteId) => () =>
                        this.processEvent('setNoteBookmark', {
                            noteId,
                            isBookmarked: !this.state.searchResults.noteData
                                .byId[noteId].isBookmarked,
                        }),
                    onCopyPasterBtnClick: (noteId) => () =>
                        this.processEvent('setNoteCopyPasterShown', {
                            noteId,
                            isShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].isCopyPasterShown,
                        }),
                    onListPickerBtnClick: (noteId) => () =>
                        this.processEvent('setNoteListPickerShown', {
                            noteId,
                            isShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].isListPickerShown,
                        }),
                    onReplyBtnClick: (noteId) => () =>
                        this.processEvent('setNoteRepliesShown', {
                            noteId,
                            areShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].areRepliesShown,
                        }),
                    onTrashBtnClick: (noteId) => () =>
                        this.processEvent('setNoteDeleteModalShown', {
                            noteId,
                            isShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].isDeleteModalShown,
                        }),
                    onCommentChange: (noteId) => (e) =>
                        this.processEvent('setNoteEditCommentValue', {
                            noteId,
                            value: (e.target as HTMLTextAreaElement).value,
                        }),
                    onShareBtnClick: (noteId) => () => null, // TODO
                }}
                tagPickerDependencies={{} as any} // TODO
            />
        )
    }

    render() {
        return (
            <>
                {this.renderListsSidebar()}
                {this.renderSearchResults()}
            </>
        )
    }
}
