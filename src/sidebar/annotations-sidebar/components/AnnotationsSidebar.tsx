import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css } from 'styled-components'
import onClickOutside from 'react-onclickoutside'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ConversationReplies } from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import type {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { NewReplyEventHandlers } from '@worldbrain/memex-common/lib/content-conversations/ui/components/new-reply'
import { ButtonTooltip } from 'src/common-ui/components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import AnnotationCreate, {
    Props as AnnotationCreateProps,
} from 'src/annotations/components/AnnotationCreate'
import AnnotationEditable, {
    Props as AnnotationEditableProps,
} from 'src/annotations/components/HoverControlledAnnotationEditable'
import type _AnnotationEditable from 'src/annotations/components/AnnotationEditable'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Flex } from 'src/common-ui/components/design-library/Flex'
import type { Annotation, ListDetailsGetter } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import type { AnnotationMode, SidebarTheme } from '../types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type { SidebarContainerState } from '../containers/types'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import Margin from 'src/dashboard-refactor/components/Margin'
import { SortingDropdownMenuBtn } from '../components/SortingDropdownMenu'
import * as icons from 'src/common-ui/components/design-library/icons'
import AllNotesShareMenu from 'src/overview/sharing/AllNotesShareMenu'
import { PageNotesCopyPaster } from 'src/copy-paster'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { ClickAway } from 'src/util/click-away-wrapper'
import type { AnnotationSharingStates } from 'src/content-sharing/background/types'
import { getLocalStorage } from 'src/util/storage'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { NewHoverBox } from '@worldbrain/memex-common/lib/common-ui/components/hover-box'
import FeedPanel from 'src/in-page-ui/ribbon/react/components/feed-panel'

const SHOW_ISOLATED_VIEW_KEY = `show-isolated-view-notif`
export interface AnnotationsSidebarProps
    extends Omit<SidebarContainerState, 'annotationModes'> {
    annotationModes: { [url: string]: AnnotationMode }
    // sidebarActions: () => void

    setActiveAnnotationUrl?: (url: string) => React.MouseEventHandler
    getListDetailsById: ListDetailsGetter

    bindSharedAnnotationEventHandlers: (
        sharedAnnotationReference: SharedAnnotationReference,
        sharedListReference: SharedListReference,
    ) => {
        onReplyBtnClick: React.MouseEventHandler
    } & NewReplyEventHandlers

    handleScrollPagination: () => void
    needsWaypoint?: boolean
    appendLoader?: boolean

    renderCopyPasterForAnnotation: (
        followedListId?: string,
    ) => (id: string) => JSX.Element
    renderTagsPickerForAnnotation: (id: string) => JSX.Element
    renderShareMenuForAnnotation: (
        followedListId?: string,
    ) => (id: string) => JSX.Element
    renderListsPickerForAnnotation: (
        followedListId?: string,
    ) => (id: string) => JSX.Element

    expandFeed: () => void
    expandMyNotes: () => void
    expandSharedSpaces: (listIds: string[]) => void
    expandFollowedListNotes: (listId: string) => void
    toggleIsolatedListView: (listId: string) => void

    onClickOutside: React.MouseEventHandler
    bindAnnotationFooterEventProps: (
        annotation: Pick<Annotation, 'url' | 'body'>,
        followedListId?: string,
    ) => AnnotationFooterEventProps & {
        onGoToAnnotation?: React.MouseEventHandler
    }
    bindAnnotationEditProps: (
        annotation: Pick<Annotation, 'url' | 'isShared'>,
        followedListId?: string,
    ) => AnnotationEditGeneralProps & AnnotationEditEventProps
    annotationCreateProps: AnnotationCreateProps

    sharingAccess: AnnotationSharingAccess
    isSearchLoading: boolean
    isAnnotationCreateShown: boolean
    annotations: Annotation[]
    theme: Partial<SidebarTheme>
    openCollectionPage: (remoteListId: string) => void
    onShareAllNotesClick: () => void
    onCopyBtnClick: () => void
    onMenuItemClick: (sortingFn) => void
    copyPaster: any
    onClickOutsideCopyPaster: () => void
    normalizedPageUrls: string[]
    normalizedPageUrl?: string
    annotationUrls: () => void
    contentSharing: ContentSharingInterface
    annotationsShareAll: any
    copyPageLink: any
    postBulkShareHook: (shareState: AnnotationSharingStates) => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'
    //postShareHook: (shareInfo) => void
}

interface AnnotationsSidebarState {
    searchText: string
    isolatedView?: string | null // if null show default view
    showIsolatedViewNotif: boolean // if null show default view
    isMarkdownHelpShown: boolean
    showAllNotesCopyPaster: boolean
    showAllNotesShareMenu: boolean
    showPageSpacePicker: boolean
    showSortDropDown: boolean
    isFeedShown: boolean
}

export class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps,
    AnnotationsSidebarState
