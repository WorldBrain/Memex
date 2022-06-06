import React from 'react'
import styled from 'styled-components'
import { browser } from 'webextension-polyfill-ts'
import ListShareModal from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal'
import { createGlobalStyle } from 'styled-components'
import type { UIMutation } from 'ui-logic-core'

import { StatefulUIElement } from 'src/util/ui-logic'
import { DashboardLogic } from './logic'
import { RootState, Events, DashboardDependencies, ListSource } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'
import HeaderContainer from './header'
import { runInBackground } from 'src/util/webextensionRPC'
import { Props as ListSidebarItemProps } from './lists-sidebar/components/sidebar-item-with-menu'
import { shareListAndAllEntries } from './lists-sidebar/util'
import * as searchResultUtils from './search-results/util'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import Onboarding from 'src/overview/onboarding'
import { HelpBtn } from 'src/overview/help-btn'
import FiltersBar from './header/filters-bar'
import { AnnotationsSidebarInDashboardResults as NotesSidebar } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'
import { AnnotationsSidebarContainer as NotesSidebarContainer } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarContainer'
import {
    AnnotationsCacheInterface,
    createAnnotationsCache,
} from 'src/annotations/annotations-cache'
import {
    updatePickerValues,
    areSearchFiltersEmpty,
    stateToSearchParams,
} from './util'
import analytics from 'src/analytics'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { deriveStatusIconColor } from './header/sync-status-menu/util'
import { FILTER_PICKERS_LIMIT } from './constants'
import DragElement from './components/DragElement'
import Margin from './components/Margin'
import { getFeedUrl, getListShareUrl } from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { Props as ListDetailsProps } from './search-results/components/list-details'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import LoginModal from 'src/overview/sharing/components/LoginModal'
import CloudOnboardingModal from 'src/personal-cloud/ui/onboarding'
import DisplayNameModal from 'src/overview/sharing/components/DisplayNameModal'
import PdfLocator from './components/PdfLocator'
import ConfirmModal from 'src/common-ui/components/ConfirmModal'
import ConfirmDialog from 'src/common-ui/components/ConfirmDialog'
import {
    PRIVATIZE_ANNOT_MSG,
    SELECT_SPACE_ANNOT_MSG,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    SELECT_SPACE_ANNOT_SUBTITLE,
    SELECT_SPACE_NEGATIVE_LABEL,
    SELECT_SPACE_AFFIRM_LABEL,
} from 'src/overview/sharing/constants'
import type { ListDetailsGetter } from 'src/annotations/types'

