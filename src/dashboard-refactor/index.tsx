import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'

import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies, ListSource } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'
import { runInBackground } from 'src/util/webextensionRPC'
import { Props as ListSidebarItemProps } from './lists-sidebar/components/lists-sidebar-item-with-menu'
import { ListData } from './lists-sidebar/types'
import * as searchResultUtils from './search-results/util'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    static defaultProps: Partial<Props> = {
        annotationsBG: runInBackground(),
        searchBG: runInBackground(),
        listsBG: runInBackground(),
        tagsBG: runInBackground(),
    }

    constructor(props: Props) {
        super(props, new DashboardLogic(props))
    }

    private listStateToProps = (
        list: ListData,
        source: ListSource,
    ): ListSidebarItemProps => ({
        source,
        listId: list.id,
        name: list.name,
        isEditing: this.state.listsSidebar.editingListId === list.id,
        isMenuDisplayed: this.state.listsSidebar.showMoreMenuListId === list.id,
        selectedState: {
            isSelected: this.state.listsSidebar.selectedListId === list.id,
            onSelection: (listId) =>
                this.processEvent('setSelectedListId', { listId }),
        },
        editableProps: {
            onCancelClick: () => this.processEvent('cancelListEdit', null),
            onConfirmClick: (value) =>
                this.processEvent('confirmListEdit', { value }),
            initValue: list.name,
        },
        onRenameClick: () =>
            this.processEvent('setEditingListId', { listId: list.id }),
        onMoreActionClick: () =>
            this.processEvent('setShowMoreMenuListId', { listId: list.id }),
        onDeleteClick: () =>
            this.processEvent('setDeletingListId', { listId: list.id }),
    })

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
                onListSelection={(listId) =>
                    this.processEvent('setSelectedListId', { listId })
                }
                selectedListId={this.state.listsSidebar.selectedListId}
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
                    onCreateNew: (value) =>
                        this.processEvent('confirmListCreate', { value }),
                    onFocus: () => null,
                    onSearchQueryChange: (query) =>
                        this.processEvent('setListQueryValue', { query }),
                    onInputClear: () =>
                        this.processEvent('setListQueryValue', { query: '' }),
                }}
                listsGroups={[
                    {
                        title: 'My collections',
                        onAddBtnClick: () =>
                            this.processEvent('setAddListInputShown', {
                                isShown: !this.state.listsSidebar.localLists
                                    .isAddInputShown,
                            }),
                        confirmAddNewList: (value) =>
                            this.processEvent('confirmListCreate', { value }),
                        cancelAddNewList: () =>
                            this.processEvent('cancelListCreate', null),
                        isAddInputShown: this.state.listsSidebar.localLists
                            .isAddInputShown,
                        isExpanded: this.state.listsSidebar.localLists
                            .isExpanded,
                        onExpandBtnClick: () =>
                            this.processEvent('setLocalListsExpanded', {
                                isExpanded: !this.state.listsSidebar.localLists
                                    .isExpanded,
                            }),
                        loadingState: this.state.listsSidebar.localLists
                            .loadingState,
                        listsArray: this.state.listsSidebar.localLists.listIds.map(
                            (listId) =>
                                this.listStateToProps(
                                    this.state.listsSidebar.listData[listId],
                                    'local-lists',
                                ),
                        ),
                    },
                    {
                        title: 'Followed collections',
                        isExpanded: this.state.listsSidebar.followedLists
                            .isExpanded,
                        onExpandBtnClick: () =>
                            this.processEvent('setFollowedListsExpanded', {
                                isExpanded: !this.state.listsSidebar
                                    .followedLists.isExpanded,
                            }),
                        loadingState: this.state.listsSidebar.followedLists
                            .loadingState,
                        listsArray: this.state.listsSidebar.followedLists.listIds.map(
                            (listId) =>
                                this.listStateToProps(
                                    this.state.listsSidebar.listData[listId],
                                    'followed-list',
                                ),
                        ),
                    },
                ]}
            />
        )
    }

    private renderSearchResults() {
        return (
            <SearchResultsContainer
                {...this.state.searchResults}
                areAllNotesShown={searchResultUtils.areAllNotesShown(
                    this.state.searchResults,
                )}
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
                    this.processEvent('setAllNotesShown', null)
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
                        this.processEvent('setDeletingPageArgs', {
                            day,
                            pageId,
                        }),
                    onShareBtnClick: (day, pageId) => () => null, // TODO: figure out share btn
                }}
                pagePickerProps={{
                    onListPickerUpdate: (pageId) => (args) =>
                        this.processEvent('setPageLists', {
                            id: pageId,
                            fullPageUrl: this.state.searchResults.pageData.byId[
                                pageId
                            ].fullUrl,
                            ...args,
                        }),
                    onTagPickerUpdate: (pageId) => (args) =>
                        this.processEvent('setPageTags', {
                            id: pageId,
                            ...args,
                        }),
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
                            fullPageUrl: this.state.searchResults.pageData.byId[
                                pageId
                            ].fullUrl,
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
                    onReplyBtnClick: (noteId) => () =>
                        this.processEvent('setNoteRepliesShown', {
                            noteId,
                            areShown: !this.state.searchResults.noteData.byId[
                                noteId
                            ].areRepliesShown,
                        }),
                    onTrashBtnClick: (noteId, day, pageId) => () =>
                        this.processEvent('setDeletingNoteArgs', {
                            noteId,
                            pageId,
                            day,
                        }),
                    onCommentChange: (noteId) => (e) =>
                        this.processEvent('setNoteEditCommentValue', {
                            noteId,
                            value: (e.target as HTMLTextAreaElement).value,
                        }),
                    onShareBtnClick: (noteId) => () =>
                        this.processEvent('showNoteShareMenu', { noteId }),
                    hideShareMenu: (noteId) => () =>
                        this.processEvent('hideNoteShareMenu', { noteId }),
                    updateShareInfo: (noteId) => (info) =>
                        this.processEvent('updateNoteShareInfo', {
                            noteId,
                            info,
                        }),
                    copySharedLink: (noteId) => (link) =>
                        this.processEvent('copySharedNoteLink', {
                            noteId,
                            link,
                        }),
                }}
                notePickerProps={{
                    onTagPickerUpdate: (noteId) => (args) =>
                        this.processEvent('setNoteTags', { noteId, ...args }),
                }}
            />
        )
    }

    private renderModals() {
        if (this.state.modals.deletingListId) {
            return (
                <DeleteConfirmModal
                    isShown
                    message="Delete collection? This does not delete the pages in it"
                    onClose={() => this.processEvent('cancelListDelete', null)}
                    deleteDocs={() =>
                        this.processEvent('confirmListDelete', null)
                    }
                />
            )
        }

        if (this.state.modals.deletingNoteArgs) {
            return (
                <DeleteConfirmModal
                    isShown
                    message="Delete note?"
                    onClose={() => this.processEvent('cancelNoteDelete', null)}
                    deleteDocs={() =>
                        this.processEvent('confirmNoteDelete', null)
                    }
                />
            )
        }

        if (this.state.modals.deletingPageArgs) {
            return (
                <DeleteConfirmModal
                    isShown
                    message="Delete page and related notes?"
                    onClose={() => this.processEvent('cancelPageDelete', null)}
                    deleteDocs={() =>
                        this.processEvent('confirmPageDelete', null)
                    }
                />
            )
        }

        return null
    }

    render() {
        return (
            <>
                {this.renderListsSidebar()}
                {this.renderSearchResults()}
                {this.renderModals()}
            </>
        )
    }
}