> {
    private annotationCreateRef = React.createRef() // TODO: Figure out how to properly type refs to onClickOutside HOCs
    private annotationEditRefs: {
        [annotationUrl: string]: React.RefObject<_AnnotationEditable>
    } = {}
    private sortDropDownButtonRef = React.createRef<HTMLDivElement>()
    private copyButtonRef = React.createRef<HTMLDivElement>()
    private bulkEditButtonRef = React.createRef<HTMLDivElement>()

    state: AnnotationsSidebarState = {
        searchText: '',
        showIsolatedViewNotif: false,
        isMarkdownHelpShown: false,
        showAllNotesCopyPaster: false,
        showAllNotesShareMenu: false,
        showPageSpacePicker: false,
        showSortDropDown: false,
        isFeedShown: false,
    }

    async componentDidMount() {
        document.addEventListener('keydown', this.onKeydown, false)
        //setLocalStorage(SHOW_ISOLATED_VIEW_KEY, true)
        const isolatedViewNotifVisible = await getLocalStorage(
            SHOW_ISOLATED_VIEW_KEY,
        )

        this.setState({
            showIsolatedViewNotif: isolatedViewNotifVisible,
        })
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeydown, false)
    }

    focusCreateForm = () => (this.annotationCreateRef?.current as any).focus()
    focusEditNoteForm = (annotationId: string) =>
        (this.annotationEditRefs[annotationId]?.current).focusEditForm()

    private onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.props.onClickOutside(e as any)
        }
    }

    private searchEnterHandler = {
        test: (e) => e.key === 'Enter',
        handle: () => undefined,
    }

    private handleSearchChange = (searchText) => {
        this.setState({ searchText })
    }

    private handleSearchClear = () => {
        this.setState({ searchText: '' })
    }

    // NOTE: Currently not used
    private renderSearchSection() {
        return (
            <TopSectionStyled>
                <TopBarStyled>
                    <Flex>
                        <ButtonStyled>
                            {' '}
                            <SearchIcon />{' '}
                        </ButtonStyled>
                        <SearchInputStyled
                            type="input"
                            name="query"
                            autoComplete="off"
                            placeholder="Search Annotations"
                            onChange={this.handleSearchChange}
                            defaultValue={this.state.searchText}
                            specialHandlers={[this.searchEnterHandler]}
                        />
                        {this.state.searchText !== '' && (
                            <CloseButtonStyled onClick={this.handleSearchClear}>
                                <CloseIconStyled />
                                Clear search
                            </CloseButtonStyled>
                        )}
                    </Flex>
                </TopBarStyled>
            </TopSectionStyled>
        )
    }

    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.onClickOutside) {
            return this.props.onClickOutside(e)
        }
    }
    private getListsForAnnotationCreate = (
        followedLists,
        isolatedView: string,
        annotationCreateLists: string[],
    ) => {
        // returns lists for AnnotationCreate including isolated view if enabled
        if (isolatedView) {
            const isolatedList = followedLists.byId[isolatedView]
            if (
                isolatedList.isContributable &&
                !annotationCreateLists.includes(isolatedList.name)
            ) {
                const listsToCreate = [
                    ...annotationCreateLists,
                    isolatedList.name,
                ]

                return listsToCreate
            }
        }
        return annotationCreateLists
    }

    private renderCopyPasterManager(annotationUrls) {
        return (
            <PageNotesCopyPaster
                copyPaster={this.props.copyPaster}
                annotationUrls={annotationUrls}
                normalizedPageUrls={this.props.normalizedPageUrls}
                onClickOutside={() =>
                    this.setState({ showAllNotesCopyPaster: false })
                }
            />
        )
    }

    private renderAllNotesCopyPaster() {
        const annotUrls = this.props.annotationUrls()
        return this.renderCopyPasterManager(annotUrls)
    }

    private renderAllNotesShareMenu() {
        return (
            <AllNotesShareMenu
                contentSharingBG={this.props.contentSharing}
                annotationsBG={this.props.annotationsShareAll}
                normalizedPageUrl={this.props.normalizedPageUrl}
                copyLink={async (link) => {
                    this.props.copyPageLink(link)
                }}
                postBulkShareHook={(shareState) =>
                    this.props.postBulkShareHook(shareState)
                }
            />
        )
    }

    private renderNewAnnotation() {
        return (
            <NewAnnotationSection>
                <AnnotationCreate
                    {...this.props.annotationCreateProps}
                    ref={this.annotationCreateRef as any}
                />
            </NewAnnotationSection>
        )
    }

    private renderLoader = (key?: string) => (
        <LoadingIndicatorContainer key={key}>
            <LoadingIndicatorStyled />
        </LoadingIndicatorContainer>
    )

    private renderFollowedListNotes(listId: string) {
        const list = this.props.followedLists.byId[listId]
        if (!list.isExpanded || list.annotationsLoadState === 'pristine') {
            return null
        }

        if (list.annotationsLoadState === 'running') {
            return this.renderLoader()
        }

        if (list.annotationsLoadState === 'error') {
            return (
                <FollowedListsMsgContainer>
                    <FollowedListsMsgHead>
                        Something went wrong
                    </FollowedListsMsgHead>
                    <FollowedListsMsg>
                        Reload the page and if the problem persists{' '}
                        <ExternalLink
                            label="contact support"
                            href="mailto:support@worldbrain.io"
                        />
                        .
                    </FollowedListsMsg>
                </FollowedListsMsgContainer>
            )
        }

        const annotationsData = list.sharedAnnotationReferences
            .map((ref) => this.props.followedAnnotations[ref.id])
            .filter((a) => !!a)

        if (!annotationsData.length) {
            return (
                <EmptyMessageContainer>
                    <SectionCircle>
                        <Icon
                            filePath={icons.commentEmpty}
                            heightAndWidth="20px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <InfoText>No notes exist in this Space anymore.</InfoText>
                </EmptyMessageContainer>
            )
        }

        return (
            <FollowedNotesContainer>
                {annotationsData.map((data) => {
                    const conversationId = `${list.id}:${data.id}`
                    const conversation = this.props.conversations[
                        conversationId
                    ]
                    const sharedAnnotationRef: SharedAnnotationReference = {
                        id: data.id,
                        type: 'shared-annotation-reference',
                    }
                    const eventHandlers = this.props.bindSharedAnnotationEventHandlers(
                        sharedAnnotationRef,
                        { type: 'shared-list-reference', id: listId },
                    )
                    const hasReplies =
                        conversation?.thread != null ||
                        conversation?.replies.length > 0

                    // If annot is owned by the current user, we allow a whole bunch of other functionality
                    const ownAnnotationProps: Partial<AnnotationEditableProps> = {}
                    if (data.localId != null) {
                        const localAnnotation = this.props.annotations.find(
                            (a) => a.url === data.localId,
                        )

                        ownAnnotationProps.isBulkShareProtected =
                            localAnnotation.isBulkShareProtected
                        ownAnnotationProps.appendRepliesToggle = true
                        ownAnnotationProps.url = localAnnotation.url
                        ownAnnotationProps.lists = localAnnotation.lists
                        ownAnnotationProps.comment = localAnnotation.comment
                        ownAnnotationProps.isShared = localAnnotation.isShared
                        ownAnnotationProps.lastEdited =
                            localAnnotation.lastEdited
                        ownAnnotationProps.mode = this.props.followedLists.byId[
                            listId
                        ].annotationModes[data.localId]
                        ownAnnotationProps.listPickerRenderLocation =
                            list.activeListPickerState?.position
                        ownAnnotationProps.annotationEditDependencies = this.props.bindAnnotationEditProps(
                            { url: data.localId, isShared: true },
                            listId,
                        )
                        ownAnnotationProps.annotationFooterDependencies = this.props.bindAnnotationFooterEventProps(
                            { url: data.localId, body: data.body },
                            listId,
                        )
                        ownAnnotationProps.renderListsPickerForAnnotation = this.props.renderListsPickerForAnnotation(
                            listId,
                        )
                        ownAnnotationProps.renderCopyPasterForAnnotation = this.props.renderCopyPasterForAnnotation(
                            listId,
                        )
                        ownAnnotationProps.renderShareMenuForAnnotation = this.props.renderShareMenuForAnnotation(
                            listId,
                        )
                    }

                    return (
                        <React.Fragment key={data.id}>
                            <AnnotationEditable
                                isShared
                                isBulkShareProtected
                                url={data.id}
                                body={data.body}
                                comment={data.comment}
                                lastEdited={data.updatedWhen}
                                createdWhen={data.createdWhen}
                                creatorDependencies={
                                    data.localId != null
                                        ? null
                                        : this.props.users[data.creatorId]
                                }
                                isActive={
                                    this.props.activeAnnotationUrl === data.id
                                }
                                onReplyBtnClick={eventHandlers.onReplyBtnClick}
                                onHighlightClick={this.props.setActiveAnnotationUrl(
                                    data.id,
                                )}
                                isClickable={
                                    this.props.theme.canClickAnnotations &&
                                    data.body?.length > 0
                                }
                                repliesLoadingState={
                                    list.conversationsLoadState
                                }
                                hasReplies={hasReplies}
                                getListDetailsById={
                                    this.props.getListDetailsById
                                }
                                {...ownAnnotationProps}
                            />
                            <ConversationReplies
                                newReplyEventHandlers={eventHandlers}
                                conversation={conversation}
                                hasReplies={hasReplies}
                                annotation={{
                                    body: data.body,
                                    linkId: data.id,
                                    comment: data.comment,
                                    createdWhen: data.createdWhen,
                                    reference: sharedAnnotationRef,
                                }}
                            />
                        </React.Fragment>
                    )
                })}
            </FollowedNotesContainer>
        )
    }

    private renderSharedNotesByList() {
        const { followedLists } = this.props

        const sharedNotesByList = followedLists.allIds.map((listId) => {
            const listData = followedLists.byId[listId]
            return (
                <FollowedListNotesContainer
                    bottom={listData.isExpanded ? '20px' : '0px'}
                    key={listId}
                    top="0px"
                >
                    {/* <React.Fragment key={listId}> */}
                    <FollowedListRow
                        onClick={() =>
                            this.props.expandFollowedListNotes(listId)
                        }
                        title={listData.name}
                    >
                        <FollowedListTitleContainer>
                            {/* <Icon
                                icon={icons.arrowRight}
                                heightAndWidth="22px"
                                rotation={listData.isExpanded && 90}
                                onClick={() =>
                                    this.props.expandFollowedListNotes(listId)
                                }
                            /> */}
                            <FollowedListTitle>
                                {listData.name}
                            </FollowedListTitle>
                        </FollowedListTitleContainer>
                        <ButtonContainer>
                            <ActionButtons>
                                {/* <ButtonTooltip
                                    tooltipText="Select Space"
                                    position="left"
                                >
                                    <Icon
                                        icon="edit"
                                        height="16px"
                                        onClick={() =>
                                            this.triggerSelectSpace(listId)
                                        }
                                    />
                                </ButtonTooltip> */}
                                <ButtonTooltip
                                    tooltipText="Go to Space"
                                    position="left"
                                >
                                    <Icon
                                        icon="goTo"
                                        height="16px"
                                        onClick={() =>
                                            this.props.openCollectionPage(
                                                listId,
                                            )
                                        }
                                    />
                                </ButtonTooltip>
                            </ActionButtons>
                            <FollowedListNoteCount active left="5px">
                                {listData.sharedAnnotationReferences.length}
                            </FollowedListNoteCount>
                        </ButtonContainer>
                    </FollowedListRow>
                    {this.renderFollowedListNotes(listId)}
                </FollowedListNotesContainer>
            )
        })
        return (
            <SectionTitleContainer>
                {this.props.isExpandedSharedSpaces &&
                    (this.props.followedListLoadState === 'running' ? (
                        this.renderLoader()
                    ) : this.props.followedListLoadState === 'error' ? (
                        <FollowedListsMsgContainer>
                            <FollowedListsMsgHead>
                                Something went wrong
                            </FollowedListsMsgHead>
                            <FollowedListsMsg>
                                Reload the page and if the problem persists{' '}
                                <ExternalLink
                                    label="contact
                                    support"
                                    href="mailto:support@worldbrain.io"
                                />
                                .
                            </FollowedListsMsg>
                        </FollowedListsMsgContainer>
                    ) : (
                        <>
                            {followedLists.allIds.length > 0 ? (
                                <AnnotationContainer>
                                    {sharedNotesByList}
                                </AnnotationContainer>
                            ) : (
                                <EmptyMessageContainer>
                                    <SectionCircle>
                                        <Icon
                                            filePath={icons.peopleFine}
                                            heightAndWidth="20px"
                                            color="purple"
                                            hoverOff
                                        />
                                    </SectionCircle>
                                    <InfoText>
                                        Create your first
                                        <Link
                                            onClick={() =>
                                                window.open(
                                                    'https://links.memex.garden/tutorials/collaborative-spaces',
                                                )
                                            }
                                        >
                                            collaborative Space
                                        </Link>
                                    </InfoText>
                                </EmptyMessageContainer>
                            )}
                        </>
                    ))}
            </SectionTitleContainer>
        )
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    private renderFeed() {
        return (
            <AnnotationsSectionStyled>
                <FeedFrame src={this.whichFeed()} />
            </AnnotationsSectionStyled>
        )
    }

    private renderResultsBody() {
        if (this.props.isFeedShown) {
            return this.renderFeed()
        }

        if (this.props.isSearchLoading) {
            return this.renderLoader()
        }
        // return this.props.isolatedView ? (
        //     <AnnotationsSectionStyled>
        //         {this.renderIsolatedView(this.props.isolatedView)}
        //     </AnnotationsSectionStyled>
        // ) : (
        return (
            <React.Fragment>
                {this.props.isExpanded ? (
                    <AnnotationsSectionStyled>
                        {this.renderAnnotationsEditable()}
                    </AnnotationsSectionStyled>
                ) : (
                    <AnnotationsSectionStyled>
                        {this.renderSharedNotesByList()}
                    </AnnotationsSectionStyled>
                )}
                {/* <UpdateNotifBanner
                    location={'sidebar'}
                    theme={{ position: 'fixed' }}
                /> */}
            </React.Fragment>
        )
    }

    private renderAnnotationsEditable() {
        const annots: JSX.Element[] = []

        if (this.props.noteCreateState === 'running') {
            annots.push(
                <LoaderBox>{this.renderLoader('new-note-spinner')}</LoaderBox>,
            )
        }

        annots.push(
            ...this.props.annotations.map((annot, i) => {
                const footerDeps = this.props.bindAnnotationFooterEventProps(
                    annot,
                )
                const ref = React.createRef<_AnnotationEditable>()
                this.annotationEditRefs[annot.url] = ref
                return (
                    <AnnotationBox
                        key={annot.url}
                        isActive={this.props.activeAnnotationUrl === annot.url}
                        zIndex={this.props.annotations.length - i}
                    >
                        <AnnotationEditable
                            {...annot}
                            {...this.props}
                            body={annot.body}
                            comment={annot.comment}
                            isShared={annot.isShared}
                            createdWhen={annot.createdWhen!}
                            isBulkShareProtected={annot.isBulkShareProtected}
                            mode={this.props.annotationModes[annot.url]}
                            isActive={
                                this.props.activeAnnotationUrl === annot.url
                            }
                            onHighlightClick={this.props.setActiveAnnotationUrl(
                                annot.url,
                            )}
                            listPickerRenderLocation={
                                this.props.activeListPickerState?.position
                            }
                            onGoToAnnotation={footerDeps.onGoToAnnotation}
                            annotationEditDependencies={this.props.bindAnnotationEditProps(
                                annot,
                            )}
                            annotationFooterDependencies={footerDeps}
                            isClickable={
                                this.props.theme.canClickAnnotations &&
                                annot.body?.length > 0
                            }
                            passDownRef={ref}
                            renderShareMenuForAnnotation={this.props.renderShareMenuForAnnotation()}
                            renderCopyPasterForAnnotation={this.props.renderCopyPasterForAnnotation()}
                            renderListsPickerForAnnotation={this.props.renderListsPickerForAnnotation()}
                        />
                    </AnnotationBox>
                )
            }),
        )

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    key="sidebar-pagination-waypoint"
                    onEnter={this.props.handleScrollPagination}
                />,
            )
        }

        if (this.props.appendLoader) {
            annots.push(this.renderLoader('sidebar-pagination-spinner'))
        }

        if (this.props.showCongratsMessage) {
            annots.push(<CongratsMessage key="sidebar-congrats-msg" />)
        }

        return (
            <FollowedListNotesContainer
                bottom={this.props.isExpanded ? '20px' : '0px'}
            >
                {this.props.isExpanded && (
                    <>
                        <TopAreaContainer>
                            {this.renderNewAnnotation()}
                            {annots.length > 1 && (
                                <AnnotationActions>
                                    {this.renderTopBarActionButtons()}
                                </AnnotationActions>
                            )}
                        </TopAreaContainer>
                        {this.props.noteCreateState === 'running' ||
                        this.props.annotations.length > 0 ? (
                            <AnnotationContainer>{annots}</AnnotationContainer>
                        ) : (
                            <EmptyMessageContainer>
                                <SectionCircle>
                                    <Icon
                                        filePath={icons.commentEmpty}
                                        heightAndWidth="20px"
                                        color="purple"
                                        hoverOff
                                    />
                                </SectionCircle>
                                <InfoText>
                                    Add a note or highlight sections of the page
                                </InfoText>
                            </EmptyMessageContainer>
                        )}
                    </>
                )}
            </FollowedListNotesContainer>
        )
    }

    private renderTopBarSwitcher() {
        const { followedLists } = this.props

        return (
            <TopBarContainer>
                <FollowedListTitleContainerMyNotes left="5px">
                    <MyNotesClickableArea
                        onClick={
                            this.props.isExpanded
                                ? null
                                : () => {
                                      this.props.expandMyNotes()
                                  }
                        }
                    >
                        <FollowedListSectionTitle
                            active={this.props.isExpanded}
                        >
                            My Annotations
                        </FollowedListSectionTitle>
                    </MyNotesClickableArea>
                </FollowedListTitleContainerMyNotes>
                <FollowedListTitleContainer
                    onClick={
                        this.props.isExpandedSharedSpaces
                            ? null
                            : () => {
                                  this.props.expandSharedSpaces(
                                      followedLists.allIds,
                                  )
                              }
                    }
                    left="5px"
                >
                    <FollowedListSectionTitle
                        active={this.props.isExpandedSharedSpaces}
                    >
                        Spaces
                        {this.props.followedListLoadState === 'running' && (
                            <LoadingBox>
                                <LoadingIndicator size={12} />{' '}
                            </LoadingBox>
                        )}
                        {followedLists.allIds.length > 0 && (
                            <LoadingBox>
                                <PageActivityIndicator
                                    active={true}
                                    left="5px"
                                />
                            </LoadingBox>
                        )}
                    </FollowedListSectionTitle>
                </FollowedListTitleContainer>
                <FollowedListTitleContainerMyNotes left="5px">
                    <MyNotesClickableArea
                        onClick={() => this.props.expandFeed()}
                    >
                        <FollowedListSectionTitle
                            active={this.props.isFeedShown}
                        >
                            Feed
                        </FollowedListSectionTitle>
                    </MyNotesClickableArea>
                </FollowedListTitleContainerMyNotes>
            </TopBarContainer>
        )
    }

    private renderSortingMenuDropDown() {
        return (
            <SortingDropdownMenuBtn
                onMenuItemClick={(sortingFn) =>
                    this.props.onMenuItemClick(sortingFn)
                }
                onClickOutSide={() =>
                    this.setState({ showSortDropDown: false })
                }
            />
        )
    }

    private renderSharePageButton() {
        return (
            <>
                <PrimaryAction
                    label={'Share Page'}
                    backgroundColor={'purple'}
                    onClick={() =>
                        this.setState({
                            showPageSpacePicker: !this.state
                                .showPageSpacePicker,
                        })
                    }
                />
                {/* <SpacePicker initialSelectedListIds={this.props.pag}  />} */}
            </>
        )
    }

    private renderTopBarActionButtons() {
        return (
            <TopBarActionBtns>
                <NewHoverBox
                    referenceEl={this.sortDropDownButtonRef.current}
                    componentToOpen={
                        this.state.showSortDropDown
                            ? this.renderSortingMenuDropDown()
                            : null
                    }
                    placement={'bottom-end'}
                    offsetX={5}
                    closeComponent={() =>
                        this.setState({
                            showSortDropDown: false,
                        })
                    }
                    width={'fit-content'}
                    strategy={'fixed'}
                >
                    <Icon
                        filePath={icons.sort}
                        onClick={() =>
                            this.setState({
                                showSortDropDown: true,
                            })
                        }
                        height="18px"
                        width="20px"
                        ref={this.sortDropDownButtonRef}
                        active={this.state.showSortDropDown}
                    />
                </NewHoverBox>
                <NewHoverBox
                    referenceEl={this.copyButtonRef.current}
                    componentToOpen={
                        this.state.showAllNotesCopyPaster
                            ? this.renderAllNotesCopyPaster()
                            : null
                    }
                    placement={'bottom-end'}
                    offsetX={5}
                    closeComponent={() =>
                        this.setState({
                            showAllNotesCopyPaster: false,
                        })
                    }
                    strategy={'fixed'}
                    width={'fit-content'}
                >
                    <Icon
                        filePath={icons.copy}
                        onClick={() =>
                            this.setState({
                                showAllNotesCopyPaster: true,
                            })
                        }
                        height="18px"
                        width="20px"
                        ref={this.copyButtonRef}
                        active={this.state.showAllNotesCopyPaster}
                    />
                </NewHoverBox>
                <NewHoverBox
                    referenceEl={this.bulkEditButtonRef.current}
                    componentToOpen={
                        this.state.showAllNotesShareMenu
                            ? this.renderAllNotesShareMenu()
                            : null
                    }
                    placement={'bottom-end'}
                    offsetX={5}
                    closeComponent={() =>
                        this.setState({
                            showAllNotesShareMenu: false,
                        })
                    }
                    strategy={'fixed'}
                    width={'fit-content'}
                >
                    <Icon
                        filePath={icons.multiEdit}
                        onClick={() =>
                            this.setState({
                                showAllNotesShareMenu: true,
                            })
                        }
                        active={this.state.showAllNotesShareMenu}
                        height="18px"
                        width="20px"
                        ref={this.bulkEditButtonRef}
                    />
                </NewHoverBox>
            </TopBarActionBtns>
        )
    }

    render() {
        return (
            <ResultBodyContainer sidebarContext={this.props.sidebarContext}>
                <TopBar>
                    <>
                        {this.renderTopBarSwitcher()}
                        {this.renderSharePageButton()}
                        {/* {this.props.sidebarActions()} */}
                    </>
                    {this.state.showPageSpacePicker && (
                        <HoverBox
                            padding="10px"
                            right="0px"
                            top="55px"
                            width="250px"
                        >
                            TOOD: Space picker goes here!
                        </HoverBox>
                    )}
                </TopBar>
                {this.renderResultsBody()}
            </ResultBodyContainer>
        )
    }
}

