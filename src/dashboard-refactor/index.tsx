import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import browser from 'webextension-polyfill'
import ListShareModal from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal'
import { createGlobalStyle } from 'styled-components'
import { sizeConstants } from 'src/dashboard-refactor/constants'
import { StatefulUIElement } from 'src/util/ui-logic'
import { DashboardLogic } from './logic'
import type { RootState, Events, DashboardDependencies } from './types'
import ListsSidebarContainer from './lists-sidebar'
import SearchResultsContainer from './search-results'
import { runInBackground } from 'src/util/webextensionRPC'
import * as searchResultUtils from './search-results/util'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import Onboarding from 'src/overview/onboarding'
import { HelpBtn } from 'src/overview/help-btn'
import FiltersBar from './header/filters-bar'
import SidebarToggle from './header/sidebar-toggle'
import { Rnd } from 'react-rnd'
import { AnnotationsSidebarInDashboardResults as NotesSidebar } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarInDashboardResults'
import { AnnotationsSidebarContainer as NotesSidebarContainer } from 'src/sidebar/annotations-sidebar/containers/AnnotationsSidebarContainer'
import { updatePickerValues, stateToSearchParams, getListData } from './util'
import analytics from 'src/analytics'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import { deriveStatusIconColor } from './header/sync-status-menu/util'
import { FILTER_PICKERS_LIMIT } from './constants'
import DragElement from './components/DragElement'
import Margin from './components/Margin'
import { getListShareUrl } from 'src/content-sharing/utils'
import type { Props as ListDetailsProps } from './search-results/components/list-details'
import LoginModal from 'src/overview/sharing/components/LoginModal'
import DisplayNameModal from 'src/overview/sharing/components/DisplayNameModal'
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
import * as icons from 'src/common-ui/components/design-library/icons'
import SearchCopyPaster from './search-results/components/search-copy-paster'
import ExpandAllNotes from './search-results/components/expand-all-notes'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PageAnnotationsCache } from 'src/annotations/cache'
import { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import { createYoutubeServiceOptions } from '@worldbrain/memex-common/lib/services/youtube/library'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import * as cacheUtils from 'src/annotations/cache/utils'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SPECIAL_LIST_STRING_IDS } from './lists-sidebar/constants'
import BulkEditWidget from 'src/bulk-edit'
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import type { RGBAColor, UnifiedAnnotation } from 'src/annotations/cache/types'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import SyncStatusMenu from './header/sync-status-menu'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import SearchBar from './header/search-bar'
import { SETTINGS_URL } from 'src/constants'
import {
    ColorThemeKeys,
    IconKeys,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'
import PageCitations from 'src/citations/PageCitations'
import CopyPaster from 'src/copy-paster/components/CopyPaster'
import { PageSearchCopyPaster } from 'src/copy-paster'
import BulkEditCopyPaster from 'src/copy-paster/BulkEditCopyPaster'
import { OverlayModals } from '@worldbrain/memex-common/lib/common-ui/components/overlay-modals'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

export type Props = DashboardDependencies & {
    getRootElement: () => HTMLElement
}

const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1

export class DashboardContainer extends StatefulUIElement<
    Props,
    RootState,
    Events
> {
    static SYNC_MENU_TOGGLE_BTN_CLASS = 'sync-menu-toggle-btn'

    static MEMEX_SOCIAL_URL =
        process.env.NODE_ENV === 'production'
            ? 'https://memex.social'
            : 'https://staging.memex.social'

    private get memexIcon(): string {
        const iconPath =
            this.state.themeVariant === 'dark'
                ? 'img/memexIconDarkMode.svg'
                : 'img/memexIconLightMode.svg'
        return this.props.runtimeAPI.getURL(iconPath)
    }

    static defaultProps: Pick<
        Props,
        | 'analytics'
        | 'copyToClipboard'
        | 'document'
        | 'location'
        | 'history'
        | 'tabsAPI'
        | 'runtimeAPI'
        | 'browserAPIs'
        | 'localStorage'
        | 'annotationsCache'
        | 'analyticsBG'
        | 'contentScriptsBG'
        | 'pageActivityIndicatorBG'
        | 'contentConversationsBG'
        | 'activityIndicatorBG'
        | 'contentShareBG'
        | 'contentShareByTabsBG'
        | 'contentShareBG'
        | 'copyPasterBG'
        | 'pageIndexingBG'
        | 'syncSettingsBG'
        | 'annotationsBG'
        | 'pdfViewerBG'
        | 'searchBG'
        | 'listsBG'
        | 'authBG'
        | 'openSpaceInWebUI'
        | 'summarizeBG'
        | 'imageSupportBG'
        | 'personalCloudBG'
        | 'bgScriptBG'
    > = {
        analytics,
        copyToClipboard,
        document: window.document,
        location: window.location,
        history: window.history,
        tabsAPI: browser.tabs,
        runtimeAPI: browser.runtime,
        browserAPIs: browser,
        localStorage: browser.storage.local,
        pageActivityIndicatorBG: runInBackground(),
        summarizeBG: runInBackground(),
        analyticsBG: runInBackground(),
        contentConversationsBG: runInBackground(),
        contentShareByTabsBG: runInBackground(),
        activityIndicatorBG: runInBackground(),
        contentScriptsBG: runInBackground(),
        personalCloudBG: runInBackground(),
        pageIndexingBG: runInBackground(),
        contentShareBG: runInBackground(),
        copyPasterBG: runInBackground(),
        syncSettingsBG: runInBackground(),
        annotationsBG: runInBackground(),
        pdfViewerBG: runInBackground(),
        bgScriptBG: runInBackground(),
        searchBG: runInBackground(),
        listsBG: runInBackground(),
        authBG: runInBackground(),
        annotationsCache: new PageAnnotationsCache({}),
        openSpaceInWebUI: (remoteListId) =>
            window.open(getListShareUrl({ remoteListId }), '_blank'),
        imageSupportBG: runInBackground(),
    }

    private notesSidebarRef = React.createRef<NotesSidebarContainer>()
    private syncStatusButtonRef = React.createRef<HTMLDivElement>()
    youtubeService: YoutubeService

    private bindRouteGoTo = (route: 'import' | 'sync' | 'backup') => () => {
        window.location.hash = '#/' + route
    }

    constructor(props: Props) {
        super(props, new DashboardLogic(props))

        this.youtubeService = new YoutubeService(createYoutubeServiceOptions())
        ;(window as any)['_state'] = () => ({ ...this.state })
        document.addEventListener('keydown', this.handleChangeFocusItem)
    }

    handleChangeFocusItem = (event: KeyboardEvent) => {
        const getPopoutBoxes = document.getElementById('popout-boxes')
        if (!getPopoutBoxes) {
            if (
                event.key === 'Escape' &&
                this.props.inPageMode &&
                !this.state.isNoteSidebarShown
            ) {
                event.stopPropagation()
                event.preventDefault()
                this.props.closeInPageMode()
            }

            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.stopPropagation()
                event.preventDefault()
                if (!this.state.focusLockUntilMouseStart) {
                    document.addEventListener('mousemove', this.releaseLock, {
                        once: true,
                    })
                    this.processEvent('setFocusLock', true)
                }
                this.processEvent('changeFocusItem', {
                    direction: event.key === 'ArrowUp' ? 'up' : 'down',
                })
            }
        }
    }

    componentWillUnmount(): Promise<void> {
        super.componentWillUnmount()

        document.removeEventListener('keydown', this.handleChangeFocusItem)
        return
    }

    releaseLock = () => {
        this.processEvent('setFocusLock', false)
        document.removeEventListener('mousemove', this.releaseLock)
    }

    private getListDetailsById: ListDetailsGetter = (id) => {
        const listData = this.props.annotationsCache.getListByLocalId(id)
        return {
            name: listData?.name,
            isShared: listData.remoteId && !listData?.isPrivate,
            type: listData?.type,
        }
    }

    private getListDetailsProps = (): ListDetailsProps | null => {
        const { listsSidebar, currentUser } = this.state

        if (listsSidebar.selectedListId == null) {
            return null
        }

        const listData = getListData(listsSidebar.selectedListId, {
            listsSidebar,
        })
        const remoteLink = listData?.remoteId
            ? getListShareUrl({ remoteListId: listData.remoteId })
            : undefined // TODO: ensure this comes with key for collab'd lists
        const isOwnedList = listData.creator?.id === currentUser?.id

        return {
            listData,
            remoteLink,
            isOwnedList,
            isJoinedList: !isOwnedList && listData.localId != null,
            description: listData.description ?? null,
            type: listData?.type ?? null,
            saveDescription: (description) =>
                this.processEvent('updateSelectedListDescription', {
                    description,
                }),
            saveTitle: (value, listId) => {
                this.processEvent('confirmListEdit', { value, listId })
            },
            onAddContributorsClick: isOwnedList
                ? () =>
                      this.processEvent('setShareListId', {
                          listId: listData.unifiedId,
                      })
                : undefined,
            imageSupport: this.props.imageSupportBG,
            getRootElement: this.props.getRootElement,
        }
    }

    private renderFiltersBar() {
        const { searchBG } = this.props
        const { searchFilters, searchResults, listsSidebar } = this.state

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
        const selectedLocalListId =
            listsSidebar.selectedListId != null
                ? getListData(listsSidebar.selectedListId, {
                      listsSidebar,
                  })?.localId
                : undefined

        return (
            <FiltersBar
                spaceSidebarLocked={this.state.listsSidebar.isSidebarLocked}
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
                            notInclude: [...searchFilters.domainsExcluded],
                        }),
                    onUpdateEntrySelection: (args) =>
                        this.processEvent('setDomainsIncluded', {
                            domains: updatePickerValues(args)(args.selected),
                        }),
                }}
                tagPickerProps={
                    searchResults.shouldShowTagsUIs && {
                        onClickOutside: toggleTagsFilter,
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
                spacePickerFilterProps={{
                    filterMode: true,
                    spacesBG: this.props.listsBG,
                    bgScriptBG: this.props.bgScriptBG,
                    authBG: this.props.authBG,
                    contentSharingBG: this.props.contentShareBG,
                    analyticsBG: this.props.analyticsBG,
                    onClickOutside: toggleSpacesFilter,
                    localStorageAPI: this.props.localStorage,
                    annotationsCache: this.props.annotationsCache,
                    pageActivityIndicatorBG: this.props.pageActivityIndicatorBG,
                    initialSelectedListIds: () => searchFilters.spacesIncluded,
                    dashboardSelectedListId: selectedLocalListId,
                    selectEntry: (spaceId) =>
                        this.processEvent('addIncludedSpace', {
                            spaceId,
                        }),
                    unselectEntry: (spaceId) =>
                        this.processEvent('delIncludedSpace', { spaceId }),
                }}
                getRootElement={this.props.getRootElement}
            />
        )
    }

    private renderHeader() {
        const {
            searchFilters,
            listsSidebar,
            currentUser,
            syncMenu,
            searchResults,
        } = this.state
        const syncStatusIconState = deriveStatusIconColor(this.state)

        function getSyncStatusIcon(status): IconKeys {
            if (status === 'green') {
                return 'check'
            }
            if (status === 'yellow') {
                return 'reload'
            }

            if (status === 'red') {
                return 'warning'
            }
        }

        function getSyncIconColor(status): ColorThemeKeys {
            if (status === 'green') {
                return 'prime1'
            }
            if (status === 'yellow') {
                return 'white'
            }

            if (status === 'red') {
                return 'warning'
            }
        }

        return (
            <HeaderContainer>
                {/* <PlaceholderContainer /> */}
                <SearchSection vertical="auto" left="24px">
                    <SearchBar
                        {...{
                            renderExpandButton: () => (
                                <ExpandAllNotes
                                    isEnabled={searchResultUtils.areAllNotesShown(
                                        searchResults,
                                    )}
                                    onClick={() =>
                                        this.processEvent(
                                            'setAllNotesShown',
                                            null,
                                        )
                                    }
                                    getRootElement={this.props.getRootElement}
                                />
                            ),
                            renderCopyPasterButton: () => (
                                <SearchCopyPaster
                                    searchType={searchResults.searchType}
                                    searchParams={stateToSearchParams(
                                        this.state,
                                        this.props.annotationsCache,
                                    )}
                                    isCopyPasterShown={
                                        searchResults.isSearchCopyPasterShown
                                    }
                                    isCopyPasterBtnShown
                                    hideCopyPaster={() =>
                                        this.processEvent(
                                            'setSearchCopyPasterShown',
                                            {
                                                isShown: false,
                                            },
                                        )
                                    }
                                    toggleCopyPaster={() =>
                                        this.processEvent(
                                            'setSearchCopyPasterShown',
                                            {
                                                isShown: !searchResults.isSearchCopyPasterShown,
                                            },
                                        )
                                    }
                                    getRootElement={this.props.getRootElement}
                                    copyPasterBG={this.props.copyPasterBG}
                                />
                            ),
                            isNotesSidebarShown: this.state.isNoteSidebarShown,
                            searchQuery: searchFilters.searchQuery,
                            isSidebarLocked: listsSidebar.isSidebarLocked,
                            searchFiltersOpen: searchFilters.searchFiltersOpen,
                            onSearchFiltersOpen: () =>
                                this.processEvent('setSearchFiltersOpen', {
                                    isOpen: !searchFilters.searchFiltersOpen,
                                }),
                            onSearchQueryChange: (query) =>
                                this.processEvent('setSearchQuery', {
                                    query: query,
                                    isInPageMode: this.props.inPageMode,
                                }),
                            onInputClear: () =>
                                this.processEvent('setSearchQuery', {
                                    query: '',
                                    isInPageMode: this.props.inPageMode,
                                }),
                            getRootElement: this.props.getRootElement,
                            inPageMode: this.props.inPageMode,
                        }}
                    />
                </SearchSection>

                <RightHeader notesSidebarShown={this.state.isNoteSidebarShown}>
                    <LeftSideRightHeader>
                        {!this.props.inPageMode && (
                            <ActionWrapper>
                                <TooltipBox
                                    tooltipText={'Sync Status'}
                                    placement="bottom"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'setSyncStatusMenuDisplayState',
                                                {
                                                    isShown:
                                                        syncMenu.isDisplayed,
                                                },
                                            )
                                        }
                                        size={'medium'}
                                        icon={getSyncStatusIcon(
                                            syncStatusIconState,
                                        )}
                                        type={'tertiary'}
                                        iconColor={getSyncIconColor(
                                            syncStatusIconState,
                                        )}
                                        spinningIcon={
                                            syncStatusIconState === 'yellow'
                                        }
                                        innerRef={this.syncStatusButtonRef}
                                        padding="6px"
                                    />
                                </TooltipBox>
                                {this.renderStatusMenu(syncStatusIconState)}
                            </ActionWrapper>
                        )}
                        <Icon
                            onClick={() =>
                                this.props.inPageMode
                                    ? this.props.openSettings()
                                    : window.open(SETTINGS_URL, '_blank')
                            }
                            heightAndWidth="22px"
                            padding={'6px'}
                            filePath={icons.settings}
                        />
                    </LeftSideRightHeader>
                    {this.state.isNoteSidebarShown && (
                        <RightSideRightHeader>
                            <TooltipBox
                                tooltipText={
                                    <TooltipContent>
                                        Close Sidebar
                                        <KeyboardShortcuts
                                            size={'small'}
                                            keys={['Esc']}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                        />
                                    </TooltipContent>
                                }
                                placement="bottom"
                                getPortalRoot={this.props.getRootElement}
                            >
                                <PrimaryAction
                                    icon="arrowRight"
                                    padding="6px"
                                    onClick={() =>
                                        this.notesSidebarRef.current.hideSidebar()
                                    }
                                    type="glass"
                                    size="medium"
                                />
                            </TooltipBox>
                        </RightSideRightHeader>
                    )}
                </RightHeader>
            </HeaderContainer>
        )
    }

    renderStatusMenu(syncStatusIconState) {
        if (this.state.syncMenu.isDisplayed) {
            return (
                <PopoutBox
                    targetElementRef={this.syncStatusButtonRef.current}
                    offsetX={15}
                    offsetY={5}
                    closeComponent={() =>
                        this.processEvent('setSyncStatusMenuDisplayState', {
                            isShown: this.state.syncMenu.isDisplayed,
                        })
                    }
                    placement={'bottom-end'}
                    getPortalRoot={this.props.getRootElement}
                >
                    <SyncStatusMenu
                        {...{
                            ...this.state.syncMenu,
                            syncStatusIconState,
                            isLoggedIn: this.state.currentUser != null,
                            outsideClickIgnoreClass:
                                HeaderContainer.SYNC_MENU_TOGGLE_BTN_CLASS,
                            onLoginClick: () => {
                                this.processEvent(
                                    'setSyncStatusMenuDisplayState',
                                    { isShown: false },
                                )
                                this.processEvent('setShowLoginModal', {
                                    isShown: true,
                                })
                            },
                            onToggleDisplayState: () => {},
                            getRootElement: this.props.getRootElement,
                            syncNow: (preventUpdateStats) =>
                                this.processEvent('syncNow', {
                                    preventUpdateStats: preventUpdateStats,
                                }),
                            browserAPIs: browser,
                        }}
                        syncStatusIconState={syncStatusIconState}
                    />
                </PopoutBox>
            )
        }
    }

    private renderListsSidebar(isInPageMode: boolean) {
        const { listsSidebar, currentUser } = this.state

        let allLists = normalizedStateToArray(listsSidebar.lists)
        if (listsSidebar.searchQuery.trim().length > 0) {
            allLists = allLists.filter((list) =>
                listsSidebar.filteredListIds.includes(list.unifiedId),
            )
        }
        const userReference: UserReference = currentUser
            ? { type: 'user-reference', id: currentUser.id }
            : undefined

        const ownListsData = allLists.filter(
            (list) =>
                list.type !== 'page-link' &&
                cacheUtils.deriveListOwnershipStatus(list, userReference) ===
                    'Creator' &&
                list.localId !== parseFloat(SPECIAL_LIST_STRING_IDS.INBOX),
        )
        const followedListsData = allLists.filter(
            (list) =>
                list.type !== 'page-link' &&
                cacheUtils.deriveListOwnershipStatus(list, userReference) ===
                    'Follower' &&
                !list.isForeignList,
        )
        const joinedListsData = allLists.filter(
            (list) =>
                list.type !== 'page-link' &&
                cacheUtils.deriveListOwnershipStatus(list, userReference) ===
                    'Contributor',
        )

        return (
            <ListsSidebarContainer
                {...listsSidebar}
                spaceSidebarWidth={this.state.listsSidebar.spaceSidebarWidth}
                onTreeToggle={(listId) =>
                    this.processEvent('toggleListTreeShow', { listId })
                }
                onNestedListInputToggle={(listId) =>
                    this.processEvent('toggleNestedListInputShow', { listId })
                }
                setNestedListInputValue={(listId, value) =>
                    this.processEvent('setNewNestedListValue', {
                        listId,
                        value,
                    })
                }
                onConfirmNestedListCreate={(parentListId) =>
                    this.processEvent('createdNestedList', { parentListId })
                }
                openRemoteListPage={(remoteListId) =>
                    this.props.openSpaceInWebUI(remoteListId)
                }
                onConfirmListEdit={(listId: string, value: string) => {
                    this.processEvent('confirmListEdit', { value, listId })
                }}
                onConfirmListDelete={(listId: string) => {
                    this.processEvent('setDeletingListId', { listId: listId })
                    this.processEvent('confirmListDelete', null)
                }}
                switchToFeed={() => this.processEvent('switchToFeed', null)}
                onListSelection={(listId) => {
                    this.processEvent('setSelectedListId', { listId })
                }}
                onConfirmAddList={(value) =>
                    this.processEvent('confirmListCreate', { value })
                }
                onCancelAddList={() =>
                    this.processEvent('cancelListCreate', null)
                }
                setSidebarPeekState={(isPeeking) => () =>
                    this.processEvent('setSidebarPeeking', {
                        isPeeking,
                    })}
                searchBarProps={{
                    searchQuery: listsSidebar.searchQuery,
                    isSidebarLocked: listsSidebar.isSidebarLocked,
                    onCreateNew: (value) =>
                        this.processEvent('confirmListCreate', { value }),
                    onSearchQueryChange: (query) =>
                        this.processEvent('setListQueryValue', { query }),
                    onInputClear: () =>
                        this.processEvent('setListQueryValue', { query: '' }),
                    areLocalListsEmpty: !ownListsData.length,
                    getRootElement: this.props.getRootElement,
                }}
                ownListsGroup={{
                    isExpanded: listsSidebar.areLocalListsExpanded,
                    loadingState: listsSidebar.listLoadState,
                    title: 'My Spaces',
                    listData: ownListsData,
                    spaceSidebarWidth: this.state.listsSidebar
                        .spaceSidebarWidth,
                    onAddBtnClick: (event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        this.processEvent('setAddListInputShown', {
                            isShown: !listsSidebar.isAddListInputShown,
                        })
                    },
                    onExpandBtnClick: () =>
                        this.processEvent('setLocalListsExpanded', {
                            isExpanded: !listsSidebar.areLocalListsExpanded,
                        }),
                    getRootElement: this.props.getRootElement,
                }}
                followedListsGroup={{
                    isExpanded: listsSidebar.areFollowedListsExpanded,
                    loadingState: listsSidebar.listLoadState,
                    title: 'Followed Spaces',
                    spaceSidebarWidth: this.state.listsSidebar
                        .spaceSidebarWidth,
                    listData: followedListsData,
                    onExpandBtnClick: () =>
                        this.processEvent('setFollowedListsExpanded', {
                            isExpanded: !listsSidebar.areFollowedListsExpanded,
                        }),
                    getRootElement: this.props.getRootElement,
                }}
                joinedListsGroup={{
                    isExpanded: listsSidebar.areJoinedListsExpanded,
                    loadingState: listsSidebar.listLoadState,
                    title: 'Joined Spaces',
                    spaceSidebarWidth: this.state.listsSidebar
                        .spaceSidebarWidth,
                    onExpandBtnClick: () => {
                        this.processEvent('setJoinedListsExpanded', {
                            isExpanded: !listsSidebar.areJoinedListsExpanded,
                        })
                    },
                    listData: joinedListsData,
                    getRootElement: this.props.getRootElement,
                }}
                currentUser={this.state.currentUser}
                initContextMenuBtnProps={(listId) => ({
                    contentSharingBG: this.props.contentShareBG,
                    analyticsBG: this.props.analyticsBG,
                    spacesBG: this.props.listsBG,
                    onSetSpacePrivate: (isPrivate) =>
                        this.processEvent('setListPrivacy', {
                            listId,
                            isPrivate,
                        }),
                    toggleMenu: () =>
                        this.processEvent('setShowMoreMenuListId', { listId }),
                    toggleEditMenu: () =>
                        this.processEvent('setEditMenuListId', { listId }),
                    onDeleteSpaceIntent: () =>
                        this.processEvent('setDeletingListId', { listId }),
                    onDeleteSpaceConfirm: () =>
                        this.processEvent('confirmListDelete', null),
                    getRootElement: this.props.getRootElement,
                })}
                onListDragStart={(listId) => (e) =>
                    this.processEvent('dragList', {
                        listId,
                        dataTransfer: e.dataTransfer,
                    })}
                onListDragEnd={(listId) => (e) =>
                    this.processEvent('dropList', { listId })}
                initDropReceivingState={(listId) => ({
                    onDragEnter: () =>
                        this.processEvent('setDragOverListId', { listId }),
                    onDragLeave: () =>
                        this.processEvent('setDragOverListId', {
                            listId: undefined,
                        }),
                    onDrop: (dataTransfer) =>
                        this.processEvent('dropOnListItem', {
                            listId,
                            dataTransfer,
                        }),
                    canReceiveDroppedItems: true,
                    isDraggedOver: listId === listsSidebar.dragOverListId,
                    wasPageDropped:
                        listsSidebar.lists.byId[listId]?.wasPageDropped,
                })}
                getRootElement={this.props.getRootElement}
                isInPageMode={isInPageMode}
            />
        )
    }

    private renderPdfLocator() {
        if (!this.state.showDropArea) {
            return
        }
        return (
            <DropZoneBackground
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={(event) => event.preventDefault()}
                onDrop={(event) => this.processEvent('dropPdfFile', event)}
                // This exists as a way for the user to click it away if gets "stuck" (TODO: make it not get stuck)
                onClick={(event) => this.processEvent('dragFile', null)}
            >
                <DropZoneFrame>
                    <DropZoneContent>
                        <Icon
                            icon={icons.filePDF}
                            heightAndWidth={'40px'}
                            hoverOff
                        />
                        <DropZoneTitle>Drop PDF here to open it</DropZoneTitle>
                    </DropZoneContent>
                </DropZoneFrame>
            </DropZoneBackground>
        )
    }

    // TODO: This only exists until SpacePicker moves to use cached list data
    private localListPickerArgIdsToCached = (args: {
        added: number
        deleted: number
    }): { added: string; deleted: string } => {
        const added = this.props.annotationsCache.getListByLocalId(args.added)
            ?.unifiedId
        const deleted = this.props.annotationsCache.getListByLocalId(
            args.deleted,
        )?.unifiedId
        return { added, deleted }
    }

    private renderSearchResults() {
        const { searchResults, listsSidebar, searchFilters } = this.state

        return (
            <SearchResultsContainer
                inPageMode={this.props.inPageMode}
                imageSupport={this.props.imageSupportBG}
                annotationsCache={this.props.annotationsCache}
                showSpacesTab={(pageUrl) => {
                    this.notesSidebarRef.current.toggleSidebarShowForPageId(
                        pageUrl,
                        'all',
                    )
                }}
                filterByList={(localListId) => {
                    const listData = this.props.annotationsCache.getListByLocalId(
                        localListId,
                    )
                    if (!listData) {
                        throw new Error(
                            'Specified list to filter search by could not be found',
                        )
                    }
                    return this.processEvent('setSelectedListId', {
                        listId: listData.unifiedId,
                    })
                }}
                onBulkSelect={(itemData, remove) =>
                    this.processEvent('bulkSelectItems', {
                        item: itemData,
                        remove: remove,
                    })
                }
                getRootElement={this.props.getRootElement}
                selectedItems={
                    this.state.bulkSelectedUrls != null
                        ? Object.entries(this.state.bulkSelectedUrls)?.map(
                              ([key, _]) => key,
                          )
                        : []
                }
                spacePickerBGProps={{
                    authBG: this.props.authBG,
                    spacesBG: this.props.listsBG,
                    bgScriptBG: this.props.bgScriptBG,
                    analyticsBG: this.props.analyticsBG,
                    contentSharingBG: this.props.contentShareBG,
                    pageActivityIndicatorBG: this.props.pageActivityIndicatorBG,
                }}
                copyPasterBG={this.props.copyPasterBG}
                contentSharingByTabsBG={this.props.contentShareByTabsBG}
                clearInbox={() => this.processEvent('clearInbox', null)}
                isSpacesSidebarLocked={this.state.listsSidebar.isSidebarLocked}
                isNotesSidebarShown={this.state.isNoteSidebarShown}
                activePage={this.state.activePageID && true}
                syncSettingsBG={this.props.syncSettingsBG}
                listData={listsSidebar.lists}
                saveHighlightColor={(
                    id,
                    color: RGBAColor | string,
                    unifiedId,
                ) => {
                    {
                        this.processEvent('saveHighlightColor', {
                            noteId: id,
                            color: color,
                            unifiedId: unifiedId,
                        })
                    }
                }}
                saveHighlightColorSettings={(newState) => {
                    this.processEvent('saveHighlightColorSettings', {
                        newState,
                    })
                }}
                getHighlightColorSettings={() =>
                    this.processEvent('getHighlightColorSettings', null)
                }
                highlightColorSettings={this.state.highlightColors}
                getListDetailsById={this.getListDetailsById}
                youtubeService={this.youtubeService}
                toggleSortMenuShown={() =>
                    this.processEvent('setSortMenuShown', {
                        isShown: !searchResults.isSortMenuShown,
                    })
                }
                searchResults={searchResults.pageData} // TODO: Why is this being passed down multiple times?
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
                noResultsType={searchResults.noResultsType}
                paginateSearch={() =>
                    this.processEvent('search', { paginate: true })
                }
                areAllNotesShown={searchResultUtils.areAllNotesShown(
                    searchResults,
                )}
                onPageNotesSortSelection={(day, pageId) => (sortingFn) =>
                    this.processEvent('setPageNotesSort', {
                        day,
                        pageResultId: pageId,
                        sortingFn,
                    })}
                onPageNotesTypeSelection={(day, pageId) => (noteType) =>
                    this.processEvent('setPageNotesType', {
                        day,
                        pageResultId: pageId,
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
                onVideosSearchSwitch={() => {
                    this.processEvent('setSearchType', { searchType: 'videos' })
                }}
                onTwitterSearchSwitch={() => {
                    this.processEvent('setSearchType', {
                        searchType: 'twitter',
                    })
                }}
                onPDFSearchSwitch={() => {
                    this.processEvent('setSearchType', { searchType: 'pdf' })
                }}
                onEventSearchSwitch={() => {
                    this.processEvent('setSearchType', { searchType: 'events' })
                }}
                onPageLinkCopy={async (link: string) => {
                    this.processEvent('copyShareLink', {
                        link,
                        analyticsAction: 'copyPageLink',
                    })
                    return true
                }}
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
                updateSpacesSearchSuggestions={(query: string) => {
                    this.processEvent('updateSpacesSearchSuggestions', {
                        searchQuery: query,
                    })
                }}
                spaceSearchSuggestions={this.state.spaceSearchSuggestions}
                pageInteractionProps={{
                    onClick: (day, pageResultId) => async (event) => {
                        this.processEvent('clickPageResult', {
                            day,
                            pageResultId: pageResultId,
                            synthEvent: event,
                        })
                    },
                    onMatchingTextToggleClick: (
                        day,
                        pageResultId,
                    ) => async () =>
                        this.processEvent('onMatchingTextToggleClick', {
                            day,
                            pageResultId: pageResultId,
                        }),
                    onNotesBtnClick: (day, pageResultId) => (e) => {
                        // TODO: Multiple processEvent calls should never happen from a single user action. Needs to be unified
                        //  These are also running concurrently, potentially introducing race conditions
                        this.processEvent('toggleNoteSidebarOn', null)
                        const pageResult =
                            searchResults.results[-1].pages.byId[pageResultId]
                        const pageData =
                            searchResults.pageData.byId[pageResult.pageId]
                        this.processEvent('setActivePage', {
                            activeDay: day,
                            activePageID: pageResult.pageId,
                            activePage: true,
                        })

                        if (e.shiftKey) {
                            this.processEvent('setPageNotesShown', {
                                day,
                                pageResultId: pageResultId,
                                areShown: !searchResults.results[day].pages
                                    .byId[pageResultId].areNotesShown,
                            })
                            return
                        }

                        // TODO: Explain why a setTimeout is needed here
                        setTimeout(
                            () => {
                                this.notesSidebarRef.current.toggleSidebarShowForPageId(
                                    pageData.fullUrl,
                                    this.state.listsSidebar.selectedListId,
                                )
                            },
                            this.props.inPageMode ? 200 : 0,
                        )
                    },
                    onAIResultBtnClick: (day, pageResultId) => async () => {
                        this.processEvent('toggleNoteSidebarOn', null)
                        const pageResult =
                            searchResults.results[-1].pages.byId[pageResultId]
                        const pageData =
                            searchResults.pageData.byId[pageResult.pageId]

                        await this.notesSidebarRef.current.toggleAIShowForPageId(
                            pageData.fullUrl,
                        )
                    },
                    onListPickerFooterBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageListPickerShown', {
                            day,
                            pageResultId: pageId,
                            show: 'footer',
                        }),
                    onListPickerBarBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageListPickerShown', {
                            day,
                            pageResultId: pageId,
                            show: 'lists-bar',
                        }),
                    onCopyPasterBtnClick: (day, pageId) => (event) =>
                        this.processEvent('setPageCopyPasterShown', {
                            day,
                            pageResultId: pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isCopyPasterShown,
                            event: event,
                        }),
                    onCopyPasterDefaultExecute: (day, pageId) => (event) =>
                        this.processEvent('setCopyPasterDefaultExecute', {
                            day,
                            pageResultId: pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isCopyPasterShown,
                            event: event,
                        }),
                    onTrashBtnClick: (day, pageId) => (instaDelete) =>
                        this.processEvent('setDeletingPageArgs', {
                            day,
                            pageResultId: pageId,
                            instaDelete,
                        }),
                    onShareBtnClick: (day, pageId) => () =>
                        this.processEvent('setPageShareMenuShown', {
                            day,
                            pageResultId: pageId,
                            isShown: !searchResults.results[day].pages.byId[
                                pageId
                            ].isShareMenuShown,
                        }),
                    onMainContentHover: (day, pageId) => () => {
                        if (this.state.focusLockUntilMouseStart) {
                            return
                        }
                        this.processEvent('setPageHover', {
                            day,
                            pageResultId: pageId,
                            hover: 'main-content',
                        })

                        this.processEvent('changeFocusItem', {
                            item: {
                                id: pageId,
                                type: 'page',
                            },
                        })
                    },
                    onFooterHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageResultId: pageId,
                            hover: 'footer',
                        }),
                    onTagsHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageResultId: pageId,
                            hover: 'tags',
                        }),
                    onListsHover: (day, pageId) => () =>
                        this.processEvent('setPageHover', {
                            day,
                            pageResultId: pageId,
                            hover: 'lists',
                        }),
                    onUnhover: (day, pageId) => () => {
                        this.processEvent('setPageHover', {
                            day,
                            pageResultId: pageId,
                            hover: null,
                        })
                        if (this.state.focusLockUntilMouseStart) {
                            return
                        }
                        this.processEvent('changeFocusItem', {
                            item: {
                                id: null,
                                type: null,
                            },
                        })
                    },
                    onRemoveFromListBtnClick: (day, pageId) => () => {
                        this.processEvent('removePageFromList', {
                            day,
                            pageResultId: pageId,
                        })
                    },
                    onPageDrag: (day, pageId) => (e) =>
                        this.processEvent('dragPage', {
                            day,
                            pageResultId: pageId,
                            dataTransfer: e.dataTransfer,
                        }),
                    onPageDrop: (day, pageId) => () =>
                        this.processEvent('dropPage', {
                            day,
                            pageResultId: pageId,
                        }),
                    updatePageNotesShareInfo: (day, pageId) => (shareStates) =>
                        this.processEvent('updatePageNotesShareInfo', {
                            day,
                            pageResultId: pageId,
                            shareStates,
                        }),
                    onEditTitleSave: (day, pageId) => (
                        normalizedPageUrl,
                        changedTitle,
                    ) => {
                        this.processEvent('updatePageTitle', {
                            normalizedPageUrl,
                            changedTitle,
                            day,
                            pageId,
                        })
                    },
                    onEditTitleChange: (day, pageId) => (
                        normalizedPageUrl,
                        changedTitle,
                    ) => {
                        this.processEvent('updatePageTitleState', {
                            normalizedPageUrl,
                            changedTitle,
                            day,
                            pageId,
                        })
                    },
                }}
                pagePickerProps={{
                    onListPickerUpdate: (pageResultId) => (args) =>
                        this.processEvent('setPageLists', {
                            pageResultId: pageResultId,
                            ...this.localListPickerArgIdsToCached(args),
                        }),
                }}
                newNoteInteractionProps={{
                    getListDetailsById: (day, pageId) =>
                        this.getListDetailsById,
                    onCancel: (day, pageId) => () =>
                        this.processEvent('cancelPageNewNote', {
                            day,
                            pageResultId: pageId,
                        }),
                    onCommentChange: (day, pageId) => (value) =>
                        this.processEvent('setPageNewNoteCommentValue', {
                            day,
                            pageResultId: pageId,
                            value,
                        }),
                    addPageToList: (day, pageId) => (listId) => {
                        const listData = this.props.annotationsCache.getListByLocalId(
                            listId,
                        )
                        if (!listData) {
                            throw new Error(
                                'Specified list to add to page could not be found',
                            )
                        }
                        return this.processEvent('setPageNewNoteLists', {
                            day,
                            pageResultId: pageId,
                            lists: [
                                ...this.state.searchResults.results[day].pages
                                    .byId[pageId].newNoteForm.lists,
                                listData.unifiedId,
                            ],
                        })
                    },
                    removePageFromList: (day, pageId) => (listId) => {
                        const listData = this.props.annotationsCache.getListByLocalId(
                            listId,
                        )
                        if (!listData) {
                            throw new Error(
                                'Specified list to remove from page could not be found',
                            )
                        }
                        return this.processEvent('setPageNewNoteLists', {
                            day,
                            pageResultId: pageId,
                            lists: this.state.searchResults?.results[
                                day
                            ].pages.byId[pageId].newNoteForm.lists.filter(
                                (id) => id !== listData.unifiedId,
                            ),
                        })
                    },
                    onSave: (day, pageResultId) => async (
                        shouldShare,
                        isProtected,
                    ) => {
                        const pageResult =
                            searchResults.results[-1].pages.byId[pageResultId]
                        await this.processEvent('savePageNewNote', {
                            day,
                            pageResultId: pageResultId,
                            isProtected,
                            shouldShare,
                            fullPageUrl:
                                searchResults.pageData.byId[pageResult.pageId]
                                    .fullUrl,
                        })
                    },
                    addNewSpaceViaWikiLinksNewNote: (day, pageId) => (
                        spaceName: string,
                    ) => {
                        this.processEvent('addNewSpaceViaWikiLinksNewNote', {
                            spaceName: spaceName,
                            day: day,
                            pageId: pageId,
                        })
                    },

                    selectSpaceForEditorPicker: (day, pageId) => (
                        spaceId: number,
                    ) => {
                        const listData = this.props.annotationsCache.getListByLocalId(
                            spaceId,
                        )
                        if (!listData) {
                            throw new Error(
                                'Specified list to add to page could not be found',
                            )
                        }
                        this.processEvent('setPageNewNoteLists', {
                            day,
                            pageResultId: pageId,
                            lists: [
                                ...this.state.searchResults.results[day].pages
                                    .byId[pageId].newNoteForm.lists,
                                listData.unifiedId,
                            ],
                        })
                    },
                    removeSpaceFromEditorPicker: (day, pageId) => (
                        spaceId: number,
                    ) => {
                        const listData = this.props.annotationsCache.getListByLocalId(
                            spaceId,
                        )
                        if (!listData) {
                            throw new Error(
                                'Specified list to add to page could not be found',
                            )
                        }
                        this.processEvent('setPageNewNoteLists', {
                            day,
                            pageResultId: pageId,
                            lists: this.state.searchResults.results[
                                day
                            ].pages.byId[pageId].newNoteForm.lists.filter(
                                (id) => id !== listData.unifiedId,
                            ),
                        })
                    },
                }}
                noteInteractionProps={{
                    onEditBtnClick: (noteId) => () =>
                        this.processEvent('setNoteEditing', {
                            noteId,
                            isEditing: true,
                        }),
                    onEditHighlightBtnClick: (noteId) => () => {
                        this.processEvent('setBodyEditing', {
                            noteId,
                            isEditing: true,
                        })
                    },
                    onEditCancel: (noteId) => () =>
                        this.processEvent('cancelNoteEdit', {
                            noteId,
                        }),
                    onEditConfirm: (noteId) => (showExternalConfirmations) => (
                        shouldShare,
                        isProtected,
                        opts,
                    ) => {
                        return this.processEvent('saveNoteEdit', {
                            noteId,
                            shouldShare,
                            isProtected,
                            ...opts,
                        })
                    },
                    onGoToHighlightClick: (noteId) => () =>
                        this.processEvent('goToHighlightInNewTab', { noteId }),
                    onListPickerBarBtnClick: (noteId) => () =>
                        this.processEvent('setNoteListPickerShown', {
                            noteId,
                            show: 'lists-bar',
                        }),
                    onListPickerFooterBtnClick: (noteId) => () =>
                        this.processEvent('setNoteListPickerShown', {
                            noteId,
                            show: 'footer',
                        }),
                    onCopyPasterBtnClick: (noteId) => () =>
                        this.processEvent('setNoteCopyPasterShown', {
                            noteId,
                            isShown: !searchResults.noteData.byId[noteId]
                                .isCopyPasterShown,
                        }),

                    onCopyPasterDefaultExecute: (noteId) => () => {
                        this.processEvent('setCopyPasterDefaultNoteExecute', {
                            noteId,
                        })
                    },
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
                            this.state.listsSidebar.lists.byId[
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
                                ...this.localListPickerArgIdsToCached(args),
                                noteId,
                                protectAnnotation:
                                    args.options?.protectAnnotation,
                            },
                        )
                    },
                    onTrashBtnClick: (noteId, day, pageResultId) => (
                        instaDelete,
                    ) =>
                        this.processEvent('setDeletingNoteArgs', {
                            noteId,
                            pageResultId,
                            day,
                        }),
                    onCommentChange: (noteId) => (event) => {
                        this.processEvent('setNoteEditCommentValue', {
                            noteId,
                            value: event,
                        })
                    },
                    onBodyChange: (noteId) => (event) => {
                        this.processEvent('setNoteEditBodyValue', {
                            noteId,
                            value: event,
                        })
                    },
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
                    addNewSpaceViaWikiLinksEditNote: (noteId) => async (
                        spaceName: string,
                    ) => {
                        const {
                            localListId,
                        } = await this.props.listsBG.createCustomList({
                            name: spaceName,
                        })

                        return this.processEvent('setNoteLists', {
                            ...this.localListPickerArgIdsToCached({
                                added: localListId,
                                deleted: null,
                            }),
                            noteId,
                        })
                    },
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

        // if (modalsState.deletingListId) {
        //     return (
        //         <DeleteConfirmModal
        //             isShown
        //             message="Delete this Space?"
        //             submessage="This does NOT delete the pages in it"
        //             onClose={() => this.processEvent('cancelListDelete', null)}
        //             deleteDocs={() =>
        //                 this.processEvent('confirmListDelete', null)
        //             }
        //             icon={icons.collectionsEmpty}
        //         />
        //     )
        // }

        if (modalsState.deletingNoteArgs) {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    closeComponent={() =>
                        this.processEvent('cancelNoteDelete', null)
                    }
                    blockedBackground
                    positioning="centerCenter"
                >
                    <DeleteConfirmModal
                        isShown
                        message="Delete note?"
                        deleteDocs={() =>
                            this.processEvent('confirmNoteDelete', null)
                        }
                    />
                </OverlayModals>
            )
        }

        if (modalsState.deletingPageArgs) {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    closeComponent={() =>
                        this.processEvent('cancelPageDelete', null)
                    }
                    blockedBackground
                    positioning="centerCenter"
                >
                    <DeleteConfirmModal
                        isShown
                        message="Delete page and related notes?"
                        deleteDocs={() =>
                            this.processEvent('confirmPageDelete', null)
                        }
                    />
                </OverlayModals>
            )
        }

        if (modalsState.showLogin) {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    closeComponent={() =>
                        this.processEvent('setShowLoginModal', {
                            isShown: false,
                        })
                    }
                    blockedBackground
                    positioning="centerCenter"
                >
                    <LoginModal
                        authBG={this.props.authBG}
                        contentSharingBG={this.props.contentShareBG}
                        onSuccess={() =>
                            setTimeout(
                                () =>
                                    this.processEvent(
                                        'checkSharingAccess',
                                        null,
                                    ),
                                1000,
                            )
                        }
                        browserAPIs={this.props.browserAPIs}
                    />
                </OverlayModals>
            )
        }

        if (modalsState.showDisplayNameSetup) {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    closeComponent={() =>
                        this.processEvent('setShowDisplayNameSetupModal', {
                            isShown: false,
                        })
                    }
                    blockedBackground
                    positioning="centerCenter"
                >
                    <DisplayNameModal authBG={this.props.authBG} />
                </OverlayModals>
            )
        }

        if (modalsState.shareListId) {
            const listData = listsSidebar.lists.byId[modalsState.shareListId]

            return (
                <ListShareModal
                    {...(listData.remoteId != null
                        ? { listId: listData.remoteId }
                        : {
                              scheduleListShare: async () => {
                                  const shareResult = await this.props.contentShareBG.scheduleListShare(
                                      {
                                          localListId: listData.localId,
                                      },
                                  )
                                  //   await this.processEvent('setListRemoteId', {
                                  //       listId: listData.unifiedId,
                                  //       remoteListId: shareResult.remoteListId,
                                  //   })
                                  return shareResult
                              },
                              waitForListShareSideEffects: () =>
                                  this.props.contentShareBG.waitForListShareSideEffects(
                                      {
                                          localListId: listData.localId,
                                      },
                                  ),
                          })}
                    onCloseRequested={() =>
                        this.processEvent('setShareListId', {})
                    }
                    services={{
                        ...this.props.services,
                        listKeys: this.props.contentShareBG,
                    }}
                />
            )
        }

        // if (modalsState.showSubscription) {
        //     return (
        //         <SubscribeModal
        //             onClose={() =>
        //                 this.processEvent('setShowSubscriptionModal', {
        //                     isShown: false,
        //                 })
        //             }
        //         />
        //     )
        // }

        return null
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    render() {
        // <GlobalFonts />
        // <GlobalStyle />
        const { listsSidebar, mode } = this.state
        if (mode === 'onboarding') {
            return (
                <Onboarding
                    contentScriptsBG={this.props.contentScriptsBG}
                    authBG={this.props.authBG}
                    analyticsBG={this.props.analyticsBG}
                    bgScriptsBG={this.props.bgScriptBG}
                    browserAPIs={this.props.browserAPIs}
                />
            )
        }

        const style = {
            display:
                !listsSidebar.isSidebarPeeking && !listsSidebar.isSidebarLocked
                    ? 'none'
                    : 'flex',
            top: listsSidebar.isSidebarPeeking ? '20px' : '0',
            height: this.props.inPageMode
                ? '100%'
                : listsSidebar.isSidebarPeeking
                ? '90vh'
                : '100vh',
            position:
                this.props.inPageMode && listsSidebar.isSidebarPeeking
                    ? 'absolute'
                    : listsSidebar.isSidebarPeeking
                    ? 'fixed'
                    : 'sticky',
        }

        return (
            <Container
                onDragEnter={(event) => this.processEvent('dragFile', event)}
                inPageMode={this.props.inPageMode}
                fullSizeInPage={this.state.showFullScreen}
                id={'BlurContainer'}
            >
                {this.props.inPageMode && this.state.blurEffectReset && (
                    <InPageBackground key={Date.now()} />
                )}
                {this.renderPdfLocator()}
                <MainContainer inPageMode={this.props.inPageMode}>
                    <SidebarHeaderContainer>
                        <SidebarToggleBox>
                            <SidebarToggle
                                isSidebarLocked={listsSidebar.isSidebarLocked}
                                toggleSidebarLockedState={() =>
                                    this.processEvent('setSidebarLocked', {
                                        isLocked: !listsSidebar.isSidebarLocked,
                                    })
                                }
                                isHovered={listsSidebar.isSidebarToggleHovered}
                                onHoverEnter={() =>
                                    this.processEvent(
                                        'setSidebarToggleHovered',
                                        {
                                            isHovered: true,
                                        },
                                    )
                                }
                                onHoverLeave={() =>
                                    this.processEvent(
                                        'setSidebarToggleHovered',
                                        {
                                            isHovered: false,
                                        },
                                    )
                                }
                            />
                            <ActivityIndicator
                                hasActivities={listsSidebar.hasFeedActivity}
                            />
                        </SidebarToggleBox>
                        {!this.state.activePageID && !this.props.inPageMode && (
                            <MemexLogoContainer>
                                <Icon
                                    icon={'memexLogo'}
                                    height={'26px'}
                                    width={'180px'}
                                    originalImage
                                    hoverOff
                                />
                            </MemexLogoContainer>
                        )}
                    </SidebarHeaderContainer>
                    <PeekTrigger
                        onMouseEnter={() => {
                            this.processEvent('setSidebarPeeking', {
                                isPeeking: true,
                            })
                        }}
                        onDragEnter={() => {
                            this.processEvent('setSidebarPeeking', {
                                isPeeking: true,
                            })
                        }}
                        inPageMode={this.props.inPageMode}
                    />
                    <MainFrame inPageMode={this.props.inPageMode}>
                        <ListSidebarContent
                            inPageMode={this.props.inPageMode}
                            style={style}
                            size={{
                                height: this.props.inPageMode
                                    ? 'fill-available'
                                    : listsSidebar.isSidebarPeeking
                                    ? '90vh'
                                    : '100vh',
                            }}
                            peeking={
                                listsSidebar.isSidebarPeeking
                                    ? listsSidebar.isSidebarPeeking.toString()
                                    : undefined
                            }
                            position={{
                                x:
                                    listsSidebar.isSidebarLocked &&
                                    `$sizeConstants.header.heightPxpx`,
                            }}
                            locked={
                                listsSidebar.isSidebarLocked
                                    ? listsSidebar.isSidebarLocked.toString()
                                    : undefined
                            }
                            onMouseLeave={() => {
                                if (
                                    !this.state.listsSidebar.disableMouseLeave
                                ) {
                                    if (
                                        this.state.listsSidebar.isSidebarPeeking
                                    ) {
                                        this.processEvent('setSidebarPeeking', {
                                            isPeeking: false,
                                        })
                                    }
                                }
                            }}
                            // default={{ width: sizeConstants.listsSidebar.widthPx }}
                            resizeHandleClasses={{
                                right: 'sidebarResizeHandleSidebar',
                            }}
                            resizeGrid={[1, 0]}
                            dragAxis={'none'}
                            minWidth={sizeConstants.listsSidebar.width + 'px'}
                            maxWidth={'500px'}
                            disableDragging={true}
                            enableResizing={{
                                top: false,
                                right: true,
                                bottom: false,
                                left: false,
                                topRight: false,
                                bottomRight: false,
                                bottomLeft: false,
                                topLeft: false,
                            }}
                            onResize={(e, direction, ref, delta, position) => {
                                this.processEvent('setSpaceSidebarWidth', {
                                    width: ref.style.width,
                                })
                                this.processEvent('setDisableMouseLeave', {
                                    disable: true,
                                })
                            }}
                            onResizeStop={(
                                e,
                                direction,
                                ref,
                                delta,
                                position,
                            ) => {
                                this.processEvent('setDisableMouseLeave', {
                                    disable: false,
                                })
                            }}
                        >
                            {this.renderListsSidebar(this.props.inPageMode)}
                        </ListSidebarContent>
                        <MainContent inPageMode={this.props.inPageMode}>
                            {this.state.listsSidebar.selectedListId ===
                            SPECIAL_LIST_STRING_IDS.FEED ? (
                                <FeedContainer>
                                    {/* <TitleContainer>
                                        <SectionTitle>
                                            Activity Feed
                                        </SectionTitle>
                                        <SectionDescription>
                                            Updates from Spaces you follow or
                                            conversation you participate in
                                        </SectionDescription>
                                    </TitleContainer> */}
                                    <FeedFrame src={this.whichFeed()} />
                                </FeedContainer>
                            ) : (
                                <>
                                    {this.renderHeader()}
                                    {this.renderFiltersBar()}
                                    {this.renderSearchResults()}
                                </>
                            )}
                        </MainContent>
                        <NotesSidebar
                            storageAPI={this.props.browserAPIs.storage}
                            inPageMode={this.props.inPageMode}
                            imageSupport={this.props.imageSupportBG}
                            theme={this.props.theme}
                            hasFeedActivity={listsSidebar.hasFeedActivity}
                            clickFeedActivityIndicator={() =>
                                this.processEvent('switchToFeed', null)
                            }
                            shouldHydrateCacheOnInit
                            annotationsCache={this.props.annotationsCache}
                            youtubeService={this.youtubeService}
                            authBG={this.props.authBG}
                            copyToClipboard={this.props.copyToClipboard}
                            refSidebar={this.notesSidebarRef}
                            copyPasterBG={this.props.copyPasterBG}
                            customListsBG={this.props.listsBG}
                            analyticsBG={this.props.analyticsBG}
                            annotationsBG={this.props.annotationsBG}
                            imageSupportBG={this.props.imageSupportBG}
                            contentSharingBG={this.props.contentShareBG}
                            contentSharingByTabsBG={
                                this.props.contentShareByTabsBG
                            }
                            contentScriptsBG={this.props.contentScriptsBG}
                            syncSettingsBG={this.props.syncSettingsBG}
                            pageIndexingBG={this.props.pageIndexingBG}
                            pageActivityIndicatorBG={
                                this.props.pageActivityIndicatorBG
                            }
                            runtimeAPI={this.props.runtimeAPI}
                            browserAPIs={this.props.browserAPIs}
                            summarizeBG={this.props.summarizeBG}
                            contentConversationsBG={
                                this.props.contentConversationsBG
                            }
                            getCurrentUser={() =>
                                this.state.currentUser
                                    ? {
                                          id: this.state.currentUser?.id,
                                          type: 'user-reference',
                                      }
                                    : null
                            }
                            setLoginModalShown={(isShown) =>
                                this.processEvent('setShowLoginModal', {
                                    isShown,
                                })
                            }
                            setDisplayNameModalShown={(isShown) =>
                                this.processEvent(
                                    'setShowDisplayNameSetupModal',
                                    {
                                        isShown,
                                    },
                                )
                            }
                            showAnnotationShareModal={() =>
                                this.processEvent(
                                    'setShowNoteShareOnboardingModal',
                                    {
                                        isShown: true,
                                    },
                                )
                            }
                            onNotesSidebarClose={() => {
                                this.processEvent('toggleNoteSidebarOff', null)
                                this.processEvent('setActivePage', {
                                    activeDay: undefined,
                                    activePageID: undefined,
                                    activePage: false,
                                })
                            }}
                            saveHighlightColor={(id, color, unifiedId) => {
                                {
                                    this.processEvent('saveHighlightColor', {
                                        noteId: id,
                                        color: color,
                                        unifiedId: unifiedId,
                                    })
                                }
                            }}
                            saveHighlightColorSettings={(newState) => {
                                this.processEvent(
                                    'saveHighlightColorSettings',
                                    {
                                        newState: newState,
                                    },
                                )
                            }}
                            getHighlightColorSettings={() =>
                                this.processEvent(
                                    'getHighlightColorSettings',
                                    null,
                                )
                            }
                            highlightColorSettings={this.state.highlightColors}
                            getRootElement={this.props.getRootElement}
                        />
                    </MainFrame>
                    {this.renderModals()}
                    <HelpBtn
                        theme={this.state.themeVariant}
                        toggleTheme={() =>
                            this.processEvent('toggleTheme', null)
                        }
                        getRootElement={this.props.getRootElement}
                        padding={'4px'}
                        iconSize="22px"
                    />
                    {/* {this.state.listsSidebar.draggedListId != null ||
                        (this.state.searchResults.draggedPageId != null && ( */}
                    <DragElement
                        isHoveringOverListItem={
                            listsSidebar.dragOverListId != null
                        }
                    />
                    {/* ))} */}
                    {this.props.renderUpdateNotifBanner()}
                    <BulkEditWidget
                        deleteBulkSelection={() =>
                            this.processEvent('bulkDeleteItem', null)
                        }
                        selectAllPages={() =>
                            this.processEvent('selectAllCurrentItems', null)
                        }
                        clearBulkSelection={() =>
                            this.processEvent('clearBulkSelection', null)
                        }
                        removeIndividualSelection={(itemData) =>
                            this.processEvent('bulkSelectItems', {
                                item: itemData,
                                remove: true,
                            })
                        }
                        bulkDeleteLoadingState={
                            this.state.bulkDeleteLoadingState
                        }
                        bulkEditSpacesLoadingState={
                            this.state.bulkEditSpacesLoadingState
                        }
                        getRootElement={this.props.getRootElement}
                        citeMenu={() => {
                            return (
                                <BulkEditCopyPaster
                                    getRootElement={this.props.getRootElement}
                                    copyPasterBG={this.props.copyPasterBG}
                                    normalizedPageUrls={Object.entries(
                                        this.state.bulkSelectedUrls,
                                    )
                                        .filter(
                                            ([_, value]) =>
                                                value.type === 'page',
                                        )
                                        .map(([key, _]) => key)}
                                    onClickOutside={null}
                                    annotationUrls={Object.entries(
                                        this.state.bulkSelectedUrls,
                                    )
                                        .filter(
                                            ([_, value]) =>
                                                value.type === 'note',
                                        )
                                        .map(([key, _]) => key)}
                                />
                            )
                        }}
                        spacePicker={() => {
                            return (
                                <SpacePicker
                                    authBG={this.props.authBG}
                                    spacesBG={this.props.listsBG}
                                    bgScriptBG={this.props.bgScriptBG}
                                    localStorageAPI={this.props.localStorage}
                                    contentSharingBG={this.props.contentShareBG}
                                    analyticsBG={this.props.analyticsBG}
                                    annotationsCache={
                                        this.props.annotationsCache
                                    }
                                    pageActivityIndicatorBG={
                                        this.props.pageActivityIndicatorBG
                                    }
                                    selectEntry={async (listId) => {
                                        await this.processEvent(
                                            'setBulkEditSpace',
                                            { listId: listId },
                                        )
                                    }}
                                    unselectEntry={null}
                                    onSpaceCreate={async ({ localListId }) => {
                                        // await this.props.annotationsCache.addList(
                                        //     {
                                        //         name,
                                        //         localId: listId,
                                        //         unifiedAnnotationIds: [],
                                        //         hasRemoteAnnotationsToLoad: false,
                                        //         creator: {
                                        //             id: this.state.currentUser
                                        //                 .id,
                                        //             type: 'user-reference',
                                        //         },
                                        //         type: 'user-list',
                                        //     },
                                        // )
                                        await this.processEvent(
                                            'setBulkEditSpace',
                                            { listId: localListId },
                                        )
                                    }}
                                    width={'300px'}
                                    autoFocus={false}
                                />
                            )
                        }}
                    />
                </MainContainer>
                {!this.state.activePageID && (
                    <MemexLogoContainer location={'bottomLeft'}>
                        <Icon
                            icon={'memexIconOnly'}
                            height={'26px'}
                            width={'30px'}
                            originalImage
                            hoverOff
                        />
                    </MemexLogoContainer>
                )}
            </Container>
        )
    }
}
const MemexLogoContainer = styled.div<{
    location?: 'bottomLeft' | 'topLeft'
}>`
    position: absolute;
    top: 16px;
    left: 28px;

    @media (max-width: 1200px) {
        display: none;
    }

    ${(props) =>
        props.location === 'bottomLeft' &&
        css`
            left: 15px;
            bottom: 15px;
            top: unset;
        `}
`

