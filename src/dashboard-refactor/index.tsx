import React from 'react'
import styled from 'styled-components'
import { browser } from 'webextension-polyfill-ts'

import { StatefulUIElement } from 'src/util/ui-logic'
import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies, ListSource } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'
import HeaderContainer from './header'
import { runInBackground } from 'src/util/webextensionRPC'
import { Props as ListSidebarItemProps } from './lists-sidebar/components/lists-sidebar-item-with-menu'
import { ListData } from './lists-sidebar/types'
import * as searchResultUtils from './search-results/util'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import ShareListModalContent from 'src/overview/sharing/components/ShareListModalContent'
import { isDuringInstall } from 'src/overview/onboarding/utils'
import Onboarding from 'src/overview/onboarding'
import { HelpBtn } from 'src/overview/help-btn'
import FiltersBar from './header/filters-bar'
import { AnnotationsSidebarInDashboardResults as NotesSidebar } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'
import { AnnotationsSidebarContainer as NotesSidebarContainer } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarContainer'
import {
    AnnotationsCacheInterface,
    createAnnotationsCache,
} from 'src/annotations/annotations-cache'
import { updatePickerValues } from './util'
import Margin from './components/Margin'

const __unimplemented = () => undefined

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    static defaultProps: Partial<Props> = {
        localStorage: browser.storage.local,
        contentShareBG: runInBackground(),
        annotationsBG: runInBackground(),
        searchBG: runInBackground(),
        listsBG: runInBackground(),
        tagsBG: runInBackground(),
        authBG: runInBackground(),
    }

    private annotationsCache: AnnotationsCacheInterface
    private notesSidebarRef = React.createRef<NotesSidebarContainer>()

    constructor(props: Props) {
        super(props, new DashboardLogic(props))

        this.annotationsCache = createAnnotationsCache({
            annotations: props.annotationsBG,
            tags: props.tagsBG,
        })
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
        onShareClick: () =>
            this.processEvent('setShareListId', { listId: list.id }),
    })

    private renderFiltersBar() {
        const { searchFilters, listsSidebar } = this.state
        const { searchQuery } = searchFilters

        const toggleShowDatePicker = (id: number, isActive?: boolean) => {
            const value = isActive ?? !searchFilters.isDateFilterActive
            this.processEvent('toggleShowDatePicker', {
                isActive: value,
            })
        }
        const toggleShowDomainPicker = (id: number, isActive?: boolean) => {
            const value = isActive ?? !searchFilters.isDomainFilterActive
            this.processEvent('toggleShowDomainPicker', {
                isActive: value,
            })
        }
        const toggleShowTagPicker = (id: number, isActive?: boolean) => {
            const value = isActive ?? !searchFilters.isTagFilterActive
            this.processEvent('toggleShowTagPicker', {
                isActive: value,
            })
        }

        return (
            <FiltersBar
                isDisplayed={searchFilters.searchFiltersOpen}
                dateFilterSelectedState={{
                    isSelected: searchFilters.isDateFilterActive,
                    onSelection: toggleShowDatePicker,
                }}
                domainFilterSelectedState={{
                    isSelected: searchFilters.isDomainFilterActive,
                    onSelection: toggleShowDomainPicker,
                }}
                tagFilterSelectedState={{
                    isSelected: searchFilters.isTagFilterActive,
                    onSelection: toggleShowTagPicker,
                }}
                pickerProps={{
                    datePickerProps: {
                        startDate: searchFilters.dateFrom,
                        startDateText: searchFilters.dateFromInput,
                        endDate: searchFilters.dateTo,
                        endDateText: searchFilters.dateToInput,
                        onStartDateChange: (value) =>
                            this.processEvent('setDateFrom', {
                                value,
                                searchQuery,
                            }),
                        onStartDateTextChange: (value) =>
                            this.processEvent('setDateFromInputValue', {
                                value,
                                searchQuery,
                            }),
                        onEndDateChange: (value) =>
                            this.processEvent('setDateTo', {
                                value,
                                searchQuery,
                            }),
                        onEndDateTextChange: (value) =>
                            this.processEvent('setDateToInputValue', {
                                value,
                                searchQuery,
                            }),
                    },
                    domainPickerProps: {
                        onToggleShowPicker: toggleShowDomainPicker,
                        initialSelectedEntries: searchFilters.domainsIncluded,
                        onUpdateEntrySelection: (args) =>
                            this.processEvent('setDomainsIncluded', {
                                domains: updatePickerValues(args)(
                                    searchFilters.domainsIncluded,
                                ),
                                searchQuery,
                            }),
                    },
                    tagPickerProps: {
                        onToggleShowPicker: toggleShowTagPicker,
                        initialSelectedEntries: searchFilters.tagsIncluded,
                        onUpdateEntrySelection: (args) =>
                            this.processEvent('setTagsIncluded', {
                                tags: updatePickerValues(args)(
                                    searchFilters.tagsIncluded,
                                ),
                                searchQuery,
                            }),
                    },
                }}
            />
        )
    }

    private renderHeader() {
        const { searchFilters, listsSidebar } = this.state
        const selectedListName =
            listsSidebar.listData[listsSidebar.selectedListId]?.name

        return (
            <HeaderContainer
                searchBarProps={{
                    searchQuery: searchFilters.searchQuery,
                    searchFiltersOpen: searchFilters.searchFiltersOpen,
                    isSearchBarFocused: searchFilters.isSearchBarFocused,
                    cursorPositionState: {
                        startPosition: this.state.searchFilters
                            .cursorPositionStart,
                        endPosition: this.state.searchFilters.cursorPositionEnd,
                        onCursorStartPositionChange: (position: number) =>
                            this.processEvent('setCursorStartPosition', {
                                position,
                                searchQuery: searchFilters.searchQuery,
                            }),
                        onCursorEndPositionChange: (position: number) =>
                            this.processEvent('setCursorEndPosition', {
                                position,
                                searchQuery: searchFilters.searchQuery,
                            }),
                    },
                    onSearchBarFocus: () =>
                        this.processEvent('setSearchBarFocus', {
                            isFocused: true,
                        }),
                    toggleSearchFiltersBar: () =>
                        this.processEvent('setSearchFiltersOpen', {
                            isOpen: !searchFilters.searchFiltersOpen,
                        }),
                    onSearchQueryChange: (query) =>
                        this.processEvent('setSearchQuery', { query }),
                }}
                sidebarHeaderProps={{
                    sidebarLockedState: {
                        isSidebarLocked: listsSidebar.isSidebarLocked,
                        toggleSidebarLockedState: () =>
                            this.processEvent('setSidebarLocked', {
                                isLocked: !listsSidebar.isSidebarLocked,
                            }),
                    },
                    sidebarPeekState: {
                        isSidebarPeeking: listsSidebar.isSidebarPeeking,
                        setSidebarPeekState: (isPeeking) => () =>
                            this.processEvent('setSidebarPeeking', {
                                isPeeking,
                            }),
                    },
                    sidebarToggleHoverState: {
                        isHovered: listsSidebar.isSidebarToggleHovered,
                        onHoverEnter: () =>
                            this.processEvent('setSidebarToggleHovered', {
                                isHovered: true,
                            }),
                        onHoverLeave: () =>
                            this.processEvent('setSidebarToggleHovered', {
                                isHovered: false,
                            }),
                    },
                    selectedListName,
                }}
                syncStatusIconState="green"
                syncStatusMenuProps={{
                    displayState: {
                        isDisplayed: false,
                        toggleDisplayState: __unimplemented,
                    },
                    backupRunHoverState: {
                        isHovered: false,
                        onHoverEnter: __unimplemented,
                        onHoverLeave: __unimplemented,
                    },
                    syncRunHoverState: {
                        isHovered: false,
                        onHoverEnter: __unimplemented,
                        onHoverLeave: __unimplemented,
                    },
                    unSyncedItemState: {
                        onHideUnSyncedItemCount: __unimplemented,
                        onShowUnSyncedItemCount: __unimplemented,
                        showUnSyncedItemCount: false,
                        unSyncedItemCount: 0,
                    },
                    lastSuccessfulBackupDateTime: new Date(),
                    lastSuccessfulSyncDateTime: new Date(),
                    onInitiateBackup: __unimplemented,
                    onInitiateSync: __unimplemented,
                    backupState: 'disabled',
                    syncState: 'disabled',
                }}
            />
        )
    }

    private renderListsSidebar() {
        const { listsSidebar } = this.state

        const lockedState = {
            isSidebarLocked: listsSidebar.isSidebarLocked,
            toggleSidebarLockedState: () =>
                this.processEvent('setSidebarLocked', {
                    isLocked: !listsSidebar.isSidebarLocked,
                }),
        }

        return (
            <ListsSidebarContainer
                lockedState={lockedState}
                onListSelection={(listId) =>
                    this.processEvent('setSelectedListId', { listId })
                }
                selectedListId={listsSidebar.selectedListId}
                peekState={{
                    isSidebarPeeking: listsSidebar.isSidebarPeeking,
                    setSidebarPeekState: (isPeeking) => () =>
                        this.processEvent('setSidebarPeeking', {
                            isPeeking,
                        }),
                }}
                searchBarProps={{
                    searchQuery: listsSidebar.searchQuery,
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
                                isShown: !listsSidebar.localLists
                                    .isAddInputShown,
                            }),
                        confirmAddNewList: (value) =>
                            this.processEvent('confirmListCreate', { value }),
                        cancelAddNewList: () =>
                            this.processEvent('cancelListCreate', null),
                        isAddInputShown:
                            listsSidebar.localLists.isAddInputShown,
                        isExpanded: listsSidebar.localLists.isExpanded,
                        onExpandBtnClick: () =>
                            this.processEvent('setLocalListsExpanded', {
                                isExpanded: !listsSidebar.localLists.isExpanded,
                            }),
                        loadingState: listsSidebar.localLists.loadingState,
                        listsArray: listsSidebar.localLists.listIds.map(
                            (listId) =>
                                this.listStateToProps(
                                    listsSidebar.listData[listId],
                                    'local-lists',
                                ),
                        ),
                    },
                    {
                        title: 'Followed collections',
                        isExpanded: listsSidebar.followedLists.isExpanded,
                        onExpandBtnClick: () =>
                            this.processEvent('setFollowedListsExpanded', {
                                isExpanded: !listsSidebar.followedLists
                                    .isExpanded,
                            }),
                        loadingState: listsSidebar.followedLists.loadingState,
                        listsArray: listsSidebar.followedLists.listIds.map(
                            (listId) =>
                                this.listStateToProps(
                                    listsSidebar.listData[listId],
                                    'followed-list',
                                ),
                        ),
                    },
                ]}
            />
        )
    }

    private renderSearchResults() {
        const { searchResults } = this.state

        return (
            <SearchResultsContainer
                {...searchResults}
                paginateSearch={() =>
                    this.processEvent('search', { paginate: true })
                }
                areAllNotesShown={searchResultUtils.areAllNotesShown(
                    searchResults,
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
                    onNotesBtnClick: (day, pageId) => (e) => {
                        if (e.shiftKey) {
                            this.notesSidebarRef.current.toggleSidebarShowForPageId(
                                pageId,
                            )
                            return
                        }

                        this.processEvent('setPageNotesShown', {
                            day,
                            pageId,
                            areShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].areNotesShown,
                        })
                    },
                    onTagPickerBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageTagPickerShown', {
                            day,
                            pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isTagPickerShown,
                        }),
                    onListPickerBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageListPickerShown', {
                            day,
                            pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isListPickerShown,
                        }),
                    onCopyPasterBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageCopyPasterShown', {
                            day,
                            pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isCopyPasterShown,
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
                            fullPageUrl:
                                searchResults.pageData.byId[pageId].fullUrl,
                            ...args,
                        }),
                    onTagPickerUpdate: (pageId) => (args) =>
                        this.processEvent('setPageTags', {
                            id: pageId,
                            fullPageUrl:
                                searchResults.pageData.byId[pageId].fullUrl,
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
                            fullPageUrl:
                                searchResults.pageData.byId[pageId].fullUrl,
                        }),
                }}
                noteInteractionProps={{
                    onEditBtnClick: (noteId) => () =>
                        this.processEvent('setNoteEditing', {
                            noteId,
                            isEditing: true,
                        }),
                    onEditCancel: (noteId) => () =>
                        this.processEvent('cancelNoteEdit', {
                            noteId,
                        }),
                    onEditConfirm: (noteId) => () =>
                        this.processEvent('saveNoteEdit', {
                            noteId,
                        }),
                    onTagPickerBtnClick: (noteId) => () =>
                        this.processEvent('setNoteTagPickerShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isTagPickerShown,
                        }),
                    onCopyPasterBtnClick: (noteId) => () =>
                        this.processEvent('setNoteCopyPasterShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isCopyPasterShown,
                        }),
                    onReplyBtnClick: (noteId) => () =>
                        this.processEvent('setNoteRepliesShown', {
                            noteId,
                            areShown: !searchResults.noteData.byId[noteId]
                                .areRepliesShown,
                        }),
                    updateTags: (noteId) => (args) =>
                        this.processEvent('setNoteTags', { ...args, noteId }),
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
        const {
            deletingListId,
            deletingNoteArgs,
            deletingPageArgs,
            shareListId,
        } = this.state.modals

        if (deletingListId) {
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

        if (deletingNoteArgs) {
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

        if (deletingPageArgs) {
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

        if (shareListId) {
            const listData = this.state.listsSidebar.listData[shareListId]

            return (
                <ShareListModalContent
                    onClose={() => this.processEvent('setShareListId', {})}
                    isShared={listData.isShared}
                    listCreationState={listData.listCreationState}
                    listName={listData.name}
                    shareUrl={listData.shareUrl}
                    onGenerateLinkClick={() =>
                        this.processEvent('shareList', null)
                    }
                />
            )
        }

        return null
    }

    private renderDashboard() {
        return (
            <Container>
                {this.renderHeader()}
                {this.renderFiltersBar()}
                <Margin bottom="10px" />
                {this.renderListsSidebar()}
                {this.renderSearchResults()}
                {this.renderModals()}
                <NotesSidebar
                    tags={this.props.tagsBG}
                    auth={this.props.authBG}
                    refSidebar={this.notesSidebarRef}
                    customLists={this.props.listsBG}
                    annotations={this.props.annotationsBG}
                    annotationsCache={this.annotationsCache}
                    contentSharing={this.props.contentShareBG}
                    showAnnotationShareModal={() =>
                        this.processEvent('setShowNoteShareOnboardingModal', {
                            isShown: true,
                        })
                    }
                    showBetaFeatureNotifModal={() =>
                        this.processEvent('setShowBetaFeatureModal', {
                            isShown: true,
                        })
                    }
                />
                <HelpBtn />
            </Container>
        )
    }

    render() {
        if (isDuringInstall()) {
            return (
                <>
                    <Onboarding />
                    <HelpBtn />
                </>
            )
        }

        return this.renderDashboard()
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
`
