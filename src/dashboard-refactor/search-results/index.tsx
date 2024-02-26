import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import Waypoint from 'react-waypoint'
import browser from 'webextension-polyfill'
// import { SketchPicker } from 'react-color'

import type {
    RootState,
    PageResult as PageResultData,
    PageData,
    PageInteractionAugdProps,
    NoteInteractionAugdProps,
    NotesType,
    NoteInteractionProps,
    PagePickerProps,
    PageInteractionProps,
    PagePickerAugdProps,
    NoResultsType,
} from './types'
import type { RootState as ListSidebarState } from '../lists-sidebar/types'
import TopBar from './components/result-top-bar'
import SearchTypeSwitch, {
    Props as SearchTypeSwitchProps,
} from '@worldbrain/memex-common/lib/common-ui/components/search-type-switch'
import DayResultGroup from './components/day-result-group'
import PageResult from './components/page-result'
import { bindFunctionalProps, formatDayGroupTime } from './util'
import { SortingDropdownMenuBtn } from 'src/sidebar/annotations-sidebar/components/SortingDropdownMenu'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationCreate,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import { sizeConstants } from '../constants'
import AnnotationEditable from 'src/annotations/components/HoverControlledAnnotationEditable'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import SingleNoteShareMenu from 'src/overview/sharing/SingleNoteShareMenu'
import Margin from 'src/dashboard-refactor/components/Margin'
import MobileAppAd from 'src/sync/components/device-list/mobile-app-ad'
import * as icons from 'src/common-ui/components/design-library/icons'
import ListDetails, {
    Props as ListDetailsProps,
} from './components/list-details'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import type {
    AnnotationSharingStates,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
import type { ListDetailsGetter } from 'src/annotations/types'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import type { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { SPECIAL_LIST_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/types'
import type { PageAnnotationsCacheInterface } from 'src/annotations/cache/types'
import type { ImageSupportInterface } from 'src/image-support/background/types'
import PageCitations from 'src/citations/PageCitations'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'

const timestampToString = (timestamp: number) =>
    timestamp === -1 ? undefined : formatDayGroupTime(timestamp)

type NewNoteInteractionProps = AnnotationCreateEventProps & {
    addPageToList: SpacePickerDependencies['selectEntry']
    removePageFromList: SpacePickerDependencies['unselectEntry']
}

export type Props = RootState &
    Pick<
        SearchTypeSwitchProps,
        | 'onNotesSearchSwitch'
        | 'onPagesSearchSwitch'
        | 'onVideosSearchSwitch'
        | 'onTwitterSearchSwitch'
        | 'onPDFSearchSwitch'
        | 'onEventSearchSwitch'
    > & {
        annotationsCache: PageAnnotationsCacheInterface // TODO: Ideally this doesn't need to be passed down here
        isSpacesSidebarLocked?: boolean
        isNotesSidebarShown?: boolean
        searchFilters?: any
        activePage?: boolean
        searchResults?: any
        searchQuery?: string
        listData: ListSidebarState['lists']
        goToImportRoute: () => void
        toggleListShareMenu: () => void
        selectedListId?: string
        areAllNotesShown: boolean
        copyPasterBG: RemoteCopyPasterInterface
        contentSharingByTabsBG: RemoteContentSharingByTabsInterface<'caller'>
        toggleSortMenuShown: () => void
        pageInteractionProps: PageInteractionAugdProps
        noteInteractionProps: NoteInteractionAugdProps
        listDetailsProps: ListDetailsProps
        pagePickerProps: PagePickerAugdProps
        youtubeService: YoutubeService
        onShowAllNotesClick: React.MouseEventHandler
        noResultsType: NoResultsType
        onDismissMobileAd: React.MouseEventHandler
        onDismissOnboardingMsg: React.MouseEventHandler
        onDismissSubscriptionBanner: React.MouseEventHandler
        isDisplayed: boolean
        openListShareModal: () => void
        newNoteInteractionProps: {
            [Key in keyof NewNoteInteractionProps]: (
                day: number,
                pageId: string,
            ) => NewNoteInteractionProps[Key]
        }
        onPageNotesTypeSelection(
            day: number,
            pageId: string,
        ): (selection: NotesType) => void
        onPageNotesSortSelection(
            day: number,
            pageId: string,
        ): (sorter: AnnotationsSorter) => void
        getListDetailsById: ListDetailsGetter
        paginateSearch(): Promise<void>
        onPageLinkCopy(link: string): Promise<boolean>
        onNoteLinkCopy(link: string): Promise<void>
        onListLinkCopy(link: string): Promise<void>
        // updateAllResultNotesShareInfo: (info: NoteShareInfo) => void
        updateAllResultNotesShareInfo: (state: AnnotationSharingStates) => void
        clearInbox: () => void
        filterByList: (localListId: number) => void
        imageSupport: ImageSupportInterface<'caller'>
        onBulkSelect: (itemData, remove) => Promise<void>
        selectedItems: string[]
        saveHighlightColor?: (noteId, colorId, color) => void
        saveHighlightColorSettings?: (newState) => void
        getHighlightColorSettings?: () => void
        highlightColorSettings: string
        getRootElement: () => HTMLElement
        showSpacesTab: (pageUrl) => void
        // onEditPageBtnClick: (
        //     normalizedPageUrl: string,
        //     changedTitle: string,
        // ) => void
        inPageMode?: boolean
        syncSettingsBG?: RemoteSyncSettingsInterface
        spacePickerBGProps: Pick<
            SpacePickerDependencies,
            | 'authBG'
            | 'spacesBG'
            | 'bgScriptBG'
            | 'analyticsBG'
            | 'contentSharingBG'
            | 'pageActivityIndicatorBG'
        >
    }

export interface State {
    tutorialState: []
    showTutorialVideo: boolean
    showHorizontalScrollSwitch: string
    showPopoutsForResultBox: number
}

export default class SearchResultsContainer extends React.Component<
    Props,
    State
> {
    private ResultsScrollContainerRef = React.createRef<HTMLDivElement>()
    private renderLoader = (props: { key?: string } = {}) => (
        <Loader {...props}>
            <LoadingIndicator />
        </Loader>
    )
    componentDidMount() {
        this.getTutorialState()
        this.listenToContentSwitcherSizeChanges()
    }

    listenToContentSwitcherSizeChanges() {
        const topBarElement = document.getElementById(
            'SearchTypeSwitchContainer',
        )
        if (!topBarElement) {
            return
        }

        if (topBarElement.clientWidth < topBarElement.scrollWidth) {
            this.setState({
                showHorizontalScrollSwitch: 'right',
            })
        } else {
            this.setState({
                showHorizontalScrollSwitch: 'none',
            })
        }

        topBarElement.addEventListener('scroll', () => {
            this.contentSwitcherResizeLogic(topBarElement)
        })

        const resizeObservation = new ResizeObserver((output) => {
            this.contentSwitcherResizeLogic(output[0].target)
        })

        resizeObservation.observe(topBarElement)

        topBarElement.addEventListener('resize', () => {
            this.contentSwitcherResizeLogic(topBarElement)
        })

        window.addEventListener('resize', () => {
            if (topBarElement.clientWidth < topBarElement.scrollWidth) {
                this.setState({
                    showHorizontalScrollSwitch: 'right',
                })
                if (topBarElement.scrollLeft > 0) {
                    this.setState({
                        showHorizontalScrollSwitch: 'both',
                    })
                }
                if (
                    Math.abs(
                        Math.ceil(
                            topBarElement.scrollLeft +
                                topBarElement.clientWidth,
                        ) - topBarElement.scrollWidth,
                    ) < 5
                ) {
                    this.setState({
                        showHorizontalScrollSwitch: 'left',
                    })
                }
            } else {
                this.setState({
                    showHorizontalScrollSwitch: 'none',
                })
            }
        })
    }

    contentSwitcherResizeLogic(topBarElement) {
        if (topBarElement.clientWidth < topBarElement.scrollWidth) {
            this.setState({
                showHorizontalScrollSwitch: 'right',
            })
            if (topBarElement.scrollLeft > 0) {
                this.setState({
                    showHorizontalScrollSwitch: 'left',
                })

                if (
                    Math.ceil(
                        topBarElement.scrollLeft + topBarElement.clientWidth,
                    ) !== topBarElement.scrollWidth
                ) {
                    this.setState({
                        showHorizontalScrollSwitch: 'both',
                    })
                }

                if (
                    Math.abs(
                        Math.ceil(
                            topBarElement.scrollLeft +
                                topBarElement.clientWidth,
                        ) - topBarElement.scrollWidth,
                    ) < 5
                ) {
                    this.setState({
                        showHorizontalScrollSwitch: 'left',
                    })
                }
            }
        } else {
            this.setState({
                showHorizontalScrollSwitch: 'none',
            })
            return
        }
    }

    sortButtonRef = React.createRef<HTMLDivElement>()

    state = {
        showTutorialVideo: false,
        tutorialState: undefined,
        showHorizontalScrollSwitch: 'none',
        showPopoutsForResultBox: null,
    }

    private getLocalListIdsForCacheIds = (listIds: string[]): number[] =>
        listIds
            .map((listId) => this.props.listData.byId[listId]?.localId)
            .filter((listId) => listId != null)

    private getRemoteIdsForCacheIds = (listIds: string[]): string[] =>
        listIds
            .map((listId) => this.props.listData.byId[listId]?.remoteId)
            .filter((listId) => listId != null)

    private renderNoteResult = (
        day: number,
        pageId: string,
        zIndex: number,
    ) => (noteId: string) => {
        const pageData = this.props.pageData.byId[pageId]
        const noteData = this.props.noteData.byId[noteId]

        const interactionProps = bindFunctionalProps<
            NoteInteractionAugdProps,
            NoteInteractionProps
        >(this.props.noteInteractionProps, noteId, day, pageId)

        const dummyEvent = {} as any

        const cachedListIds = noteData.isShared
            ? [
                  ...new Set([
                      ...pageData.lists.filter(
                          (listId) =>
                              this.props.listData.byId[listId]?.remoteId !=
                              null,
                      ),
                      ...noteData.lists,
                  ]),
              ]
            : noteData.lists
        const localListIds = this.getLocalListIdsForCacheIds(cachedListIds)
        const hasSharedLists = this.getRemoteIdsForCacheIds(cachedListIds)

        const noteColor = JSON.parse(this.props.highlightColorSettings).find(
            (item) => {
                return item.id === noteData.color
            },
        )?.color

        return (
            <AnnotationEditable
                imageSupport={this.props.imageSupport}
                zIndex={zIndex}
                key={noteId}
                unifiedId={noteId}
                tags={noteData.tags}
                lists={localListIds}
                color={noteColor}
                body={noteData.highlight}
                comment={noteData.comment}
                isShared={noteData.isShared}
                getListDetailsById={this.props.getListDetailsById}
                isBulkShareProtected={noteData.isBulkShareProtected}
                createdWhen={new Date(noteData.displayTime)}
                onGoToAnnotation={interactionProps.onGoToHighlightClick}
                contextLocation={'dashboard'}
                getRootElement={this.props.getRootElement}
                lastEdited={
                    noteData.isEdited
                        ? new Date(noteData.displayTime)
                        : undefined
                }
                saveHighlightColorSettings={
                    this.props.saveHighlightColorSettings
                }
                getHighlightColorSettings={this.props.getHighlightColorSettings}
                highlightColorSettings={this.props.highlightColorSettings}
                isEditing={noteData.isEditing}
                isEditingHighlight={noteData.isBodyEditing}
                isDeleting={false}
                renderCopyPasterForAnnotation={() => (
                    <PageCitations
                        annotationUrls={[noteData.url]}
                        copyPasterProps={{
                            copyPasterBG: this.props.copyPasterBG,
                            getRootElement: this.props.getRootElement,
                            onClickOutside:
                                interactionProps.onCopyPasterBtnClick,
                        }}
                        pageLinkProps={{
                            ...this.props.spacePickerBGProps,
                            annotationsCache: this.props.annotationsCache,
                            contentSharingByTabsBG: this.props
                                .contentSharingByTabsBG,
                            copyToClipboard: this.props.onPageLinkCopy,
                            fullPageUrl: pageData.fullUrl,
                            getRootElement: this.props.getRootElement,
                            showSpacesTab: this.props.showSpacesTab,
                            fromDashboard: true,
                        }}
                        annotationShareProps={{
                            isForAnnotation: true,
                            postShareHook: interactionProps.updateShareInfo,
                            annotationsCache: this.props.annotationsCache,
                        }}
                        getRootElement={this.props.getRootElement}
                        syncSettingsBG={this.props.syncSettingsBG}
                    />
                )}
                toggleAutoAdd={null}
                copyPasterAnnotationInstanceId={null}
                spacePickerAnnotationInstance={null}
                shareMenuAnnotationInstanceId={null}
                renderListsPickerForAnnotation={() => (
                    <CollectionPicker
                        {...this.props.spacePickerBGProps}
                        showPageLinks
                        annotationsCache={this.props.annotationsCache}
                        initialSelectedListIds={() => localListIds}
                        selectEntry={(listId) =>
                            interactionProps.updateLists({
                                added: listId,
                                deleted: null,
                                selected: [],
                                options: {
                                    showExternalConfirmations: true,
                                },
                            })
                        }
                        unselectEntry={(listId) =>
                            interactionProps.updateLists({
                                added: null,
                                deleted: listId,
                                selected: [],
                                options: {
                                    showExternalConfirmations: true,
                                },
                            })
                        }
                        normalizedPageUrlToFilterPageLinksBy={pageId}
                        analyticsBG={this.props.spacePickerBGProps.analyticsBG}
                    />
                )}
                renderShareMenuForAnnotation={() => (
                    <SingleNoteShareMenu
                        getRemoteListIdForLocalId={(localListId) =>
                            this.props.listData[localListId]?.remoteId ?? null
                        }
                        isShared={
                            noteData.isShared || noteData.lists.length > 0
                        }
                        analyticsBG={this.props.spacePickerBGProps.analyticsBG}
                        annotationData={noteData}
                        shareImmediately={
                            noteData.shareMenuShowStatus === 'show-n-share'
                        }
                        annotationUrl={noteId}
                        copyLink={this.props.onNoteLinkCopy}
                        postShareHook={interactionProps.updateShareInfo}
                        spacePickerProps={{
                            ...this.props.spacePickerBGProps,
                            normalizedPageUrlToFilterPageLinksBy: pageId,
                            annotationsCache: this.props.annotationsCache,
                            initialSelectedListIds: () => localListIds,
                            selectEntry: (listId, options) =>
                                interactionProps.updateLists({
                                    added: listId,
                                    deleted: null,
                                    selected: [],
                                    options,
                                }),
                            unselectEntry: (listId) =>
                                interactionProps.updateLists({
                                    added: null,
                                    deleted: listId,
                                    selected: [],
                                }),
                        }}
                        getRootElement={this.props.getRootElement}
                    />
                )}
                annotationEditDependencies={{
                    comment: noteData.editNoteForm.inputValue,
                    body: noteData.editNoteForm.bodyInputValue,
                    copyLoadingState: noteData.copyLoadingState,
                    onCommentChange: (content) =>
                        interactionProps.onCommentChange(content),
                    onEditCancel: () =>
                        interactionProps.onEditCancel(dummyEvent),
                    onEditConfirm: interactionProps.onEditConfirm,
                    imageSupport: this.props.imageSupport,
                    getRootElement: this.props.getRootElement,
                    onBodyChange: (content) =>
                        interactionProps.onBodyChange(content),
                    setEditing: interactionProps.onEditBtnClick,
                }}
                annotationFooterDependencies={{
                    onCopyPasterDefaultExecute:
                        interactionProps.onCopyPasterDefaultExecute,
                    onDeleteCancel: () => undefined,
                    onDeleteConfirm: () => undefined,
                    onDeleteIconClick: interactionProps.onTrashBtnClick,
                    onCopyPasterBtnClick: interactionProps.onCopyPasterBtnClick,
                    onEditIconClick: interactionProps.onEditBtnClick,
                    onShareClick: interactionProps.onShareBtnClick,
                    onEditHighlightIconClick:
                        interactionProps.onEditHighlightBtnClick,
                }}
            />
        )
    }

    private renderPageNotes(
        {
            areNotesShown,
            normalizedUrl,
            newNoteForm,
            notesType,
            isShared,
            noteIds,
        }: PageResultData & PageData,
        day: number,
        { onShareBtnClick }: PageInteractionProps,
    ) {
        if (!areNotesShown) {
            return null
        }
        const { newNoteInteractionProps } = this.props

        const boundAnnotCreateProps = bindFunctionalProps<
            typeof newNoteInteractionProps,
            NewNoteInteractionProps
        >(newNoteInteractionProps, day, normalizedUrl)
        const lists = this.getLocalListIdsForCacheIds(newNoteForm.lists)

        return (
            <PageNotesBox bottom="10px" left="10px">
                <PageNotesContainer>
                    <AnnotationCreate
                        autoFocus={false}
                        comment={newNoteForm.inputValue}
                        lists={lists}
                        getListDetailsById={this.props.getListDetailsById}
                        {...boundAnnotCreateProps}
                        contextLocation={'dashboard'}
                        renderSpacePicker={() => (
                            <CollectionPicker
                                {...this.props.spacePickerBGProps}
                                showPageLinks
                                annotationsCache={this.props.annotationsCache}
                                initialSelectedListIds={() => lists}
                                selectEntry={
                                    boundAnnotCreateProps.addPageToList
                                }
                                unselectEntry={
                                    boundAnnotCreateProps.removePageFromList
                                }
                                normalizedPageUrlToFilterPageLinksBy={
                                    normalizedUrl
                                }
                            />
                        )}
                        imageSupport={this.props.imageSupport}
                        getRootElement={this.props.getRootElement}
                    />
                </PageNotesContainer>
                <NoteResultContainer>
                    {/* {noteIds[notesType].length > 0 && (
                        <SortButtonContainer>
                            <TooltipBox
                                tooltipText="Sort Annotations"
                                placement="bottom"
                            >
                                <Icon
                                    filePath={icons.sort}
                                    onClick={() =>
                                        this.props.toggleSortMenuShown()
                                    }
                                    height="16px"
                                    width="16px"
                                    background="black"
                                    containerRef={this.sortButtonRef}
                                />
                            </TooltipBox>
                            {this.renderSortingMenuDropDown(normalizedUrl, day)}
                        </SortButtonContainer>
                    )} */}
                    {noteIds[notesType].map((noteId, index) => {
                        const zIndex = noteIds[notesType].length - index
                        return this.renderNoteResult(
                            day,
                            normalizedUrl,
                            zIndex,
                        )(noteId)
                    })}
                </NoteResultContainer>
            </PageNotesBox>
        )
    }

    private renderSortingMenuDropDown(normalizedUrl, day: number) {
        if (!this.props.isSortMenuShown) {
            return null
        }

        return (
            <PopoutBox
                closeComponent={() => this.props.toggleSortMenuShown()}
                placement="right-start"
                targetElementRef={this.sortButtonRef.current}
                getPortalRoot={this.props.getRootElement}
            >
                <SortingDropdownMenuBtn
                    onMenuItemClick={({ sortingFn }) =>
                        this.props.onPageNotesSortSelection(
                            day,
                            normalizedUrl,
                        )(sortingFn)
                    }
                />
            </PopoutBox>
        )
    }

    private renderPageResult = (
        pageId: string,
        day: number,
        index: number,
        order: number,
    ) => {
        const page = {
            ...this.props.pageData.byId[pageId],
            ...this.props.results[day].pages.byId[pageId],
        }

        const interactionProps = bindFunctionalProps<
            PageInteractionAugdProps,
            PageInteractionProps
        >(this.props.pageInteractionProps, day, pageId)

        const pickerProps = bindFunctionalProps<
            PagePickerAugdProps,
            PagePickerProps
        >(this.props.pagePickerProps, pageId)

        return (
            <ResultBox
                zIndex={
                    this.state.showPopoutsForResultBox === index
                        ? index +
                          this.props.results[day].pages.allIds.length +
                          1000
                        : index
                }
                bottom="10px"
                key={day.toString() + pageId}
                order={order}
            >
                <PageResult
                    resultsRef={this.ResultsScrollContainerRef}
                    inPageMode={this.props.inPageMode}
                    index={index}
                    activePage={this.props.activePage}
                    isSearchFilteredByList={this.props.selectedListId != null}
                    filteredbyListID={
                        this.props.listData.byId[this.props.selectedListId]
                            ?.localId
                    }
                    isNotesSidebarShown={this.props.isNotesSidebarShown}
                    isListsSidebarShown={this.props.isSpacesSidebarLocked}
                    showPopoutsForResultBox={(show) =>
                        this.setState({
                            showPopoutsForResultBox: show,
                        })
                    }
                    onMatchingTextToggleClick={
                        interactionProps.onMatchingTextToggleClick
                    }
                    selectItem={this.props.onBulkSelect}
                    shiftSelectItem={() => this.shiftSelectItems(order)}
                    isBulkSelected={this.props.selectedItems?.includes(
                        page.normalizedUrl,
                    )}
                    youtubeService={this.props.youtubeService}
                    getListDetailsById={this.props.getListDetailsById}
                    getRootElement={this.props.getRootElement}
                    {...interactionProps}
                    {...pickerProps}
                    {...page}
                    lists={this.getLocalListIdsForCacheIds(page.lists)}
                    onTagPickerBtnClick={
                        this.props.shouldShowTagsUIs
                            ? interactionProps.onTagPickerBtnClick
                            : undefined
                    }
                    filterbyList={this.props.filterByList}
                    uploadedPdfLinkLoadState={page.uploadedPdfLinkLoadState}
                    searchQuery={this.props.searchQuery}
                    renderSpacePicker={() => (
                        <CollectionPicker
                            {...this.props.spacePickerBGProps}
                            annotationsCache={this.props.annotationsCache}
                            selectEntry={(listId) =>
                                pickerProps.onListPickerUpdate({
                                    added: listId,
                                    deleted: null,
                                    selected: [],
                                })
                            }
                            unselectEntry={(listId) =>
                                pickerProps.onListPickerUpdate({
                                    added: null,
                                    deleted: listId,
                                    selected: [],
                                })
                            }
                            initialSelectedListIds={() =>
                                this.getLocalListIdsForCacheIds(page.lists)
                            }
                            closePicker={(event) => {
                                if (page.listPickerShowStatus === 'footer') {
                                    return interactionProps.onListPickerFooterBtnClick(
                                        event,
                                    )
                                }
                                return interactionProps.onListPickerBarBtnClick(
                                    event,
                                )
                            }}
                        />
                    )}
                    renderPageCitations={() => (
                        <PageCitations
                            annotationUrls={page.noteIds['user']}
                            copyPasterProps={{
                                copyPasterBG: this.props.copyPasterBG,
                                getRootElement: this.props.getRootElement,
                                onClickOutside:
                                    interactionProps.onCopyPasterBtnClick,
                            }}
                            pageLinkProps={{
                                ...this.props.spacePickerBGProps,
                                annotationsCache: this.props.annotationsCache,
                                contentSharingByTabsBG: this.props
                                    .contentSharingByTabsBG,
                                copyToClipboard: this.props.onPageLinkCopy,
                                fullPageUrl: page.fullUrl,
                                getRootElement: this.props.getRootElement,
                                showSpacesTab: this.props.showSpacesTab,
                                fromDashboard: true,
                            }}
                            getRootElement={this.props.getRootElement}
                        />
                    )}
                />
                {this.renderPageNotes(page, day, interactionProps)}
            </ResultBox>
        )
    }

    private getTutorialState = async () => {
        const tutorialStateLoaded = await browser.storage.local.get(
            '@onboarding-dashboard-tutorials',
        )
        this.setState({
            tutorialState:
                tutorialStateLoaded['@onboarding-dashboard-tutorials'],
        })
    }

    private dismissTutorials = async (type) => {
        let tutorialState = this.state.tutorialState
        tutorialState[type] = false

        this.setState({
            tutorialState: tutorialState,
        })

        await browser.storage.local.set({
            '@onboarding-dashboard-tutorials': tutorialState,
        })
    }

    private renderOnboardingTutorials() {
        let title
        let videoURL
        let readURL
        let onDismiss

        if (
            this.state.tutorialState != null &&
            this.state.tutorialState[this.props.searchType]
        ) {
            if (this.props.searchType === 'pages') {
                title =
                    'Learn the basics about saving and searching what you read online'
                videoURL =
                    'https://share.descript.com/embed/QTnFzKBo7XM?autoplay=1'
                readURL = 'https://links.memex.garden/memexbasics'
                onDismiss = () => this.dismissTutorials(this.props.searchType)
            }
            if (this.props.searchType === 'notes') {
                title =
                    'Learn the basics about adding highlights and notes to web content, PDFs and videos'
                videoURL =
                    'https://share.descript.com/embed/0HGxOo3duKu?autoplay=1'
                readURL = 'https://links.memex.garden/webhighlights'
                onDismiss = () => this.dismissTutorials(this.props.searchType)
            }
            if (this.props.searchType === 'videos') {
                title =
                    'Learn the basics about adding highlights to videos on Youtube, Vimeo and HTML5 videos'
                videoURL =
                    'https://share.descript.com/embed/4yYXrC63L95?autoplay=1'
                readURL = 'https://links.memex.garden/videoAnnotations'
                onDismiss = () => this.dismissTutorials(this.props.searchType)
            }
            if (this.props.searchType === 'twitter') {
                title =
                    'Learn the basics about saving and annotating tweets on the web and on mobile'
                videoURL =
                    'https://share.descript.com/embed/TVgEKP80LqR?autoplay=1'
                readURL = 'https://links.memex.garden/tweets'
                onDismiss = () => this.dismissTutorials(this.props.searchType)
            }
            if (this.props.searchType === 'pdf') {
                title =
                    'Learn the basics about annotating PDFs on the web and your hard drive'
                videoURL =
                    'https://share.descript.com/embed/Vl7nXyy3sLb?autoplay=1'
                readURL = 'https://links.memex.garden/PDFannotations'
                onDismiss = () => this.dismissTutorials(this.props.searchType)
            }
        }

        if (
            this.props.showMobileAppAd &&
            this.props.selectedListId === SPECIAL_LIST_NAMES.MOBILE
        ) {
            title = (
                <MobileAdContainer>
                    Save pages & create highlights and annotations on your
                    mobile devices.
                    <MobileAppAd />
                </MobileAdContainer>
            )
            videoURL = 'https://share.descript.com/embed/Vl7nXyy3sLb?autoplay=1'
            readURL = 'https://links.memex.garden/mobileApp'
            onDismiss = this.props.onDismissMobileAd
        }

        if (title != null) {
            return (
                <TutorialContainer
                    showTutorialVideo={this.state.showTutorialVideo}
                >
                    <TutorialContent
                        showTutorialVideo={this.state.showTutorialVideo}
                    >
                        <TutorialTitle>{title}</TutorialTitle>
                        <TutorialButtons>
                            <PrimaryAction
                                size="medium"
                                type="primary"
                                iconPosition="right"
                                icon="longArrowRight"
                                label="Read More"
                                onClick={() => window.open(readURL, '_blank')}
                            />

                            <PrimaryAction
                                size="medium"
                                type="tertiary"
                                label="Dismiss"
                                onClick={() => onDismiss()}
                            />
                        </TutorialButtons>
                    </TutorialContent>
                    <TutorialVideoContainer
                        showTutorialVideo={this.state.showTutorialVideo}
                    >
                        {this.state.showTutorialVideo ? (
                            <TutorialVideo
                                src={videoURL}
                                showTutorialVideo={this.state.showTutorialVideo}
                            />
                        ) : (
                            <TutorialVideoBox
                                onClick={() =>
                                    this.setState({
                                        showTutorialVideo: true,
                                    })
                                }
                                showTutorialVideo={this.state.showTutorialVideo}
                            >
                                <TutorialPlayButton>
                                    <Icon
                                        hoverOff
                                        color={'white'}
                                        filePath={'play'}
                                        heightAndWidth={'20px'}
                                    />
                                    Watch
                                </TutorialPlayButton>
                                <TutorialBlurPicture />
                            </TutorialVideoBox>
                        )}
                    </TutorialVideoContainer>
                </TutorialContainer>
            )
        } else {
            return undefined
        }
    }

    private renderNoResults() {
        if (
            this.props.searchResults.allIds.length === 0 &&
            (this.props.searchQuery.length > 0 ||
                this.props.searchFilters.tagsIncluded.length > 0 ||
                this.props.searchFilters.domainsIncluded.length > 0 ||
                this.props.searchFilters.dateTo > 0 ||
                this.props.searchFilters.dateFrom > 0)
        ) {
            return (
                <NoResultsMessage>
                    <IconBox heightAndWidth="34px" background="dark">
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="18px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    `Nothing found for "{this.props.searchQuery}"`
                </NoResultsMessage>
            )
        }

        // if the first time using Memex
        if (
            this.props.searchResults.allIds.length === 0 &&
            this.props.searchQuery.length === 0 &&
            !this.props.searchFilters.isDateFilterActive &&
            !this.props.searchFilters.isTagFilterActive &&
            !this.props.searchFilters.isDomainFilterActive
        ) {
            if (this.props.selectedListId === SPECIAL_LIST_NAMES.MOBILE) {
                return (
                    <NoResultsMessage>
                        <IconBox heightAndWidth="34px" background="dark">
                            <Icon
                                filePath={icons.phone}
                                heightAndWidth="18px"
                                color="prime1"
                                hoverOff
                            />
                        </IconBox>
                        Nothing saved yet from your mobile devices
                    </NoResultsMessage>
                )
            }

            return (
                <>
                    <NoResultsMessage>
                        <IconBox heightAndWidth="34px" background="dark">
                            <Icon
                                filePath={icons.heartEmpty}
                                heightAndWidth="18px"
                                color="prime1"
                                hoverOff
                            />
                        </IconBox>
                        Nothing saved yet
                    </NoResultsMessage>
                </>
            )
        }
    }

    shiftSelectItems = (selectedIndex) => {
        let currentIndex = selectedIndex
        const pages = Object.values(this.props.results)
        let pagesArray = Object.values(this.props.results)
        let pageId = pages[0].pages.allIds[currentIndex]
        let pageData = this.props.pageData.byId[pageId]

        while (!this.props.selectedItems.includes(pageData.normalizedUrl)) {
            if (pageData == null) {
                return
            }

            const data = {
                title: pageData.fullTitle,
                url: pageData.normalizedUrl,
                type: 'pages',
            }

            this.props.onBulkSelect(data, false)
            currentIndex = currentIndex - 1
            pageId = this.props.pageData.allIds[currentIndex]
            pageData = this.props.pageData.byId[pageId]
        }

        // while () {
        //     currentIndex = currentIndex - 1
        // }
    }

    private renderResultsByDay() {
        if (this.props.noResultsType != null) {
            return this.renderNoResults()
        }

        if (this.props.searchState === 'running') {
            return this.renderLoader()
        }

        if (
            this.props.clearInboxLoadState === 'running' &&
            this.props.selectedListId === SPECIAL_LIST_NAMES.INBOX
        ) {
            return this.renderLoader()
        }

        const days: JSX.Element[] = []
        var groupIndex = 1500

        for (const { day, pages } of Object.values(this.props.results)) {
            groupIndex = groupIndex - 1
            days.push(
                <DayResultGroup
                    zIndex={groupIndex}
                    key={day}
                    when={timestampToString(day)}
                >
                    {pages.allIds.map((id, index) =>
                        this.renderPageResult(
                            id,
                            day,
                            pages.allIds.length - index,
                            index,
                        ),
                    )}
                </DayResultGroup>,
            )
        }

        if (this.props.searchPaginationState === 'running') {
            days.push(
                <PaginationLoaderBox>
                    {this.renderLoader({ key: 'pagination-loader' })}
                </PaginationLoaderBox>,
            )
        } else if (
            !this.props.areResultsExhausted &&
            this.props.searchState !== 'pristine'
        ) {
            days.push(
                <Waypoint
                    key="pagination-waypoint"
                    onEnter={() => this.props.paginateSearch()}
                />,
            )
        }

        return days
    }

    // private renderListShareBtn() {
    //     if (this.props.selectedListId == null) {
    //         return
    //     }

    //     return (
    //         <>
    //             <TooltipBox
    //                 tooltipText="Bulk-change privacy of annotations in this Space"
    //                 placement="bottom"
    //             >
    //                 <Icon
    //                     filePath={icons.multiEdit}
    //                     height="16px"
    //                     onClick={this.props.toggleListShareMenu}
    //                 />
    //             </TooltipBox>
    //             {this.props.isListShareMenuShown && (
    //                 <HoverBox
    //                     width="340px"
    //                     top="20px"
    //                     right="-90px"
    //                     withRelativeContainer
    //                     position="absolute"
    //                 >
    //                     <ListShareMenu
    //                         openListShareModal={this.props.openListShareModal}
    //                         copyLink={this.props.onListLinkCopy}
    //                         listId={this.props.selectedListId}
    //                         shareImmediately={false}
    //                         postBulkShareHook={(shareState) =>
    //                             this.props.updateAllResultNotesShareInfo(
    //                                 shareState,
    //                             )
    //                         }
    //                     />
    //                 </HoverBox>
    //             )}
    //         </>
    //     )
    // }

    private firstTimeUser() {
        if (
            this.props.searchResults.allIds.length === 0 &&
            this.props.searchQuery.length === 0 &&
            !this.props.searchFilters.isDateFilterActive &&
            !this.props.searchFilters.isTagFilterActive &&
            !this.props.searchFilters.isDomainFilterActive
        ) {
            return true
        } else {
            return false
        }
    }

    render() {
        return (
            <ResultsContainer>
                <ResultsBox>
                    {this.props.selectedListId != null && (
                        <ListDetails
                            {...this.props.listDetailsProps}
                            clearInbox={this.props.clearInbox}
                        />
                    )}
                    <ReferencesContainer>
                        {this.props.listData[this.props.selectedListId]
                            ?.remoteId != null && (
                            <>
                                <Icon
                                    hoverOff
                                    heightAndWidth="12px"
                                    color={'greyScale6'}
                                    icon={'warning'}
                                />
                                <InfoText>
                                    Only your own contributions to this space
                                    are visible locally.
                                </InfoText>
                            </>
                        )}
                    </ReferencesContainer>
                    <PageTopBarBox isDisplayed={this.props.isDisplayed}>
                        <TopBar
                            leftSide={
                                <ContentTypeSwitchContainer id="ContentTypeSwitchContainer">
                                    <SearchTypeSwitchContainer>
                                        {this.state
                                            .showHorizontalScrollSwitch ===
                                            'left' ||
                                        this.state
                                            .showHorizontalScrollSwitch ===
                                            'both' ? (
                                            <IconContainerLeft>
                                                <Icon
                                                    filePath="arrowLeft"
                                                    heightAndWidth="22px"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                'SearchTypeSwitchContainer',
                                                            )
                                                            .scrollBy({
                                                                left: -200,
                                                                top: 0,
                                                                behavior:
                                                                    'smooth',
                                                            })
                                                    }
                                                />
                                            </IconContainerLeft>
                                        ) : undefined}
                                        <SearchTypeSwitch {...this.props} />
                                        {this.state
                                            .showHorizontalScrollSwitch ===
                                            'right' ||
                                        this.state
                                            .showHorizontalScrollSwitch ===
                                            'both' ? (
                                            <IconContainerRight>
                                                <Icon
                                                    filePath="arrowRight"
                                                    heightAndWidth="22px"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                'SearchTypeSwitchContainer',
                                                            )
                                                            .scrollBy({
                                                                left: 200,
                                                                top: 0,
                                                                behavior:
                                                                    'smooth',
                                                            })
                                                    }
                                                />
                                            </IconContainerRight>
                                        ) : undefined}
                                    </SearchTypeSwitchContainer>
                                </ContentTypeSwitchContainer>
                            }
                            rightSide={undefined}
                        />
                    </PageTopBarBox>
                    <ResultsScrollContainer
                        id="ResultsScrollContainer"
                        ref={this.ResultsScrollContainerRef}
                    >
                        {this.renderOnboardingTutorials()}
                        {this.renderResultsByDay()}
                        {this.props.areResultsExhausted &&
                            this.props.searchState === 'success' &&
                            this.props.clearInboxLoadState !== 'running' &&
                            this.props.searchResults.allIds.length > 0 && (
                                <ResultsExhaustedMessage>
                                    <Icon
                                        filePath="checkRound"
                                        heightAndWidth="22px"
                                        hoverOff
                                        color={'greyScale4'}
                                    />
                                    End of results
                                </ResultsExhaustedMessage>
                            )}
                    </ResultsScrollContainer>
                </ResultsBox>
            </ResultsContainer>
        )
    }
}