const Container = styled.div<{
    inPageMode: boolean
    fullSizeInPage: boolean
}>`
    display: flex;
    position: relative;
    flex-direction: column;
    width: fill-available;
    background-color: ${(props) =>
        props.theme.variant === 'dark' ? '#313239' : props.theme.colors.black};
    height: 100vh;
    width: 100vw;
    /* min-width: fit-content; */
    overflow: hidden;

    ::-webkit-scrollbar {
        background: transparent;
        width: 8px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: transparent;
        margin: 2px 0px 2px 0px;
        width: 8px;
        padding: 1px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${(props) => props.theme.colors.greyScale2};
        border-radius: 10px;
        width: 4px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
    }

    & * {
        font-family: 'Satoshi', sans-serif;
font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on, 'liga' off;
    }

    ${(props) =>
        props.inPageMode &&
        css`
            min-height: fill-available;
            height: fill-available;
            border-radius: 30px;
        `}
    ${(props) =>
        props.inPageMode &&
        css`
            height: 80vh;
            width: 80vw;
        `}
    ${(props) =>
        props.inPageMode &&
        props.fullSizeInPage &&
        css`
            animation: ${resizeAnimation} 200ms ease-in-out forwards;
            max-height: 1000px:
            max-width: 1280px;
        `}
    `