export default onClickOutside(AnnotationsSidebar)

/// Search bar
// TODO: Move icons to styled components library, refactored shared css

const TopAreaContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
`

const AnnotationActions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 10px;
    width: fill-available;
    height: 20px;
    margin-top: -10px;
    margin-bottom: 5px;
`

const ActionButtons = styled.div`
    display: none;
`

const SpacerBottom = styled.div`
    height: 1200px;
`

const LoaderBox = styled.div`
    height: 100px;
    width: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
`

const Link = styled.span`
    color: ${(props) => props.theme.colors.purple};
    padding-left: 4px;
    cursor: pointer;
`

const LoadingBox = styled.div`
    width: 30px;
    display: flex;
    justify-content: center;
`

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    background: ${(props) => props.theme.colors.backgroundColor};
    z-index: 11300;
    padding: 15px 0px 10px 0px;
    border-bottom: 1px solid ${(props) => props.theme.colors.darkhover};
`

const TopBarContainer = styled.div`
    display: flex;
    grid-gap: 2px;
    align-items: center;
`
const EmptyMessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px 5px;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    width: 100%;
`
const AnnotationBox = styled.div<{ isActive: boolean; zIndex: number }>`
    width: fill-available;
    z-index: ${(props) => props.zIndex};
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.darkhover};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 48px;
    width: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const ButtonStyled = styled.button`
    cursor: pointer;
    z-index: 3000;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