const ResultsScrollContainer = styled.div`
    overflow-y: scroll;
    overflow-x: hidden;
    height: fill-available;
    width: fill-available;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2px;
    padding-bottom: 100px;
    justify-content: flex-start;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
    min-height: 10%;
    flex: 1;
`

const NoteResultContainer = styled.div`
    display: flex;
    position: relative;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: fill-available;
    grid-gap: 10px;
`

const PaginationLoaderBox = styled.div`
    margin-top: -30px;
`

const IconContainerRight = styled.div`
    position: absolute;
    right: 5px;
    top: 4px;
    border-radius: 5px;

    background: ${(props) => props.theme.colors.black}70;
    z-index: 20;
    backdrop-filter: blur(4px);
`
const IconContainerLeft = styled.div`
    position: absolute;
    left: 5px;
    top: 4px;
    border-radius: 5px;

    background: ${(props) => props.theme.colors.black}70;
    z-index: 20;
    backdrop-filter: blur(4px);
`

const SearchTypeSwitchContainer = styled.div`
    display: flex;
    grid-gap: 3px;
    position: relative;
    width: fill-available;
    padding-right: 30px;
`

const MobileAdContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const TutorialVideo = styled.iframe<{ showTutorialVideo: boolean }>`
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    border: none;
    border-radius: 5px;
`

