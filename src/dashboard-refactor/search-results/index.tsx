import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Waypoint from 'react-waypoint'

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
} from './components/search-type-switch'
import SearchCopyPaster, {
    Props as SearchCopyPasterProps,
} from './components/search-copy-paster'
import ExpandAllNotes from './components/expand-all-notes'
import DayResultGroup from './components/day-result-group'
import PageResult from './components/page-result'
import NoResults from './components/no-results'
import { bindFunctionalProps, formatDayGroupTime } from './util'
import NotesTypeDropdownMenu from './components/notes-type-dropdown-menu'
import { SortingDropdownMenuBtn } from 'src/sidebar/annotations-sidebar/components/SortingDropdownMenu'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import {
    AnnotationCreate,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import { sizeConstants } from '../constants'
import AnnotationEditable from 'src/annotations/components/HoverControlledAnnotationEditable'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { PageNotesCopyPaster } from 'src/copy-paster'
import TagPicker from 'src/tags/ui/TagPicker'
import SingleNoteShareMenu from 'src/overview/sharing/SingleNoteShareMenu'
import Margin from 'src/dashboard-refactor/components/Margin'
import DismissibleResultsMessage from './components/dismissible-results-message'
import MobileAppAd from 'src/sync/components/device-list/mobile-app-ad'
import OnboardingMsg from './components/onboarding-msg'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import * as icons from 'src/common-ui/components/design-library/icons'
import ListDetails, {
    Props as ListDetailsProps,
} from './components/list-details'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import ListShareMenu from 'src/overview/sharing/ListShareMenu'
import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'
import CloudUpgradeBanner from 'src/personal-cloud/ui/components/cloud-upgrade-banner'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import { AnnotationSharingStates } from 'src/content-sharing/background/types'
import type { ListDetailsGetter } from 'src/annotations/types'

const timestampToString = (timestamp: number) =>
    timestamp === -1 ? undefined : formatDayGroupTime(timestamp)

export type Props = RootState &
    Pick<
        SearchTypeSwitchProps,
        'onNotesSearchSwitch' | 'onPagesSearchSwitch'
    > & {
        searchFilters?: any
        searchResults?: any
        searchQuery?: string
        listData: ListSidebarState['listData']
        goToImportRoute: () => void
        toggleListShareMenu: () => void
        selectedListId?: number
        areAllNotesShown: boolean
        toggleSortMenuShown: () => void
        pageInteractionProps: PageInteractionAugdProps
        noteInteractionProps: NoteInteractionAugdProps
        searchCopyPasterProps: SearchCopyPasterProps
        listDetailsProps: ListDetailsProps
        pagePickerProps: PagePickerAugdProps
        onShowAllNotesClick: React.MouseEventHandler
        noResultsType: NoResultsType
        onDismissMobileAd: React.MouseEventHandler
        onDismissOnboardingMsg: React.MouseEventHandler
        showCloudOnboardingModal: React.MouseEventHandler
        onDismissSubscriptionBanner: React.MouseEventHandler
        isDisplayed: boolean
        filterSearchByTag: (tag: string) => void
        openListShareModal: () => void
        newNoteInteractionProps: {
            [Key in keyof AnnotationCreateEventProps]: (
                day: number,
                pageId: string,
            ) => AnnotationCreateEventProps[Key]
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
        onPageLinkCopy(link: string): Promise<void>
        onNoteLinkCopy(link: string): Promise<void>
        onListLinkCopy(link: string): Promise<void>
        // updateAllResultNotesShareInfo: (info: NoteShareInfo) => void
        updateAllResultNotesShareInfo: (state: AnnotationSharingStates) => void
    }

export default class SearchResultsContainer extends PureComponent<Props> {
    private renderLoader = (props: { key?: string } = {}) => (
        <Loader {...props}>
            <LoadingIndicator />
        </Loader>
    )

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

        const listsToDisplay = noteData.isShared
            ? [
                  ...new Set([
                      ...pageData.lists.filter(
                          (listId) =>
                              this.props.listData[listId]?.remoteId != null,
                      ),
                      ...noteData.lists,
                  ]),
              ]
            : noteData.lists

        return (
            <AnnotationEditable
                zIndex={zIndex}
                key={noteId}
                url={noteId}
                tags={noteData.tags}
                lists={listsToDisplay}
                body={noteData.highlight}
                comment={noteData.comment}
                isShared={noteData.isShared}
                getListDetailsById={this.props.getListDetailsById}
                isBulkShareProtected={noteData.isBulkShareProtected}
                createdWhen={new Date(noteData.displayTime)}
                onTagClick={this.props.filterSearchByTag}
                onGoToAnnotation={interactionProps.onGoToHighlightClick}
                contextLocation={'dashboard'}
                lastEdited={
                    noteData.isEdited
                        ? new Date(noteData.displayTime)
                        : undefined
                }
                mode={noteData.isEditing ? 'edit' : 'default'}
                renderCopyPasterForAnnotation={() =>
                    noteData.isCopyPasterShown && (
                        <HoverBox
                            padding={'0px'}
                            right="0"
                            withRelativeContainer
                        >
                            <PageNotesCopyPaster
                                annotationUrls={[noteId]}
                                normalizedPageUrls={[pageId]}
                                onClickOutside={
                                    interactionProps.onCopyPasterBtnClick
                                }
                            />
                        </HoverBox>
                    )
                }
                renderTagsPickerForAnnotation={
                    this.props.shouldShowTagsUIs
                        ? () =>
                              noteData.isTagPickerShown && (
                                  <HoverBox
                                      left="0"
                                      top="-40px"
                                      withRelativeContainer
                                  >
                                      <TagPicker
                                          initialSelectedEntries={() =>
                                              noteData.tags
                                          }
                                          onClickOutside={
                                              interactionProps.onTagPickerBtnClick
                                          }
                                          onUpdateEntrySelection={
                                              interactionProps.updateTags
                                          }
                                      />
                                  </HoverBox>
                              )
                        : undefined
                }
                renderListsPickerForAnnotation={() =>
                    noteData.isListPickerShown && (
                        <HoverBox withRelativeContainer>
                            <CollectionPicker
                                initialSelectedEntries={() => listsToDisplay}
                                onClickOutside={
                                    interactionProps.onListPickerBtnClick
                                }
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
                                createNewEntry={interactionProps.createNewList}
                            />
                        </HoverBox>
                    )
                }
                renderShareMenuForAnnotation={() =>
                    noteData.shareMenuShowStatus !== 'hide' && (
                        <HoverBox
                            padding={'0px'}
                            width="350px"
                            right="0"
                            withRelativeContainer
                        >
                            <SingleNoteShareMenu
                                listData={this.props.listData}
                                isShared={noteData.isShared}
                                shareImmediately={
                                    noteData.shareMenuShowStatus ===
                                    'show-n-share'
                                }
                                annotationUrl={noteId}
                                copyLink={this.props.onNoteLinkCopy}
                                closeShareMenu={
                                    interactionProps.onShareBtnClick
                                }
                                postShareHook={interactionProps.updateShareInfo}
                                spacePickerProps={{
                                    initialSelectedEntries: () =>
                                        listsToDisplay,
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
                                    createNewEntry:
                                        interactionProps.createNewList,
                                }}
                            />
                        </HoverBox>
                    )
                }
                annotationEditDependencies={{
                    comment: noteData.editNoteForm.inputValue,
                    onCommentChange: (value) =>
                        interactionProps.onCommentChange({
                            target: { value },
                        } as any),
                    onEditCancel: () =>
                        interactionProps.onEditCancel(dummyEvent),
                    onEditConfirm: interactionProps.onEditConfirm,
                }}
                annotationFooterDependencies={{
                    onDeleteCancel: () => undefined,
                    onDeleteConfirm: () => undefined,
                    onTagIconClick: interactionProps.onTagPickerBtnClick,
                    onListIconClick: interactionProps.onListPickerBtnClick,
                    onDeleteIconClick: interactionProps.onTrashBtnClick,
                    onCopyPasterBtnClick: interactionProps.onCopyPasterBtnClick,
                    onEditIconClick: interactionProps.onEditBtnClick,
                    onShareClick: interactionProps.onShareBtnClick,
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
            AnnotationCreateEventProps
        >(newNoteInteractionProps, day, normalizedUrl)

        return (
            <PageNotesBox bottom="10px" left="10px">
                <AnnotationCreate
                    autoFocus={false}
                    comment={newNoteForm.inputValue}
                    tags={newNoteForm.tags}
                    lists={newNoteForm.lists}
                    getListDetailsById={this.props.getListDetailsById}
                    {...boundAnnotCreateProps}
                    contextLocation={'dashboard'}
                />
                {noteIds[notesType].length > 0 && (
                    <>
                        <Margin top="3px" />
                        <NoteTopBarBox
                            leftSide={
                                <TopBarRightSideWrapper>
                                    <ButtonTooltip
                                        tooltipText="Sort Annotations"
                                        position="bottom"
                                    >
                                        <Icon
                                            filePath={icons.sort}
                                            onClick={() =>
                                                this.props.toggleSortMenuShown()
                                            }
                                            height="18px"
                                            width="20px"
                                        />
                                    </ButtonTooltip>
                                    {this.renderSortingMenuDropDown(
                                        normalizedUrl,
                                        day,
                                    )}
                                </TopBarRightSideWrapper>
                            }
                        />
                        <Separator />
                    </>
                )}
                {noteIds[notesType].map((noteId, index) => {
                    const zIndex = noteIds[notesType].length - index
                    return this.renderNoteResult(
                        day,
                        normalizedUrl,
                        zIndex,
                    )(noteId)
                })}
            </PageNotesBox>
        )
    }

    private renderSortingMenuDropDown(normalizedUrl, day: number) {
        if (!this.props.isSortMenuShown) {
            return null
        }

        return (
            <HoverBox
                withRelativeContainer
                left={'-30px'}
                padding={'0px'}
                top={'20px'}
            >
                <SortingDropdownMenuBtn
                    onMenuItemClick={({ sortingFn }) =>
                        this.props.onPageNotesSortSelection(
                            day,
                            normalizedUrl,
                        )(sortingFn)
                    }
                    onClickOutSide={() => this.props.toggleSortMenuShown()}
                />
            </HoverBox>
        )
    }

    private renderPageResult = (pageId: string, day: number, index: number) => {
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
                zIndex={index}
                bottom="10px"
                key={day.toString() + pageId}
            >
                <PageResult
                    isSearchFilteredByList={this.props.selectedListId != null}
                    filteredbyListID={this.props.selectedListId}
                    getListDetailsById={this.props.getListDetailsById}
                    onTagClick={this.props.filterSearchByTag}
                    shareMenuProps={{
                        normalizedPageUrl: page.normalizedUrl,
                        closeShareMenu: interactionProps.onShareBtnClick,
                        copyLink: this.props.onPageLinkCopy,
                        postBulkShareHook: (shareInfo) =>
                            interactionProps.updatePageNotesShareInfo(
                                shareInfo,
                            ),
                    }}
                    {...interactionProps}
                    {...pickerProps}
                    {...page}
                    onTagPickerBtnClick={
                        this.props.shouldShowTagsUIs
                            ? interactionProps.onTagPickerBtnClick
                            : undefined
                    }
                />
                {this.renderPageNotes(page, day, interactionProps)}
            </ResultBox>
        )
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
                <ResultsMessage>
                    <SectionCircle>
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <NoResults title="Nothing found for this query" />
                </ResultsMessage>
            )
        }

        if (
            this.props.searchResults.allIds.length === 0 &&
            this.props.searchQuery.length === 0 &&
            !this.props.searchFilters.isDateFilterActive &&
            !this.props.searchFilters.isTagFilterActive &&
            !this.props.searchFilters.isDomainFilterActive
        ) {
            if (this.props.noResultsType === 'mobile-list-ad') {
                return (
                    <ResultsMessage>
                        <SectionCircle>
                            <Icon
                                filePath={icons.phone}
                                heightAndWidth="24px"
                                color="purple"
                                hoverOff
                            />
                        </SectionCircle>
                        <NoResults title="Save & annotate from your mobile devices">
                            <DismissibleResultsMessage
                                onDismiss={this.props.onDismissMobileAd}
                            >
                                <MobileAppAd />
                            </DismissibleResultsMessage>
                        </NoResults>
                    </ResultsMessage>
                )
            }

            if (this.props.searchType === 'notes') {
                return (
                    <ResultsMessage>
                        <SectionCircle>
                            <Icon
                                filePath={icons.highlighterEmpty}
                                heightAndWidth="24px"
                                color="purple"
                                hoverOff
                            />
                        </SectionCircle>
                        <NoResults
                            title={
                                <span>
                                    Make your first highlight or annotation
                                </span>
                            }
                        />
                    </ResultsMessage>
                )
            } else {
                return (
                    <ResultsMessage>
                        <SectionCircle>
                            <Icon
                                filePath={icons.heartEmpty}
                                heightAndWidth="24px"
                                color="purple"
                                hoverOff
                            />
                        </SectionCircle>
                        <NoResults
                            title={
                                <span>
                                    Save your first website or{' '}
                                    <ImportInfo
                                        onClick={() =>
                                            (window.location.hash = '#/import')
                                        }
                                    >
                                        import your bookmarks.
                                    </ImportInfo>
                                </span>
                            }
                        ></NoResults>
                    </ResultsMessage>
                )
            }
        }

        if (
            this.props.noResultsType === 'mobile-list' &&
            this.props.searchQuery.length === 0
        ) {
            return (
                <ResultsMessage>
                    <SectionCircle>
                        <Icon
                            filePath={icons.phone}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <NoResults title="Save & annotate from your mobile devices"></NoResults>
                </ResultsMessage>
            )
        }

        if (this.props.noResultsType === 'mobile-list-ad') {
            return (
                <ResultsMessage>
                    <SectionCircle>
                        <Icon
                            filePath={icons.phone}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <NoResults title="Save & annotate from your mobile devices">
                        <DismissibleResultsMessage
                            onDismiss={this.props.onDismissMobileAd}
                        >
                            <MobileAppAd />
                        </DismissibleResultsMessage>
                    </NoResults>
                </ResultsMessage>
            )
        }

        if (this.props.noResultsType === 'stop-words') {
            return (
                <ResultsMessage>
                    <SectionCircle>
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="24px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <NoResults title="No Results">
                        Search terms are too common <br />
                        or have been filtered out to increase performance.
                    </NoResults>
                </ResultsMessage>
            )
        }
    }

    private renderResultsByDay() {
        if (this.props.noResultsType != null) {
            return this.renderNoResults()
        }

        if (this.props.searchState === 'running') {
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
                        ),
                    )}
                </DayResultGroup>,
            )
        }

        if (this.props.searchPaginationState === 'running') {
            days.push(this.renderLoader({ key: 'pagination-loader' }))
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

    private renderListShareBtn() {
        if (this.props.selectedListId == null) {
            return
        }

        return (
            <>
                <ButtonTooltip
                    tooltipText="Bulk-change privacy of annotations in this Space"
                    position="bottom"
                >
                    <Icon
                        filePath={icons.multiEdit}
                        height="16px"
                        onClick={this.props.toggleListShareMenu}
                    />
                </ButtonTooltip>
                {this.props.isListShareMenuShown && (
                    <HoverBox
                        width="340px"
                        top="20px"
                        right="-90px"
                        withRelativeContainer
                        position="absolute"
                        padding={'0px'}
                    >
                        <ListShareMenu
                            openListShareModal={this.props.openListShareModal}
                            copyLink={this.props.onListLinkCopy}
                            closeShareMenu={this.props.toggleListShareMenu}
                            listId={this.props.selectedListId}
                            shareImmediately={false}
                            postBulkShareHook={(shareState) =>
                                this.props.updateAllResultNotesShareInfo(
                                    shareState,
                                )
                            }
                        />
                    </HoverBox>
                )}
            </>
        )
    }

    render() {
        return (
            <ResultsContainer bottom="100px">
                {this.props.isCloudUpgradeBannerShown && (
                    <CloudUpgradeBanner
                        onGetStartedClick={this.props.showCloudOnboardingModal}
                        width="fill-available"
                    />
                )}
                {this.props.isSubscriptionBannerShown && (
                    <PioneerPlanBanner
                        onHideClick={this.props.onDismissSubscriptionBanner}
                        width="fill-available"
                    />
                )}
                {this.props.selectedListId != null && (
                    <ListDetails {...this.props.listDetailsProps} />
                )}
                <PageTopBarBox
                    isDisplayed={this.props.isDisplayed}
                    bottom="5px"
                >
                    <TopBar
                        leftSide={<SearchTypeSwitch {...this.props} />}
                        rightSide={
                            <RightSideButton>
                                {this.renderListShareBtn()}
                                <SearchCopyPaster
                                    {...this.props.searchCopyPasterProps}
                                />
                                <ExpandAllNotes
                                    isEnabled={this.props.areAllNotesShown}
                                    onClick={this.props.onShowAllNotesClick}
                                />
                            </RightSideButton>
                        }
                    />
                </PageTopBarBox>
                {this.renderResultsByDay()}
            </ResultsContainer>
        )
    }
}