`

const SearchIcon = styled.span`
    background-image: url('/img/searchIcon.svg');
    background-size: 15px;
    display: block;
    background-repeat: no-repeat;
    width: 29px;
    height: 29px;
    background-position: center;
    border-radius: 50%;
    background-color: transparent;
`

const SearchInputStyled = styled(TextInputControlled)`
    color: ${(props) => props.theme.colors.primary};
    border-radius: 3px;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    width: 100%;
    height: 30px;
    border: none;
    outline: none;
    background-color: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.primary};
        font-weight: 500;
        opacity: 0.7;
    }

    &:focus {
        outline: none;
        border: none;
        box-shadow: none;
    }
    padding: 5px 0px;
`

const FollowedListNotesContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
`

const SectionTitleContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
`

const AnnotationContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    /* padding-bottom: 500px;
    overflow-y: scroll;
    overflow-x: visible; */
    height: fill-available;
    overflow: scroll;
    padding-bottom: 100px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const FollowedNotesContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const FollowedListsMsgContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding-bottom: 50px;
    flex-direction: column;
`

const FollowedListsMsgHead = styled.span`
    font-weight: bold;
    text-align: center;
    color: ${(props) => props.theme.colors.normalText};
    padding-top: 10px;
    padding-bottom: 5px;
    font-size: 14px;
    line-height: 20px;
    justify-content: center;
    display: grid;
    grid-auto-flow: row;
    align-items: center;
    grid-gap: 5px;
`
const FollowedListsMsg = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    text-align: center;
    font-size: 14px;
    line-height: 17px;