const TutorialContainer = styled.div<{ showTutorialVideo: boolean }>`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    grid-gap: 40px;
    padding: 26px 34px;
    background-color: ${(props) => props.theme.colors.greyScale1};
    border-radius: 8px;
    margin-top: 20px;
    margin-bottom: 40px;
    width: fill-available;
    max-width: calc(${sizeConstants.searchResults.widthPx}px - 70px);

    ${(props) =>
        props.showTutorialVideo &&
        css`
            flex-direction: column-reverse;
            grid-gap: 20px;
        `}
`

const TutorialContent = styled.div<{ showTutorialVideo: boolean }>`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    height: fill-available;
    justify-content: space-between;
    height: 170px;

    ${(props) =>
        props.showTutorialVideo &&
        css`
            height: 120px;
        `}
`

const TutorialTitle = styled.div`
    font-size: 20px;
    font-weight: 500;
    background: ${(props) => props.theme.colors.headerGradient};
    line-height: 30px;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    // @ts-ignore
`

const TutorialButtons = styled.div`
    display: flex;
    grid-gap: 5px;
`

const TutorialVideoContainer = styled.div<{ showTutorialVideo: boolean }>`
    position: relative;
    height: 170px;
    max-width: 300px;
    width: 100%;
    min-width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;

    ${(props) =>
        props.showTutorialVideo &&
        css`
            height: 0px;
            padding-top: 56.25%;
            width: fill-available;
            max-width: fill-available;
        `}
`