export interface Props extends DashboardDependencies {}

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    static MEMEX_SOCIAL_URL =
        process.env.NODE_ENV === 'production'
            ? 'https://memex.social'
            : 'https://staging.memex.social'

    static defaultProps: Pick<
        Props,
        | 'analytics'
        | 'copyToClipboard'
        | 'document'
        | 'location'
        | 'localStorage'
        | 'contentConversationsBG'
        | 'activityIndicatorBG'
        | 'personalCloudBG'
        | 'contentShareBG'
        | 'syncSettingsBG'
        | 'annotationsBG'
        | 'pdfViewerBG'
        | 'searchBG'
        | 'backupBG'
        | 'listsBG'
        | 'tagsBG'
        | 'authBG'
        | 'openFeed'
        | 'openCollectionPage'
    > = {
        analytics,
        copyToClipboard,
        document: window.document,
        location: window.location,
        localStorage: browser.storage.local,
        contentConversationsBG: runInBackground(),
        activityIndicatorBG: runInBackground(),
        personalCloudBG: runInBackground(),
        contentShareBG: runInBackground(),
        syncSettingsBG: runInBackground(),
        annotationsBG: runInBackground(),
        pdfViewerBG: runInBackground(),
        searchBG: runInBackground(),
        backupBG: runInBackground(),
        listsBG: runInBackground(),
        tagsBG: runInBackground(),
        authBG: runInBackground(),
        openFeed: () => window.open(getFeedUrl(), '_blank'),
        openCollectionPage: (remoteListId) =>
            window.open(getListShareUrl({ remoteListId }), '_blank'),
    }

    private annotationsCache: AnnotationsCacheInterface
    private notesSidebarRef = React.createRef<NotesSidebarContainer>()

    private bindRouteGoTo = (route: 'import' | 'sync' | 'backup') => () => {
        window.location.hash = '#/' + route
    }

    constructor(props: Props) {
        super(props, new DashboardLogic(props))

        this.annotationsCache = createAnnotationsCache(
            {
                contentSharing: props.contentShareBG,
                annotations: props.annotationsBG,
                customLists: props.listsBG,
                tags: props.tagsBG,
            },
            { skipPageIndexing: true },
        )
    }

    private getListDetailsById: ListDetailsGetter = (id) => ({
        name: this.state.listsSidebar.listData[id]?.name ?? 'Missing list',
        isShared: this.state.listsSidebar.listData[id]?.remoteId != null,
    })

    private getListDetailsProps = (): ListDetailsProps | null => {
        const { listsSidebar } = this.state

        if (
            listsSidebar.selectedListId == null ||
            Object.values(SPECIAL_LIST_IDS).includes(
                listsSidebar.selectedListId,
            )
        ) {
            return null
        }

        const listData = listsSidebar.listData[listsSidebar.selectedListId]
        const remoteLink = listData.remoteId
            ? getListShareUrl({ remoteListId: listData.remoteId })
            : undefined // TODO: ensure this comes with key for collab'd lists

        return {
            remoteLink,
            listName: listData.name,
            localListId: listData.id,
            onAddContributorsClick: listData.isOwnedList
                ? () =>
                      this.processEvent('setShareListId', {
                          listId: listData.id,
                      })
                : undefined,
        }
    }

    // TODO: move this to logic class - main reason it exists separately is that it needs to return the created list ID
    private async createNewListViaPicker(name: string): Promise<number> {
        const listId = await this.props.listsBG.createCustomList({ name })
        this.processMutation({
            listsSidebar: {
                listData: {
                    $apply: (listData) => ({
                        ...listData,
                        [listId]: {
                            name,
                            id: listId,
                            isOwnedList: true,
                        },
                    }),
                },
            },
        })
        return listId
    }

    private listsStateToProps = (
        listIds: number[],
        source: ListSource,
    ): ListSidebarItemProps[] => {
        const { listsSidebar } = this.state

        return listIds.map((listId) => ({
            source,
            listId,
            listData: listsSidebar.listData[listId],
            name: listsSidebar.listData[listId].name,
            isEditing: listsSidebar.editingListId === listId,
            isCollaborative:
                source === 'followed-lists'
                    ? false
                    : listsSidebar.listData[listId].remoteId != null,
            isMenuDisplayed:
                source === 'followed-lists'
                    ? false
                    : listsSidebar.showMoreMenuListId === listId,
            selectedState: {
                isSelected: listsSidebar.selectedListId === listId,
                onSelection:
                    source === 'followed-lists'
                        ? () =>
                              this.props.openCollectionPage(
                                  listsSidebar.listData[listId].remoteId,
                              )
                        : () =>
                              this.processEvent('setSelectedListId', {
                                  listId: listsSidebar.listData[listId].id,
                              }),
            },
            editableProps: {
                changeListName: (value) =>
                    this.processEvent('changeListName', { value }),
                onCancelClick: () => this.processEvent('cancelListEdit', null),
                onConfirmClick: (value) =>
                    this.processEvent('confirmListEdit', { value }),
                initValue: listsSidebar.listData[listId].name,
                errorMessage: listsSidebar.editListErrorMessage,
            },
            onMoreActionClick:
                source !== 'followed-lists' &&
                listsSidebar.listData[listId].isOwnedList
                    ? () =>
                          this.processEvent('setShowMoreMenuListId', {
                              listId: listsSidebar.listData[listId].id,
                          })
                    : undefined,
            onRenameClick: () =>
                this.processEvent('setEditingListId', { listId }),
            onDeleteClick: (e) => {
                e.stopPropagation()
                this.processEvent('setDeletingListId', { listId })
            },
            onSpaceShare: (remoteListId) =>
                this.processEvent('setListRemoteId', {
                    localListId: listId,
                    remoteListId,
                }),
            services: {
                ...this.props.services,
                contentSharing: this.props.contentShareBG,
            },
            shareList: async () => {
                await this.processEvent('shareList', {
                    listId,
                })
            },
        }))
    }

    private renderFiltersBar() {
        const { searchBG } = this.props
        const { searchFilters, searchResults } = this.state

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
        const toggleSpacesFilter = () =>
            this.processEvent('toggleShowSpacePicker', {
                isActive: !searchFilters.isSpaceFilterActive,
            })

        return (
            <FiltersBar
                searchFilters={searchFilters}
                isDisplayed={searchFilters.searchFiltersOpen}
                showTagsFilter={searchFilters.isTagFilterActive}
                showDatesFilter={searchFilters.isDateFilterActive}
                showSpaceFilter={searchFilters.isSpaceFilterActive}
                showDomainsFilter={searchFilters.isDomainFilterActive}
                toggleDomainsFilter={toggleDomainsFilter}
                toggleSpaceFilter={toggleSpacesFilter}
                toggleDatesFilter={toggleDatesFilter}
                toggleTagsFilter={toggleTagsFilter}
                areSpacesFiltered={searchFilters.spacesIncluded.length > 0}
                areTagsFiltered={searchFilters.tagsIncluded.length > 0}
                areDatesFiltered={
                    searchFilters.dateTo != null ||
                    searchFilters.dateFrom != null
                }
                areDomainsFiltered={searchFilters.domainsIncluded.length > 0}
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
                tagPickerProps={
                    searchResults.shouldShowTagsUIs && {
                        onClickOutside: toggleTagsFilter,
                        onEscapeKeyDown: toggleTagsFilter,
                        initialSelectedEntries: () =>
                            searchFilters.tagsIncluded,
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
                    }
                }
                spacePickerProps={{
                    spacesBG: this.props.listsBG,
                    onClickOutside: toggleSpacesFilter,
                    onEscapeKeyDown: toggleSpacesFilter,
                    contentSharingBG: this.props.contentShareBG,
                    createNewEntry: () => undefined,
                    initialSelectedEntries: () => searchFilters.spacesIncluded,
                    selectEntry: (spaceId) =>
                        this.processEvent('addIncludedSpace', {
                            spaceId,
                        }),
                    unselectEntry: (spaceId) =>
                        this.processEvent('delIncludedSpace', { spaceId }),
                }}
            />
        )
    }

    private renderHeader() {
        const {
            isCloudEnabled,
            searchFilters,
            listsSidebar,
            currentUser,
            syncMenu,
        } = this.state
        const syncStatusIconState = deriveStatusIconColor(this.state)
        return (
            <HeaderContainer
                searchBarProps={{
                    searchQuery: searchFilters.searchQuery,
                    searchFiltersOpen: searchFilters.searchFiltersOpen,
                    onSearchFiltersOpen: () =>
                        this.processEvent('setSearchFiltersOpen', {
                            isOpen: !searchFilters.searchFiltersOpen,
                        }),
                    onSearchQueryChange: (query) =>
                        this.processEvent('setSearchQuery', { query }),
                    onInputClear: () =>
                        this.processEvent('setSearchQuery', { query: '' }),
                }}
                sidebarLockedState={{
                    isSidebarLocked: listsSidebar.isSidebarLocked,
                    toggleSidebarLockedState: () =>
                        this.processEvent('setSidebarLocked', {
                            isLocked: !listsSidebar.isSidebarLocked,
                        }),
                }}
                sidebarToggleHoverState={{
                    isHovered: listsSidebar.isSidebarToggleHovered,
                    onHoverEnter: () =>
                        this.processEvent('setSidebarToggleHovered', {
                            isHovered: true,
                        }),
                    onHoverLeave: () =>
                        this.processEvent('setSidebarToggleHovered', {
                            isHovered: false,
                        }),
                }}
                selectedListName={
                    listsSidebar.listData[listsSidebar.selectedListId]?.name
                }
                activityStatus={listsSidebar.hasFeedActivity}
                syncStatusIconState={syncStatusIconState}
                syncStatusMenuProps={{
                    ...syncMenu,
                    isCloudEnabled,
                    syncStatusIconState,
                    isLoggedIn: currentUser != null,
                    outsideClickIgnoreClass:
                        HeaderContainer.SYNC_MENU_TOGGLE_BTN_CLASS,
                    onLoginClick: () =>
                        this.processEvent('setShowLoginModal', {
                            isShown: true,
                        }),
                    onMigrateClick: () =>
                        this.processEvent('setShowCloudOnboardingModal', {
                            isShown: true,
                        }),
                    onClickOutside: () =>
                        this.processEvent('setSyncStatusMenuDisplayState', {
                            isShown: false,
                        }),
                    onToggleDisplayState: () =>
                        this.processEvent('setSyncStatusMenuDisplayState', {
                            isShown: !syncMenu.isDisplayed,
                        }),
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
                openFeedUrl={() =>
                    this.processEvent('clickFeedActivityIndicator', null)
                }
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
                    hasPerfectMatch: true,
                    onCreateNew: (value) =>
                        this.processEvent('confirmListCreate', { value }),
                    onSearchQueryChange: (query) =>
                        this.processEvent('setListQueryValue', { query }),
                    onInputClear: () =>
                        this.processEvent('setListQueryValue', { query: '' }),
                }}
                listsGroups={[
                    {
                        ...listsSidebar.localLists,
                        title: 'My Spaces',
                        onAddBtnClick: () =>
                            this.processEvent('setAddListInputShown', {
                                isShown: !listsSidebar.localLists
                                    .isAddInputShown,
                            }),
                        confirmAddNewList: (value) =>
                            this.processEvent('confirmListCreate', { value }),
                        cancelAddNewList: (shouldSave) =>
                            this.processEvent('cancelListCreate', null),
                        onExpandBtnClick: () =>
                            this.processEvent('setLocalListsExpanded', {
                                isExpanded: !listsSidebar.localLists.isExpanded,
                            }),
                        listsArray: this.listsStateToProps(
                            listsSidebar.localLists.filteredListIds,
                            'local-lists',
                        ),
                    },
                    {
                        ...listsSidebar.followedLists,
                        title: 'Followed Spaces',
                        onExpandBtnClick: () =>
                            this.processEvent('setFollowedListsExpanded', {
                                isExpanded: !listsSidebar.followedLists
                                    .isExpanded,
                            }),
                        listsArray: this.listsStateToProps(
                            listsSidebar.followedLists.filteredListIds,
                            'followed-lists',
                        ),
                    },
                ]}
                initDropReceivingState={(listId) => ({
                    onDragEnter: () => {
                        this.processEvent('setDragOverListId', { listId })
                    },
                    onDragLeave: () =>
                        this.processEvent('setDragOverListId', {
                            listId: undefined,
                        }),
                    onDrop: (dataTransfer: DataTransfer) => {
                        this.processEvent('dropPageOnListItem', {
                            listId,
                            dataTransfer,
                        })
                    },
                    isDraggedOver: listId === listsSidebar.dragOverListId,
                    wasPageDropped:
                        listsSidebar.listData[listId]?.wasPageDropped,
                })}
            />
        )
    }

    private renderPdfLocator() {
        return (
            <PdfLocator
                title="Test title"
                url="https://testsite.com/test.pdf"
            />
        )
    }

    private renderSearchResults() {
        const { searchResults, listsSidebar, searchFilters } = this.state

        return (
            <SearchResultsContainer
                listData={listsSidebar.listData}
                getListDetailsById={this.getListDetailsById}
                toggleSortMenuShown={() =>
                    this.processEvent('setSortMenuShown', {
                        isShown: !searchResults.isSortMenuShown,
                    })
                }
                searchResults={searchResults.pageData}
                searchFilters={searchFilters}
                searchQuery={searchFilters.searchQuery}
                isDisplayed={searchFilters.searchFiltersOpen}
                goToImportRoute={() => {
                    this.bindRouteGoTo('import')()
                    this.processEvent('dismissOnboardingMsg', null)
                }}
                toggleListShareMenu={() =>
                    this.processEvent('setListShareMenuShown', {
                        isShown: !searchResults.isListShareMenuShown,
                    })
                }
                openListShareModal={() =>
                    this.processEvent('setShareListId', {
                        listId: listsSidebar.selectedListId,
                    })
                }
                updateAllResultNotesShareInfo={(shareStates) =>
                    this.processEvent('updateAllPageResultNotesShareInfo', {
                        shareStates,
                    })
                }
                selectedListId={listsSidebar.selectedListId}
                listDetailsProps={this.getListDetailsProps()}
                {...searchResults}
                onDismissMobileAd={() =>
                    this.processEvent('dismissMobileAd', null)
                }
                onDismissOnboardingMsg={() => {
                    this.processEvent('dismissOnboardingMsg', null)
                }}
                onDismissSubscriptionBanner={() =>
                    this.processEvent('dismissSubscriptionBanner', null)
                }
                showCloudOnboardingModal={() =>
                    this.processEvent('setShowCloudOnboardingModal', {
                        isShown: true,
                    })
                }
                noResultsType={searchResults.noResultsType}
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
                onListLinkCopy={(link) =>
                    this.processEvent('copyShareLink', {
                        link,
                        analyticsAction: 'copyListLink',
                    })
                }
                pageInteractionProps={{
                    onNotesBtnClick: (day, pageId) => (e) => {
                        const pageData = searchResults.pageData.byId[pageId]
                        if (e.shiftKey) {
                            this.processEvent('setPageNotesShown', {
                                day,
                                pageId,
                                areShown: !searchResults.results[day].pages
                                    .byId[pageId].areNotesShown,
                            })
                            return
                        }

                        this.notesSidebarRef.current.toggleSidebarShowForPageId(
                            pageData.fullUrl,
                        )
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
                    onListsHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageId,
                            hover: 'lists',
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
                    updatePageNotesShareInfo: (day, pageId) => (shareStates) =>
                        this.processEvent('updatePageNotesShareInfo', {
                            day,
                            pageId,
                            shareStates,
                        }),
                    createNewList: (day, pageId) => async (name) =>
                        this.createNewListViaPicker(name),
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
                    getListDetailsById: (day, pageId) =>
                        this.getListDetailsById,
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
                    createNewList: (day, pageId) => async (name) =>
                        this.createNewListViaPicker(name),
                    addPageToList: (day, pageId) => (listId) =>
                        this.processEvent('setPageNewNoteLists', {
                            day,
                            pageId,
                            lists: [
                                ...this.state.searchResults.results[day].pages
                                    .byId[pageId].newNoteForm.lists,
                                listId,
                            ],
                        }),
                    removePageFromList: (day, pageId) => (listId) =>
                        this.processEvent('setPageNewNoteLists', {
                            day,
                            pageId,
                            lists: this.state.searchResults.results[
                                day
                            ].pages.byId[pageId].newNoteForm.lists.filter(
                                (id) => id !== listId,
                            ),
                        }),
                    onSave: (day, pageId) => (shouldShare, isProtected) =>
                        this.processEvent('savePageNewNote', {
                            day,
                            pageId,
                            isProtected,
                            shouldShare,
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
                    onEditConfirm: (noteId) => (showExternalConfirmations) => (
                        shouldShare,
                        isProtected,
                        opts,
                    ) => {
                        const prev = this.state.searchResults.noteData.byId[
                            noteId
                        ]
                        const toMakeNonPublic =
                            showExternalConfirmations &&
                            prev.isShared &&
                            !shouldShare
                        return this.processEvent(
                            toMakeNonPublic
                                ? 'setPrivatizeNoteConfirmArgs'
                                : 'saveNoteEdit',
                            {
                                noteId,
                                shouldShare,
                                isProtected,
                                ...opts,
                            },
                        )
                    },
                    onGoToHighlightClick: (noteId) => () =>
                        this.processEvent('goToHighlightInNewTab', { noteId }),
                    onTagPickerBtnClick: (noteId) => () =>
                        this.processEvent('setNoteTagPickerShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isTagPickerShown,
                        }),
                    onListPickerBtnClick: (noteId) => () =>
                        this.processEvent('setNoteListPickerShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isListPickerShown,
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
                    updateLists: (noteId) => (args) => {
                        const {
                            isShared: isAnnotShared,
                        } = this.state.searchResults.noteData.byId[noteId]
                        const isListShared =
                            this.state.listsSidebar.listData[
                                args.added ?? args.deleted
                            ]?.remoteId != null

                        return this.processEvent(
                            isAnnotShared &&
                                isListShared &&
                                args.deleted == null &&
                                args.options?.showExternalConfirmations
                                ? 'setSelectNoteSpaceConfirmArgs'
                                : 'setNoteLists',
                            {
                                ...args,
                                noteId,
                                protectAnnotation:
                                    args.options?.protectAnnotation,
                            },
                        )
                    },
                    createNewList: (noteId) => async (name) =>
                        this.createNewListViaPicker(name),
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
                    onShareBtnClick: (noteId) => (mouseEvent) =>
                        this.processEvent('setNoteShareMenuShown', {
                            mouseEvent,
                            noteId,
                            platform: navigator.platform,
                            shouldShow:
                                searchResults.noteData.byId[noteId]
                                    .shareMenuShowStatus === 'hide',
                        }),
                    updateShareInfo: (noteId) => (state, opts) =>
                        this.processEvent('updateNoteShareInfo', {
                            noteId,
                            privacyLevel: state.privacyLevel,
                            keepListsIfUnsharing: opts?.keepListsIfUnsharing,
                        }),
                }}
                searchCopyPasterProps={{
                    searchType: searchResults.searchType,
                    searchParams: stateToSearchParams(this.state),
                    isCopyPasterShown: searchResults.isSearchCopyPasterShown,
                    isCopyPasterBtnShown: true,
                    hideCopyPaster: () =>
                        this.processEvent('setSearchCopyPasterShown', {
                            isShown: false,
                        }),
                    toggleCopyPaster: () =>
                        this.processEvent('setSearchCopyPasterShown', {
                            isShown: !searchResults.isSearchCopyPasterShown,
                        }),
                }}
            />
        )
    }

    private renderModals() {
        const { modals: modalsState, listsSidebar } = this.state

        if (modalsState.confirmPrivatizeNoteArgs) {
            return (
                <ConfirmModal
                    isShown
                    onClose={() =>
                        this.processEvent('setPrivatizeNoteConfirmArgs', null)
                    }
                >
                    <ConfirmDialog
                        titleText={PRIVATIZE_ANNOT_MSG}
                        negativeLabel={PRIVATIZE_ANNOT_NEGATIVE_LABEL}
                        affirmativeLabel={PRIVATIZE_ANNOT_AFFIRM_LABEL}
                        handleConfirmation={(affirmative) => () =>
                            this.processEvent('saveNoteEdit', {
                                ...modalsState.confirmPrivatizeNoteArgs,
                                keepListsIfUnsharing: !affirmative,
                            })}
                    />
                </ConfirmModal>
            )
        }

        if (modalsState.confirmSelectNoteSpaceArgs) {
            return (
                <ConfirmModal
                    isShown
                    onClose={() =>
                        this.processEvent('setSelectNoteSpaceConfirmArgs', null)
                    }
                >
                    <ConfirmDialog
                        titleText={SELECT_SPACE_ANNOT_MSG}
                        subTitleText={SELECT_SPACE_ANNOT_SUBTITLE}
                        affirmativeLabel={SELECT_SPACE_AFFIRM_LABEL}
                        negativeLabel={SELECT_SPACE_NEGATIVE_LABEL}
                        handleConfirmation={(affirmative) => () =>
                            this.processEvent('setNoteLists', {
                                ...modalsState.confirmSelectNoteSpaceArgs,
                                protectAnnotation: affirmative,
                            })}
                    />
                </ConfirmModal>
            )
        }

        if (modalsState.deletingListId) {
            return (
                <DeleteConfirmModal
                    isShown
                    message="Delete this Space?"
                    submessage="This does not delete the pages in it"
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

        if (modalsState.showLogin) {
            return (
                <LoginModal
                    onClose={() =>
                        this.processEvent('setShowLoginModal', {
                            isShown: false,
                        })
                    }
                    authBG={this.props.authBG}
                    contentSharingBG={this.props.contentShareBG}
                    onSuccess={() =>
                        setTimeout(
                            () => this.processEvent('checkSharingAccess', null),
                            1000,
                        )
                    }
                />
            )
        }

        if (modalsState.showDisplayNameSetup) {
            return (
                <DisplayNameModal
                    authBG={this.props.authBG}
                    onClose={() =>
                        this.processEvent('setShowDisplayNameSetupModal', {
                            isShown: false,
                        })
                    }
                />
            )
        }

        if (modalsState.shareListId) {
            const listData = listsSidebar.listData[modalsState.shareListId]

            return (
                <ListShareModal
                    defaultAddLinkRole={
                        listData.remoteId
                            ? SharedListRoleID.ReadWrite
                            : SharedListRoleID.Commenter
                    }
                    listId={listData.remoteId}
                    shareList={shareListAndAllEntries(
                        this.props.contentShareBG,
                        listData.id,
                    )}
                    onCloseRequested={() =>
                        this.processEvent('setShareListId', {})
                    }
                    services={{
                        ...this.props.services,
                        contentSharing: this.props.contentShareBG,
                    }}
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

        if (modalsState.showCloudOnboarding) {
            return (
                <CloudOnboardingModal
                    services={this.props.services}
                    backupBG={this.props.backupBG}
                    syncSettingsBG={this.props.syncSettingsBG}
                    personalCloudBG={this.props.personalCloudBG}
                    onModalClose={(args) =>
                        this.processEvent('closeCloudOnboardingModal', {
                            didFinish: !!args.didFinish,
                        })
                    }
                />
            )
        }

        return null
    }

    render() {
        // <GlobalFonts />
        // <GlobalStyle />
        const { listsSidebar, mode } = this.state
        if (mode === 'onboarding') {
            return (
                <Onboarding
                    authBG={this.props.authBG}
                    personalCloudBG={this.props.personalCloudBG}
                />
            )
        }

        return (
            <Container>
                {this.renderHeader()}
                {this.renderFiltersBar()}
                <Margin bottom="5px" />
                {this.renderListsSidebar()}
                {mode === 'locate-pdf'
                    ? this.renderPdfLocator()
                    : this.renderSearchResults()}
                {this.renderModals()}
                <NotesSidebar
                    tags={this.props.tagsBG}
                    auth={this.props.authBG}
                    refSidebar={this.notesSidebarRef}
                    customLists={this.props.listsBG}
                    annotations={this.props.annotationsBG}
                    annotationsCache={this.annotationsCache}
                    contentSharing={this.props.contentShareBG}
                    syncSettingsBG={this.props.syncSettingsBG}
                    contentConversationsBG={this.props.contentConversationsBG}
                    setLoginModalShown={(isShown) =>
                        this.processEvent('setShowLoginModal', { isShown })
                    }
                    setDisplayNameModalShown={(isShown) =>
                        this.processEvent('setShowDisplayNameSetupModal', {
                            isShown,
                        })
                    }
                    showAnnotationShareModal={() =>
                        this.processEvent('setShowNoteShareOnboardingModal', {
                            isShown: true,
                        })
                    }
                />
                <HelpBtn />
                <DragElement
                    isHoveringOverListItem={listsSidebar.dragOverListId != null}
                />
                {this.props.renderUpdateNotifBanner()}
            </Container>
        )
    }
}

const GlobalStyle = createGlobalStyle`

    * {
        font-family: 'Inter', sans-serif;,
    }

    body {
        font-family: 'Inter', sans-serif;';
    }
`

const Container = styled.div`
display: flex;
flex-direction: column;
width: fill-available;
background-color: ${(props) => props.theme.colors.backgroundColor};
min-height: 100vh;
height: 100%;

    & * {
        font-family: 'Inter', sans-serif;,
    }
`