const resizeAnimation = keyframes`
    0% {
        height: 80vh;
    width: 80vw;
    }
    100% {
        height: 95vh;
        width: 95vw;
    }
`

const MainContainer = styled.div<{
    inPageMode: boolean
}>`
    display: flex;
    flex-direction: column;
    height: fill-available;
    width: fill-available;
    overflow: hidden;
`

const DropZoneBackground = styled.div`
    position: absolute;
    height: 100vh;
    width: fill-available;
    top: 0px;
    left: 0px;
    background: ${(props) => props.theme.colors.black}60;
    backdrop-filter: blur(20px);
    padding: 0 40px;
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    z-index: 10000;
`

const DropZoneFrame = styled.div`
    border: 1px solid ${(props) => props.theme.colors.prime1}60;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 90vh;
    width: fill-available;
`

const showText = keyframes`
 0% { opacity: 0.3; scale: 0.95 }
 100% { opacity: 1; scale: 1}
`

const DropZoneContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
    flex-direction: column;
    align-items: center;
    opacity: 0.3;
    scale: 0.95;

    animation: ${showText} 400ms cubic-bezier(0.4, 0, 0.2, 1) 50ms forwards;
`

const DropZoneTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 20px;
    text-align: center;
`

const MainContent = styled.div<{
    inPageMode: boolean
}>`
    width: fill-available;
    align-items: center;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    flex: 1;
    overflow: hidden;

    ${(props) =>
        props.inPageMode &&
        css`
            min-height: 60%;
        `}
`

