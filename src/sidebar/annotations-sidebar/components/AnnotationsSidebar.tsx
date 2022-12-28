import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css, keyframes } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ConversationReplies } from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import type {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { NewReplyEventHandlers } from '@worldbrain/memex-common/lib/content-conversations/ui/components/new-reply'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
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
import type { AnnotationSharingStates } from 'src/content-sharing/background/types'
import { getLocalStorage } from 'src/util/storage'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'

const SHOW_ISOLATED_VIEW_KEY = `show-isolated-view-notif`
export interface AnnotationsSidebarProps
    extends Omit<SidebarContainerState, 'annotationModes'> {
    annotationModes: { [url: string]: AnnotationMode }
    // sidebarActions: () => void

    setActiveAnnotationUrl?: (
        annotation?: Annotation,
        annotationUrl?: string,
    ) => React.MouseEventHandler
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
    shareButtonRef: React.RefObject<HTMLDivElement>
    spacePickerButtonRef: React.RefObject<HTMLDivElement>
    activeShareMenuNoteId: string
    renderShareMenuForAnnotation: (
        followedListId?: string,
    ) => (id: string) => JSX.Element
    renderListsPickerForAnnotation: (
        followedListId?: string,
    ) => (
        id: string,
        referenceElement?: React.RefObject<HTMLDivElement>,
    ) => JSX.Element

    expandFeed: () => void
    expandMyNotes: () => void
    expandSharedSpaces: (listIds: string[]) => void
    expandFollowedListNotes: (listId: string) => void
    toggleIsolatedListView: (listId: string) => void

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
    normalizedPageUrls: string[]
    normalizedPageUrl?: string
    annotationUrls: () => void
    contentSharing: ContentSharingInterface
    annotationsShareAll: any
    copyPageLink: any
    postBulkShareHook: (shareState: AnnotationSharingStates) => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'
    //postShareHook: (shareInfo) => void+
    setPopoutsActive: (popoutsOpen: boolean) => void
    getYoutubePlayer?(): YoutubePlayer
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
    private pageShareButtonRef = React.createRef<HTMLDivElement>()
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
        //setLocalStorage(SHOW_ISOLATED_VIEW_KEY, true)
        const isolatedViewNotifVisible = await getLocalStorage(
            SHOW_ISOLATED_VIEW_KEY,
        )

        this.setState({
            showIsolatedViewNotif: isolatedViewNotifVisible,
        })
    }

    componentWillUnmount() {}

    focusCreateForm = () => (this.annotationCreateRef?.current as any).focus()
    focusEditNoteForm = (annotationId: string) =>
        (this.annotationEditRefs[annotationId]?.current).focusEditForm()

    setPopoutsActive() {
        if (
            this.state.showAllNotesCopyPaster ||
            this.state.isMarkdownHelpShown ||
            this.state.showAllNotesShareMenu ||
            this.state.showSortDropDown ||
            this.state.showPageSpacePicker
        ) {
            return this.props.setPopoutsActive(true)
        } else {
            return this.props.setPopoutsActive(false)
        }
    }

    private renderCopyPasterManager(annotationUrls) {
        if (!this.state.showAllNotesCopyPaster) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.copyButtonRef.current}
                placement={'bottom-end'}
                offsetX={5}
                closeComponent={() => {
                    this.setState({
                        showAllNotesCopyPaster: false,
                    })
                }}
                strategy={'fixed'}
                width={'fit-content'}
            >
                <PageNotesCopyPaster
                    copyPaster={this.props.copyPaster}
                    annotationUrls={annotationUrls}
                    normalizedPageUrls={this.props.normalizedPageUrls}
                />
            </PopoutBox>
        )
    }

    private renderAllNotesCopyPaster() {
        const annotUrls = this.props.annotationUrls()

        return this.renderCopyPasterManager(annotUrls)
    }

    private renderAllNotesShareMenu() {
        if (!this.state.showAllNotesShareMenu) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.bulkEditButtonRef.current}
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
            </PopoutBox>
        )
    }

    private renderNewAnnotation() {
        return (
            <NewAnnotationSection>
                <AnnotationCreate
                    {...this.props.annotationCreateProps}
                    ref={this.annotationCreateRef as any}
                    getYoutubePlayer={this.props.getYoutubePlayer}
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
                                activeShareMenuNoteId={
                                    this.props.activeShareMenuNoteId
                                }
                                onReplyBtnClick={eventHandlers.onReplyBtnClick}
                                onHighlightClick={this.props.setActiveAnnotationUrl(
                                    { annotationUrl: data.id },
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
                                shareButtonRef={this.props.shareButtonRef}
                                spacePickerButtonRef={
                                    this.props.spacePickerButtonRef
                                }
                                getYoutubePlayer={this.props.getYoutubePlayer}
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
                                <TooltipBox
                                    tooltipText="Go to Space"
                                    placement="left"
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
                                </TooltipBox>
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
                                        This page is not yet in a Space <br />{' '}
                                        you created, follow or collaborate in.
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
                <UpdateNotifBanner
                    location={'sidebar'}
                    theme={{ position: 'fixed' }}
                    sidebarContext={this.props.sidebarContext}
                />
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
                        zIndex={
                            this.props.activeShareMenuNoteId === annot.url
                                ? 10000
                                : this.props.annotations.length - i
                        }
                        className={'AnnotationBox'}
                        id={annot.url}
                        order={i}
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
                                annot,
                            )}
                            onGoToAnnotation={footerDeps.onGoToAnnotation}
                            annotationEditDependencies={this.props.bindAnnotationEditProps(
                                annot,
                            )}
                            annotationFooterDependencies={footerDeps}
                            isClickable={
                                this.props.theme.canClickAnnotations &&
                                annot.body?.length > 0
                            }
                            contextLocation={this.props.sidebarContext}
                            passDownRef={ref}
                            shareButtonRef={this.props.shareButtonRef}
                            renderShareMenuForAnnotation={this.props.renderShareMenuForAnnotation()}
                            renderCopyPasterForAnnotation={this.props.renderCopyPasterForAnnotation()}
                            renderListsPickerForAnnotation={this.props.renderListsPickerForAnnotation()}
                            getYoutubePlayer={this.props.getYoutubePlayer}
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
                <PrimaryAction
                    onClick={
                        this.props.isExpanded
                            ? null
                            : () => {
                                  this.props.expandMyNotes()
                              }
                    }
                    label={'My Annotations'}
                    active={this.props.isExpanded}
                    type={'tertiary'}
                    size={'medium'}
                />
                <PrimaryAction
                    onClick={
                        this.props.isExpandedSharedSpaces
                            ? null
                            : () => {
                                  this.props.expandSharedSpaces(
                                      followedLists.allIds,
                                  )
                              }
                    }
                    label={'Spaces'}
                    active={this.props.isExpandedSharedSpaces}
                    type={'tertiary'}
                    size={'medium'}
                    iconPosition={'right'}
                    icon={
                        this.props.followedListLoadState === 'running' ||
                        this.props.followedListLoadState === 'pristine' ? (
                            <LoadingBox>
                                <LoadingIndicator size={10} />{' '}
                            </LoadingBox>
                        ) : followedLists.allIds.length > 0 ? (
                            <LoadingBox>
                                <PageActivityIndicator active={true} />
                            </LoadingBox>
                        ) : (
                            <LoadingBox>
                                <PageActivityIndicator active={false} />
                            </LoadingBox>
                        )
                    }
                />
                <PrimaryAction
                    onClick={() => this.props.expandFeed()}
                    label={'Feed'}
                    active={this.props.isFeedShown}
                    type={'tertiary'}
                    size={'medium'}
                    iconPosition={'right'}
                    icon={
                        this.props.followedListLoadState === 'running' ||
                        this.props.followedListLoadState === 'pristine' ? (
                            <LoadingBox>
                                <LoadingIndicator size={12} />{' '}
                            </LoadingBox>
                        ) : followedLists.allIds.length > 0 ? (
                            <LoadingBox>
                                <PageActivityIndicator active={true} />
                            </LoadingBox>
                        ) : (
                            <LoadingBox>
                                <PageActivityIndicator active={false} />
                            </LoadingBox>
                        )
                    }
                />
            </TopBarContainer>
        )
    }

    private renderSortingMenuDropDown() {
        if (!this.state.showSortDropDown) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.sortDropDownButtonRef.current}
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
                <SortingDropdownMenuBtn
                    onMenuItemClick={(sortingFn) =>
                        this.props.onMenuItemClick(sortingFn)
                    }
                />
            </PopoutBox>
        )
    }

    private renderSharePageButton() {
        return (
            <>
                <PrimaryAction
                    label={'Share Page'}
                    onClick={async () => {
                        await this.setState({
                            showPageSpacePicker: !this.state
                                .showPageSpacePicker,
                        })
                        this.setPopoutsActive()
                    }}
                    icon={'invite'}
                    type={'primary'}
                    size={'medium'}
                    innerRef={this.pageShareButtonRef}
                />
            </>
        )
    }

    private renderTopBarActionButtons() {
        return (
            <>
                {this.renderSortingMenuDropDown()}
                {this.renderAllNotesCopyPaster()}
                {this.renderAllNotesShareMenu()}
                <TopBarActionBtns>
                    <Icon
                        filePath={icons.sort}
                        onClick={async () => {
                            await this.setState({
                                showSortDropDown: true,
                            })
                            this.setPopoutsActive()
                        }}
                        height="18px"
                        width="20px"
                        containerRef={this.sortDropDownButtonRef}
                        active={this.state.showSortDropDown}
                    />
                    <Icon
                        filePath={icons.copy}
                        onClick={async () => {
                            await this.setState({
                                showAllNotesCopyPaster: true,
                            })
                            this.setPopoutsActive()
                        }}
                        height="18px"
                        width="20px"
                        containerRef={this.copyButtonRef}
                        active={this.state.showAllNotesCopyPaster}
                    />
                    <Icon
                        filePath={icons.multiEdit}
                        onClick={async () => {
                            await this.setState({
                                showAllNotesShareMenu: true,
                            })
                            this.setPopoutsActive()
                        }}
                        active={this.state.showAllNotesShareMenu}
                        height="18px"
                        width="20px"
                        containerRef={this.bulkEditButtonRef}
                    />
                </TopBarActionBtns>
            </>
        )
    }

    renderPageShareModal() {
        if (!this.state.showPageSpacePicker) {
            return
        }
        return (
            <PopoutBox
                targetElementRef={this.pageShareButtonRef.current}
                placement={'bottom-end'}
                closeComponent={() =>
                    this.setState({
                        showPageSpacePicker: !this.state.showPageSpacePicker,
                    })
                }
                offsetX={10}
            >
                TOOD: Space picker goes here!
            </PopoutBox>
        )
    }

    render() {
        return (
            <ResultBodyContainer sidebarContext={this.props.sidebarContext}>
                <TopBar sidebarContext={this.props.sidebarContext}>
                    <>
                        {this.renderTopBarSwitcher()}
                        {/* {this.renderSharePageButton()} */}
                        {/* {this.props.sidebarActions()} */}
                    </>
                </TopBar>
                {this.renderPageShareModal()}
                {this.renderResultsBody()}
            </ResultBodyContainer>
        )
    }
}

