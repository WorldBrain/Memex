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
import { Props as ListSidebarItemProps } from './lists-sidebar/components/sidebar-item-with-menu'
import { ListData } from './lists-sidebar/types'
import * as searchResultUtils from './search-results/util'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import ShareListModalContent from 'src/overview/sharing/components/ShareListModalContent'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
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
import { updatePickerValues, areSearchFiltersEmpty } from './util'
import Margin from './components/Margin'
import analytics from 'src/analytics'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { deriveStatusIconColor } from './header/sync-status-menu/util'
import { FILTER_PICKERS_LIMIT } from './constants'
import BetaFeatureNotifModal from 'src/overview/sharing/components/BetaFeatureNotifModal'

const __unimplemented = () => undefined

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    static defaultProps: Partial<Props> = {
        document,
        analytics,
        copyToClipboard,
        localStorage: browser.storage.local,
        activityIndicatorBG: runInBackground(),
        contentShareBG: runInBackground(),
        annotationsBG: runInBackground(),
        searchBG: runInBackground(),
        backupBG: runInBackground(),
        listsBG: runInBackground(),
        tagsBG: runInBackground(),
        authBG: runInBackground(),
        syncBG: runInBackground(),
        openFeedUrl: () =>
            window.open(
                process.env.NODE_ENV === 'production'
                    ? 'https://memex.social/feed'
                    : 'https://staging.memex.social/feed',
                '_blank',
            ),
    }

    private annotationsCache: AnnotationsCacheInterface
    private notesSidebarRef = React.createRef<NotesSidebarContainer>()

    private bindRouteGoTo = (route: 'import' | 'sync' | 'backup') => () => {
        window.location.hash = '#/' + route
    }

    constructor(props: Props) {
        super(props, new DashboardLogic(props))

        this.annotationsCache = createAnnotationsCache({
            contentSharing: props.contentShareBG,
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
            errorMessage: this.state.listsSidebar.editListErrorMessage,
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
        const { searchBG } = this.props
        const { searchFilters } = this.state

        const toggleTagsFilter = () =>
            this.processEvent('toggleShowTagPicker', {
                isActive: !searchFilters.isTagFilterActive,
            })
        const toggleDatesFilter = () =>
            this.processEvent('toggleShowDatePicker', {
                isActive: !searchFilters.isDateFilterActive,
            })
        const toggleDomainsFilter = () =>
            this.processEvent('toggleShowDomainPicker', {
                isActive: !searchFilters.isDomainFilterActive,
            })

        return (
            <FiltersBar
                isDisplayed={searchFilters.searchFiltersOpen}
                showTagsFilter={searchFilters.isTagFilterActive}
                showDatesFilter={searchFilters.isDateFilterActive}
                showDomainsFilter={searchFilters.isDomainFilterActive}
                toggleTagsFilter={toggleTagsFilter}
                toggleDatesFilter={toggleDatesFilter}
                toggleDomainsFilter={toggleDomainsFilter}
                datePickerProps={{
                    onClickOutside: toggleDatesFilter,
                    onEscapeKeyDown: toggleDatesFilter,
                    startDate: searchFilters.dateFrom,
                    startDateText: searchFilters.dateFromInput,
                    endDate: searchFilters.dateTo,
                    endDateText: searchFilters.dateToInput,
                    onStartDateChange: (value) =>
                        this.processEvent('setDateFrom', { value }),
                    onStartDateTextChange: (value) =>
                        this.processEvent('setDateFromInputValue', {
                            value,
                        }),
                    onEndDateChange: (value) =>
                        this.processEvent('setDateTo', { value }),
                    onEndDateTextChange: (value) =>
                        this.processEvent('setDateToInputValue', { value }),
                }}
                domainPickerProps={{
                    onClickOutside: toggleDomainsFilter,
                    onEscapeKeyDown: toggleDomainsFilter,
                    initialSelectedEntries: () => searchFilters.domainsIncluded,
                    queryEntries: (query) =>
                        searchBG.suggest({
                            query,
                            type: 'domain',
                            limit: FILTER_PICKERS_LIMIT,
                        }),
                    loadDefaultSuggestions: () =>
                        searchBG.extendedSuggest({
                            type: 'domain',
                            limit: FILTER_PICKERS_LIMIT,
                            notInclude: [
                                ...searchFilters.domainsIncluded,
                                ...searchFilters.domainsExcluded,
                            ],
                        }),
                    onUpdateEntrySelection: (args) =>
                        this.processEvent('setDomainsIncluded', {
                            domains: updatePickerValues(args)(args.selected),
                        }),
                }}
                tagPickerProps={{
                    onClickOutside: toggleTagsFilter,
                    onEscapeKeyDown: toggleTagsFilter,
                    initialSelectedEntries: () => searchFilters.tagsIncluded,
                    queryEntries: (query) =>
                        searchBG.suggest({
                            query,
                            type: 'tag',
                            limit: FILTER_PICKERS_LIMIT,
                        }),
                    loadDefaultSuggestions: () =>
                        searchBG.extendedSuggest({
                            type: 'tag',
                            limit: FILTER_PICKERS_LIMIT,
                            notInclude: [
                                ...searchFilters.tagsIncluded,
                                ...searchFilters.tagsExcluded,
                            ],
                        }),
                    onUpdateEntrySelection: (args) =>
                        this.processEvent('setTagsIncluded', {
                            tags: updatePickerValues(args)(args.selected),
                        }),
                }}
            />
        )
    }

    private renderHeader() {
        const { searchFilters, listsSidebar, syncMenu } = this.state
        const selectedListName =
            listsSidebar.listData[listsSidebar.selectedListId]?.name

        return (
            <HeaderContainer
                searchBarProps={{
                    searchQuery: searchFilters.searchQuery,
                    searchFiltersOpen: searchFilters.searchFiltersOpen,
                    isSearchBarFocused: searchFilters.isSearchBarFocused,
                    onSearchBarFocus: () =>
                        this.processEvent('setSearchBarFocus', {
                            isFocused: true,
                        }),
                    onSearchFiltersOpen: () =>
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
                syncStatusIconState={deriveStatusIconColor(syncMenu)}
                syncStatusMenuProps={{
                    ...syncMenu,
                    outsideClickIgnoreClass:
                        HeaderContainer.SYNC_MENU_TOGGLE_BTN_CLASS,
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
                    onClickOutside: () =>
                        this.processEvent('setSyncStatusMenuDisplayState', {
                            isShown: false,
                        }),
                    onToggleAutoBackup: () =>
                        this.processEvent('toggleAutoBackup', null),
                    onToggleDisplayState: () =>
                        this.processEvent('setSyncStatusMenuDisplayState', {
                            isShown: !syncMenu.isDisplayed,
                        }),
                    onHideUnsyncedItemCount: () =>
                        this.processEvent('setUnsyncedItemCountShown', {
                            isShown: false,
                        }),
                    onShowUnsyncedItemCount: () =>
                        this.processEvent('setUnsyncedItemCountShown', {
                            isShown: true,
                        }),
                    onInitiateBackup: () =>
                        this.processEvent('initiateBackup', null),
                    onInitiateSync: () =>
                        this.processEvent('initiateSync', null),
                    goToBackupRoute: this.bindRouteGoTo('backup'),
                    goToSyncRoute: this.bindRouteGoTo('sync'),
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
                {...listsSidebar}
                lockedState={lockedState}
                openFeedUrl={this.props.openFeedUrl}
                onAllSavedSelection={() =>
                    this.processEvent('resetFilters', null)
                }
                isAllSavedSelected={areSearchFiltersEmpty(this.state)}
                onListSelection={(listId) =>
                    this.processEvent('setSelectedListId', { listId })
                }
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
                        ...listsSidebar.localLists,
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
                        onExpandBtnClick: () =>
                            this.processEvent('setLocalListsExpanded', {
                                isExpanded: !listsSidebar.localLists.isExpanded,
                            }),
                        listsArray: listsSidebar.localLists.filteredListIds.map(
                            (listId) =>
                                this.listStateToProps(
                                    listsSidebar.listData[listId],
                                    'local-lists',
                                ),
                        ),
                    },
                    // {
                    //     ...listsSidebar.followedLists,
                    //     title: 'Followed collections',
                    //     onExpandBtnClick: () =>
                    //         this.processEvent('setFollowedListsExpanded', {
                    //             isExpanded: !listsSidebar.followedLists
                    //                 .isExpanded,
                    //         }),
                    //     listsArray: listsSidebar.followedLists.listIds.map(
                    //         (listId) =>
                    //             this.listStateToProps(
                    //                 listsSidebar.listData[listId],
                    //                 'followed-list',
                    //             ),
                    //     ),
                    // },
                ]}
                initDropReceivingState={(listId) => ({
                    onDragEnter: () =>
                        this.processEvent('setDragOverListId', { listId }),
                    onDragLeave: () =>
                        this.processEvent('setDragOverListId', {
                            listId: undefined,
                        }),
                    onDrop: (dataTransfer: DataTransfer) =>
                        this.processEvent('dropPageOnListItem', {
                            listId,
                            dataTransfer,
                        }),
                    isDraggedOver:
                        listId === this.state.listsSidebar.dragOverListId,
                })}
            />
        )
    }

    private renderSearchResults() {
        const { searchResults, listsSidebar } = this.state

        return (
            <SearchResultsContainer
                goToImportRoute={this.bindRouteGoTo('import')}
                isSearchFilteredByList={listsSidebar.selectedListId != null}
                {...searchResults}
                onDismissMobileAd={() =>
                    this.processEvent('dismissMobileAd', null)
                }
                onDismissOnboardingMsg={() =>
                    this.processEvent('dismissOnboardingMsg', null)
                }
                noResultsType={this.state.searchResults.noResultsType}
                filterSearchByTag={(tag) =>
                    this.processEvent('addIncludedTag', { tag })
                }
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
                onPageLinkCopy={(link) =>
                    this.processEvent('copyShareLink', {
                        link,
                        analyticsAction: 'copyPageLink',
                    })
                }
                onNoteLinkCopy={(link) =>
                    this.processEvent('copyShareLink', {
                        link,
                        analyticsAction: 'copyNoteLink',
                    })
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
                    onShareBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageShareMenuShown', {
                            day,
                            pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isShareMenuShown,
                        }),
                    onMainContentHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageId,
                            hover: 'main-content',
                        }),
                    onFooterHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageId,
                            hover: 'footer',
                        }),
                    onTagsHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageId,
                            hover: 'tags',
                        }),
                    onUnhover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageId,
                            hover: null,
                        }),
                    onRemoveFromListBtnClick: (day, pageId) => () =>
                        this.processEvent('removePageFromList', {
                            day,
                            pageId,
                        }),
                    onPageDrag: (day, pageId) => (e) =>
                        this.processEvent('dragPage', {
                            day,
                            pageId,
                            dataTransfer: e.dataTransfer,
                        }),
                    onPageDrop: (day, pageId) => () =>
                        this.processEvent('dropPage', { day, pageId }),
                    updatePageNotesShareInfo: (day, pageId) => (info) =>
                        this.processEvent('updatePageNotesShareInfo', {
                            day,
                            pageId,
                            info,
                        }),
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
                    onGoToHighlightClick: (noteId) => () =>
                        this.processEvent('goToHighlightInNewTab', { noteId }),
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
                        this.processEvent('setNoteShareMenuShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isShareMenuShown,
                        }),
                    updateShareInfo: (noteId) => (info) =>
                        this.processEvent('updateNoteShareInfo', {
                            noteId,
                            info,
                        }),
                    onMainContentHover: (noteId) => () =>
                        this.processEvent('setNoteHover', {
                            noteId,
                            hover: 'main-content',
                        }),
                    onFooterHover: (noteId) => () =>
                        this.processEvent('setNoteHover', {
                            noteId,
                            hover: 'footer',
                        }),
                    onTagsHover: (noteId) => () =>
                        this.processEvent('setNoteHover', {
                            noteId,
                            hover: 'tags',
                        }),
                    onNoteHover: (noteId) => () =>
                        this.processEvent('setNoteHover', {
                            noteId,
                            hover: 'note',
                        }),
                    onUnhover: (noteId) => () =>
                        this.processEvent('setNoteHover', {
                            noteId,
                            hover: null,
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
        const { modals: modalsState, listsSidebar } = this.state

        if (modalsState.deletingListId) {
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

        if (modalsState.deletingNoteArgs) {
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

        if (modalsState.deletingPageArgs) {
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

        if (modalsState.shareListId) {
            const listData = listsSidebar.listData[modalsState.shareListId]

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

        if (modalsState.showSubscription) {
            return (
                <SubscribeModal
                    onClose={() =>
                        this.processEvent('setShowSubscriptionModal', {
                            isShown: false,
                        })
                    }
                />
            )
        }

        if (modalsState.showBetaFeature) {
            return (
                <BetaFeatureNotifModal
                    showSubscriptionModal={() =>
                        this.processEvent('setShowSubscriptionModal', {
                            isShown: true,
                        })
                    }
                    onClose={() =>
                        this.processEvent('setShowBetaFeatureModal', {
                            isShown: false,
                        })
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
                <DragElement id="dragged-element">
                    {' '}
                    Drop into Collection
                </DragElement>
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
    background-color: #f6f8fb;
    min-height: 100vh;
    height: 100%;
`

const DragElement = styled.div<{ id: 'dragged-element' }>`
    text-decoration: none;
    display: none;
    border: solid 2px ${(props) => props.theme.colors.purple};
    border-radius: 4px;
    font-size: 0.8rem;
    max-height: 50px;
    max-width: 330px;
    text-align: center;
    font-weight: 500;
    background: #fff;
    color: ${(props) => props.theme.colors.purple};
    top: -90vh;
    opacity: 1;
    padding: 5px 10px;
    position: absolute;
    margin-left: 25px;
`