const ListSidebarContent = styled(Rnd)<{
    locked: boolean
    peeking: boolean
    inPageMode: boolean
}>`
    display: flex;
    flex-direction: column;
    justify-content: start;
    z-index: 3000;
    left: 0px;


    ${(props) =>
        props.locked &&
        css`
            height: 100vh;
            background-color: ${(props) => props.theme.colors.greyScale1};
            border-right: solid 1px ${(props) => props.theme.colors.greyScale2};
            padding-top: ${sizeConstants.header.heightPx - 15}px;
        `}
    ${(props) =>
        props.peeking &&
        css`
            position: absolute
            height: max-content;
            background-color: ${(props) => props.theme.colors.greyScale1}98;
            backdrop-filter: blur(30px);
            //box-shadow: rgb(16 30 115 / 3%) 4px 0px 16px;
            margin-top: 50px;
            margin-bottom: 9px;
            margin-left: 10px;
            height: 90vh;
            top: 20px;
            left: 0px;
            border-radius: ${(props) =>
                props.inPageMode ? '10px 10px 10px 30px' : '10px'};
            animation: slide-in ease-in-out;
            animation-duration: 0.15s;
            border: 1px solid ${(props) => props.theme.colors.greyScale2};
        `}

    ${(props) =>
        props.inPageMode &&
        css`
            position: relative;
            height: ${() => (isFirefox ? '90%' : 'fill-available')};
            left: unset;
        `}

    ${(props) =>
        !props.peeking &&
        !props.locked &&
        css`
            display: none;
        `}


        @keyframes slide-in {
            0% {
                left: -200px;
                opacity: 0%;
            }
            100% {
                left: 0px;
                opacity: 100%;
            }
        }

        ${(props) =>
            props.theme.variant === 'light' &&
            css`
                border-color: ${(props) => props.theme.colors.greyScale2};
                /* box-shadow: ${() =>
                    props.theme.borderStyles.boxShadowRight}; */
            `};
`