`

const FollowedListRow = styled(Margin)<{ context: string }>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    width: fill-available;
    cursor: pointer;
    border-radius: 8px;
    height: 40px;
    padding: 5px 15px 5px 10px;
    margin: 0 2px;

    &:first-child {
        margin-top: 5px;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
    }

    &:hover ${ActionButtons} {
        display: flex;
        align-items: center;
        justify-content: center;
    }
`

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`

const FollowedListSectionTitle = styled(Margin)<{ active: boolean }>`
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    justify-content: center;
    width: max-content;
    font-weight: 400;
    flex-direction: row;
    grid-gap: 2px;
    align-items: center;
    height: 36px;
    padding: 0 10px;
    border-radius: 5px;

    ${(props) =>
        props.active &&
        css`
            background: ${(props) => props.theme.colors.lightHover};
            cursor: default;

            &:hover {
                background: ${(props) => props.theme.colors.lightHover};
            }
        `}

    ${(props) =>
        !props.active &&
        css`
            &:hover {
                background: ${(props) => props.theme.colors.lightHover};
            }
        `}

    & * {
        cursor: pointer;
    }
`

const FollowedListTitleContainer = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: ${(props) =>
        props.context === 'isolatedView' ? 'default' : 'pointer'};
    justify-content: flex-start;
    flex: 1;
    grid-gap: 10px;
`