export default AnnotationsSidebar

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
    margin-top: -5px;
    margin-bottom: 5px;
`

const ActionButtons = styled.div`
    display: none;
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
    display: flex;
    justify-content: center;
    position: absolute;
    height: 12px;
    width: 12px;
    align-items: center;
    right: 0px;
    margin-top: -20px;
`

const PageActivityIndicator = styled(Margin)<{ active: boolean }>`
    font-weight: bold;
    border-radius: 30px;
    background-color: ${(props) => props.theme.colors.purple};
    width: 12px;
    height: 12px;
    font-size: 12px;
    display: flex;
`

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: ${(props) =>
        props.sidebarContext === 'dashboard' ? '40px' : '32px'};

    background: ${(props) => props.theme.colors.backgroundColor};
    z-index: 11300;
    padding: 10px 10px 10px 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.darkhover};
`

const TopBarContainer = styled.div`
    display: flex;
    grid-gap: 4px;
    align-items: center;
`
const EmptyMessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px 5px;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    width: fill-available;
`

const openAnimation = keyframes`
 0% { padding-bottom: 100px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const AnnotationBox = styled.div<{
    isActive: boolean
    zIndex: number
    order: number
}>`
    width: 99%;
    z-index: ${(props) => props.zIndex};

    animation-name: ${openAnimation};
    animation-delay: ${(props) => props.order * 30}ms;
    animation-duration: 0.1s;
    animation-timing-function: ease-in-out;
    animation-fill-mode: backwards;
    position: relative;
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
    align-items: center;
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
    height: 32px;
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
    padding: 0 10px;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
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

    border-right: 1px solid ${(props) => props.theme.colors.lightHover};
    scrollbar-width: none;

    ${(props) =>
        props.sidebarContext === 'dashboard' &&
        css`
            border-left: 'unset';
        `};
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: fill-available;
    border: none;
    border-radius: 10px;
`