const TutorialVideoBox = styled.div<{ showTutorialVideo: boolean }>`
    position: relative;
    height: 170px;
    max-width: 300px;
    width: fill-available;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        opacity: 0.8;
    }

    ${(props) =>
        props.showTutorialVideo &&
        css`
            width: fill-available;
            height: unset;
        `}
`

const TutorialBlurPicture = styled.div`
    position: absolute;
    top: 0px;
    left: 0px;
    background-image: url('/img/tutorialBlur.png');
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 5px;
    height: 170px;
    max-width: 300px;
    width: fill-available;
    background-size: cover;
`

const TutorialPlayButton = styled.div`
    height: 40px;
    width: fit-content;
    padding: 0 15px;
    background-color: ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.white};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
    z-index: 1;
    font-size: 14px;
    grid-gap: 5px;
`

const ResultsExhaustedMessage = styled.div`
    display: flex;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale4};
    padding: 10px;
    white-space: nowrap;
    width: fill-available;
    justify-content: center;
    font-size: 16px;
    align-items: center;
    max-width: ${sizeConstants.searchResults.widthPx}px;
`
const NoResultsMessage = styled.div`
    display: flex;
    grid-gap: 10px;
    color: ${(props) => props.theme.colors.greyScale4};
    padding: 30px;
    white-space: nowrap;
    width: fill-available;
    justify-content: center;
    font-size: 18px;
    align-items: center;
`

const ContentTypeSwitchContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 10px;
    width: fill-available;
    padding: 10px;

    /* overflow-x: scroll;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none; */
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.darkText};
    font-size: 14px;
    font-weight: 300;
`

const PageTopBarBox = styled.div<{
    isDisplayed: boolean
    inPageMode?: boolean
}>`
    /* padding: 0px 15px; */
    height: fit-content;
    max-width: calc(${sizeConstants.searchResults.widthPx}px + 20px);
    z-index: 3000;
    position: sticky;
    top: 0px;
    margin-top: -1px;
    width: fill-available;
    width: -moz-available;

    ${(props) =>
        props.inPageMode &&
        css`
            position: relative;
        `}
`

const ReferencesContainer = styled.div`
    width: 100%;
    font-weight: lighter;
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale4};
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 5px;
    max-width: ${sizeConstants.searchResults.widthPx}px;
`

const NoteTopBarBox = styled(TopBar)`
    width: 100%;
    display: flex;
`

const openAnimation = keyframes`
 0% { margin-top: 30px; opacity: 0 }
 100% { margin-top: 0px; opacity: 1 }
`

const ResultBox = styled(Margin)<{ zIndex: number; order }>`
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    z-index: ${(props) => props.zIndex};
    animation-name: ${openAnimation};
    animation-delay: ${(props) => props.order * 30}ms;
    animation-duration: 0.4s;
    animation-timing-function: cubic-bezier(0.16, 0.67, 0.41, 0.83);
    animation-fill-mode: backwards;
`

const PageNotesBox = styled(Margin)`
    flex-direction: column;
    justify-content: space-between;
    width: fill-available;
    padding-left: 10px;
    padding-top: 5px;
    border-left: 4px solid ${(props) => props.theme.colors.greyScale3};
    z-index: 4;
    position: relative;
    align-items: flex-start;
`

const PageNotesContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: fill-available;
    /* padding: 10px; */
    outline: 1px solid ${(props) => props.theme.colors.greyScale4}80;
    border-radius: 8px;
    margin-bottom: 10px;
    margin-top: 5px;
`

const Loader = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
`

const ResultsBox = styled.div`
    display: flex;
    margin-top: 2px;
    flex-direction: column;
    width: fill-available;
    height: fill-available;
    grid-gap: 1px;
    overflow: hidden;
    align-items: center;
`

const ResultsContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-self: center;
    width: fill-available;
    padding: 0 24px;
    z-index: 27;
    min-height: 60%;
    flex: 1;
    height: fill-available;
    height: -moz-available;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