const FollowedListTitleContainerMyNotes = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    justify-content: space-between;
    width: fit-content;
    z-index: 1;
`

const FollowedListTitle = styled.span<{ context: string }>`
    font-size: ${(props) =>
        props.context === 'isolatedView' ? '18px' : '14px'};
    white-space: pre;
    max-width: 295px;
    text-overflow: ellipsis;
    overflow-x: hidden;
    color: ${(props) => props.theme.colors.normalText};
`

const PageActivityIndicator = styled(Margin)<{ active: boolean }>`
    font-weight: bold;
    border-radius: 30px;
    background-color: ${(props) => props.theme.colors.purple};
    width: 14px;
    height: 14px;
    font-size: 12px;
    display: flex;
`

const FollowedListNoteCount = styled(Margin)<{ active: boolean }>`
    font-weight: bold;
    font-size: 14px;
    display: flex;
    color: ${(props) => props.theme.colors.normalText};
`

const CloseIconStyled = styled.div<{ background: string }>`
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100%;
    background-color: ${(props) =>
        props.background ? props.background : props.theme.colors.primary};
    mask-image: url(${icons.close});
    background-size: 12px;
    display: block;
    cursor: pointer;
    background-repeat: no-repeat;
    width: 100%;
    height: 100%;
    background-position: center;
    border-radius: 3px;