const ResultsMessage = styled.div`
    padding-top: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`

const PageTopBarBox = styled(Margin)<{ isDisplayed: boolean }>`
    width: 96%;
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
    padding: 0px 15px;
    height: 40px;
    max-width: calc(${sizeConstants.searchResults.widthPx}px + 30px);
    z-index: 2147483639;
    margin-top: -6px;
    position: sticky;
    top: ${(props) => (props.isDisplayed === true ? '110px' : '60px')};
    background: ${(props) => props.theme.colors.backgroundColor};
`

const IconBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    padding: 4px;

    &:hover {
        background-color: ${(props) => props.theme.colors.grey};
    }
`

const RightSideButton = styled.div`
    display: flex;
    align-items: center;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
`

const NoteTopBarBox = styled(TopBar)`
    width: 100%;
    display: flex;
`

const ResultBox = styled(Margin)<{ zIndex: number }>`
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
    z-index: ${(props) => props.zIndex};
`

const PageNotesBox = styled(Margin)`
    flex-direction: column;
    justify-content: space-between;
    width: fill-available;
    padding-left: 10px;
    padding-top: 5px;
    border-left: 4px solid ${(props) => props.theme.colors.lineGrey};
    z-index: 4;
`

const Separator = styled.div`
    width: 100%;
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
    margin-bottom: -2px;
`

const Loader = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
`

const ResultsContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    align-self: center;
    max-width: ${sizeConstants.searchResults.widthPx}px;
    margin-bottom: 100px;
    width: fill-available;
`

const TopBarRightSideWrapper = styled.div`
    display: flex;
    flex-direction: row;
`

const ShareBtn = styled.button`
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    border-radius: 3px;

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const IconImg = styled.img`
    height: 18px;
    width: 18px;
`
const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 60px;
    width: 60px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ImportInfo = styled.span`
    color: ${(props) => props.theme.colors.purple};
    margin-bottom: 40px;
    font-weight: 500;
    cursor: pointer;
`