const FeedContainer = styled.div`
    display: flex;
    width: fill-available;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    grid-gap: 20px;
    margin-top: 60px;
`

const FeedFrame = styled.iframe`
    width: fill-available;
    min-height: 100vh;
    height: 100%;
    border: none;
`

const TitleContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    grid-gap: 10px;
    width: fill-available;
    padding: 0 30px;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 24px;
    font-weight: bold;
`
const SectionDescription = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
`

const MainFrame = styled.div<{
    inPageMode: boolean
}>`
    display: flex;
    flex-direction: row;
    min-height: 100vh;
    height: fill-available;
    overflow: hidden;
    position: relative;

    width: fill-available;
    ${(props) =>
        props.inPageMode &&
        css`
            min-height: fit-content;
        `}
`

const PeekTrigger = styled.div<{
    inPageMode?: boolean
}>`
    height: 100vh;
    width: 10px;
    position: fixed;
    background: transparent;
    z-index: 50;

    ${(props) =>
        props.inPageMode &&
        css`
            height: ${() => (isFirefox ? '90%' : 'fill-available')};
        `}
`

const SidebarToggleBox = styled(Margin)`
    width: fit-content;
    display: flex;
    align-items: center;
    position: absolute;
    top: 10px;
    left: 10px;
`

const ActivityIndicator = styled.div<{ hasActivities }>`
    border-radius: 20px;
    height: 10px;
    width: 10px;
    margin-left: -24px;
    border: ${(props) =>
        props.hasActivities && '2px solid' + props.theme.colors.prime1};
    background: ${(props) => props.hasActivities && props.theme.colors.prime1};
`