`

const CloseButtonStyled = styled.button`
    cursor: pointer;
    z-index: 2147483647;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
`

const TopBarStyled = styled.div`
    position: static;
    top: 0;
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 2147483647;
    padding: 7px 8px 5px 3px;
    height: 40px;
    box-sizing: border-box;
    width: 100%;
`

const LoadingIndicatorContainer = styled.div`
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const LoadingIndicatorStyled = styled(LoadingIndicator)`
    width: 100%;
    display: flex;
    height: 50px;
    margin: 30px 0;
    justify-content: center;
`

const NewAnnotationSection = styled.section`
    font-family: 'Satoshi', sans-serif;
    height: auto;
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: fill-available;
    margin-bottom: 8px;
    z-index: 11200;
`

const AnnotationsSectionStyled = styled.section`
    font-family: 'Satoshi', sans-serif;
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
    flex: 1;
    overflow: scroll;
`

const TopSectionStyled = styled.div`
    position: sticky;
    top: 0px;
    z-index: 2600;
    background: white;
    overflow: hidden;
    padding: 0 5px;
`

const TopBarActionBtns = styled.div`
    display: grid;
    justify-content: space-between;
    align-items: center;
    display: flex;
    gap: 10px;
    height: 24px;
    z-index: 10000;
`

const MyNotesClickableArea = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
`

const ResultBodyContainer = styled.div<{ sidebarContext: string }>`
    height: fill-available;
    width: fill-available;
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
    padding: 0 20px;
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: fill-available;
    border: none;
    border-radius: 10px;
`

// old code we may still need but not sure

// private renderCopyPasterManager(annotationUrls) {
//     return (
//         <HoverBox>
//             <PageNotesCopyPaster
//                 copyPaster={this.props.copyPaster}
//                 annotationUrls={annotationUrls}
//                 normalizedPageUrls={this.props.normalizedPageUrls}
//                 onClickOutside={() =>
//                     this.setState({ showAllNotesCopyPaster: false })
//                 }
//             />
//         </HoverBox>
//     )
// }

// private renderAllNotesCopyPaster() {
//     if (!this.state.showAllNotesCopyPaster) {
//         return null
//     }

//     const annotUrls = this.props.annotationUrls()
//     return (
//         <CopyPasterWrapperTopBar>
//             {this.renderCopyPasterManager(annotUrls)}
//         </CopyPasterWrapperTopBar>
//     )
// }

// private renderAllNotesShareMenu() {
//     if (!this.state.showAllNotesShareMenu) {
//         return null
//     }

//     return (
//         <ShareMenuWrapperTopBar>
//             <ClickAway
//                 onClickAway={() =>
//                     this.setState({ showAllNotesShareMenu: false })
//                 }
//             >
//                 <HoverBox width="340px">
//                     <AllNotesShareMenu
//                         contentSharingBG={this.props.contentSharing}
//                         annotationsBG={this.props.annotationsShareAll}
//                         normalizedPageUrl={this.props.normalizedPageUrl}
//                         copyLink={async (link) => {
//                             this.props.copyPageLink(link)
//                         }}
//                         postBulkShareHook={(shareInfo) =>
//                             this.props.postBulkShareHook(shareInfo)
//                         }
//                     />
//                 </HoverBox>
//             </ClickAway>
//         </ShareMenuWrapperTopBar>
//     )
// }

// private renderSharedListNotes(
//     listId,
//     dropdownIcon,
//     sharedListStyleContext,
//     onClickTitle,
//     buttonOpenIsolated,
//     renderNotes,
// ) {
//     const { followedListLoadState, followedLists } = this.props
//     const listData = followedLists.byId[listId]

//     return (
//         <FollowedListNotesContainer bottom="10px" key={listId}>
//             {/* <React.Fragment key={listId}> */}
//             <FollowedListRow
//                 onClick={onClickTitle}
//                 bottom="5px"
//                 title={listData.name}
//                 context={sharedListStyleContext}
//             >
//                 {dropdownIcon}
//                 <FollowedListTitleContainer
//                     context={sharedListStyleContext}
//                 >
//                     <FollowedListTitle
//                         context={sharedListStyleContext}
//                         onClick={onClickTitle}
//                     >
//                         {listData.name}
//                     </FollowedListTitle>
//                     <FollowedListNoteCount left="10px" right="15px">
//                         {listData.sharedAnnotationReferences.length}
//                     </FollowedListNoteCount>
//                 </FollowedListTitleContainer>
//                 <FollowedListActionItems>
//                     {buttonOpenIsolated}
//                     <ButtonTooltip
//                         tooltipText="Go to collection"
//                         position="bottomLeft"
//                     >
//                         <FollowedListIconContainer
//                             onClick={(event) => {
//                                 event.stopPropagation()
//                                 this.props.openCollectionPage(listId)
//                             }}
//                         >
//                             <FollowedListActionIcon src={icons.goTo} />
//                         </FollowedListIconContainer>
//                     </ButtonTooltip>
//                 </FollowedListActionItems>
//             </FollowedListRow>
//             {renderNotes}
//         </FollowedListNotesContainer>
//     )
// }

// private renderSharedListNotesNotIsolated(listId) {
//     const { followedLists } = this.props

//     const listData = followedLists.byId[listId]

//     const dropdownIcon = (
//         <FollowedListIconContainer
//             onClick={(event) => {
//                 event.stopPropagation()
//                 this.props.expandFollowedListNotes(listId)
//             }}
//         >
//             <FollowedListDropdownIcon
//                 icon="triangle"
//                 height="12px"
//                 isExpanded={listData.isExpanded}
//                 marginLeft="0px"
//             />
//         </FollowedListIconContainer>
//     )
//     const sharedListStyleContext = null

//     const onClickTitle = (event) => {
//         event.stopPropagation()
//         this.props.toggleIsolatedListView(listId)
//     }

//     const buttonOpenIsolated = (
//         <ButtonTooltip
//             tooltipText="Add Highlights and Notes"
//             position="bottom"
//         >
//             <FollowedListIconContainer onClick={onClickTitle}>
//                 <FollowedListActionIcon src={icons.commentAdd} />
//             </FollowedListIconContainer>
//         </ButtonTooltip>
//     )
//     const renderNotes = (
//         <>
//             {listData.isExpanded &&
//                 this.renderNewAnnotation('isolatedView')}
//             {this.renderFollowedListNotes(listId)}
//         </>
//     )

//     return this.renderSharedListNotes(
//         listId,
//         dropdownIcon,
//         sharedListStyleContext,
//         onClickTitle,
//         buttonOpenIsolated,
//         renderNotes,
//     )
// }

// private renderSharedListNotesIsolated(listId) {
//     const sharedListStyleContext = 'isolatedView'

//     const renderNotes = (
//         <>
//             {this.renderNewAnnotation('isolatedView')}
//             {this.renderFollowedListNotes(listId)}
//         </>
//     )
//     return this.renderSharedListNotes(
//         listId,
//         null,
//         sharedListStyleContext,
//         null,
//         null,
//         renderNotes,
//     )
// }

// private renderIsolatedView(listId) {
//     const ContributorTooltip = (
//         <span>You can add highlights to this page.</span>
//     )

//     return (
//         <FollowedListNotesContainer bottom="10px">
//             <IsolatedViewTopBar>
//                 <BackButton
//                     onClick={(event) => {
//                         this.props.toggleIsolatedListView(listId)
//                     }}
//                 >
//                     <BackButtonArrow icon="triangle" height="12px" />{' '}
//                     {'Back'}
//                 </BackButton>
//                 {this.props.followedLists.byId[listId]?.isContributable ? (
//                     <ButtonTooltip
//                         tooltipText={ContributorTooltip}
//                         position="bottomLeft"
//                     >
//                         <ContributorBadge>
//                             <ContributorIcon src={icons.shared} />
//                             Contributor
//                         </ContributorBadge>
//                     </ButtonTooltip>
//                 ) : (
//                     <p>{'@ Commentor'}</p>
//                 )}
//             </IsolatedViewTopBar>
//             {this.state.showIsolatedViewNotif && (
//                 <IsolatedViewTutorial>
//                     <IsolatedViewText>
//                         While you are in this view, all annotations <br />{' '}
//                         and notes you make are added to this space.
//                     </IsolatedViewText>
//                     <IsolatedViewTutorialClose
//                         onClick={() => {
//                             this.setState({ showIsolatedViewNotif: false }),
//                                 setLocalStorage(
//                                     SHOW_ISOLATED_VIEW_KEY,
//                                     false,
//                                 )
//                         }}
//                     >
//                         <CloseIconStyled background={'white'} />
//                     </IsolatedViewTutorialClose>
//                 </IsolatedViewTutorial>
//             )}
//             {this.props.isExpandedSharedSpaces &&
//                 (this.props.followedListLoadState === 'running' ? (
//                     this.renderLoader()
//                 ) : this.props.followedListLoadState === 'error' ? (
//                     <FollowedListsMsgContainer>
//                         <FollowedListsMsgHead>
//                             Something went wrong
//                         </FollowedListsMsgHead>
//                         <FollowedListsMsg>
//                             Reload the page and if the problem persists{' '}
//                             <ExternalLink
//                                 label="contact
//                                 support"
//                                 href="mailto:support@worldbrain.io"
//                             />
//                             .
//                         </FollowedListsMsg>
//                     </FollowedListsMsgContainer>
//                 ) : (
//                     <>{this.renderSharedListNotesIsolated(listId)}</>
//                 ))}
//         </FollowedListNotesContainer>
//     )
// }

// private renderSharedNotesByList() {
//     const { followedListLoadState, followedLists } = this.props

//     // if (!followedLists.allIds.length) {
//     //     return null
//     // }

//     const sharedNotesByList = followedLists.allIds.map((listId) =>
//         this.renderSharedListNotesNotIsolated(listId),
//     )
//     return (
//         <FollowedListNotesContainer bottom="10px">
//             <FollowedListTitleContainer
//                 onClick={() =>
//                     this.props.expandSharedSpaces(followedLists.allIds)
//                 }
//                 left="5px"
//                 bottom="5px"
//             >
//                 <FollowedListSectionTitle>
//                     From Shared Spaces
//                 </FollowedListSectionTitle>

//                 {this.props.followedListLoadState ===
//                 'running' ? null : followedLists.allIds.length ? (
//                     <FollowedListDropdownIcon
//                         icon="triangle"
//                         height="12px"
//                         isExpanded={this.props.isExpandedSharedSpaces}
//                         marginLeft="5px"
//                         marginRight="5px"
//                     />
//                 ) : (
//                     <FollowedListNoteCount left="5px" right="15px">
//                         0
//                     </FollowedListNoteCount>
//                 )}
//             </FollowedListTitleContainer>