const SidebarHeaderContainer = styled.div`
    height: 100%;
    width: ${sizeConstants.listsSidebar.width}px;
    display: flex;
    position: sticky;
    top: 0px;
    z-index: 4000;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    flex: 1;

    & div {
        justify-content: flex-start;
    }
`

const ActionWrapper = styled.div`
    & span {
        @media screen and (max-width: 900px) {
            display: none;
        }
    }

    & > div {
        @media screen and (max-width: 900px) {
            width: 34px;
        }
    }
`

const HeaderContainer = styled.div`
    height: ${sizeConstants.header.heightPx}px;
    width: fill-available;
    width: -moz-available;
    position: sticky;
    top: 0;
    /* left: 150px; */
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background-color: ${(props) => props.theme.colors.black2}75;
    z-index: 3500;
    box-shadow: 0px 1px 0px ${(props) => props.theme.colors.greyScale2};
`

const SearchSection = styled(Margin)`
    justify-content: flex-start !important;
    max-width: 825px !important;
    height: 60px;

    & > div {
        justify-content: flex-start !important;
    }
`

const RightHeader = styled.div<{
    notesSidebarShown: boolean
}>`
    width: min-content;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
    position: absolute;
    right: 30px;
    grid-gap: 15px;

    @media screen and (max-width: 900px) {
        right: 15px;
    }

    ${(props) =>
        props.notesSidebarShown &&
        css`
            right: 10px;
        `}
`

const InPageBackground = styled.div`
    height: 10vh;
    width: 10vw;
    top: 0px;
    right: 0px;
    background: transparent;
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 10000;
`

const TooltipContent = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    flex-direction: row;
    justify-content: center;
`

const LeftSideRightHeader = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
`
const RightSideRightHeader = styled.div``
