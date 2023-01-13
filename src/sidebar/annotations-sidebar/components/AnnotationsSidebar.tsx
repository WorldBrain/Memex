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
import type { ListDetailsGetter } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import type { AnnotationCardInstanceLocation, SidebarTheme } from '../types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type {
    ListInstance,
    SidebarContainerState,
    SidebarTab,
} from '../containers/types'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import Margin from 'src/dashboard-refactor/components/Margin'
import { SortingDropdownMenuBtn } from '../components/SortingDropdownMenu'
import * as icons from 'src/common-ui/components/design-library/icons'
import AllNotesShareMenu from 'src/overview/sharing/AllNotesShareMenu'
import { PageNotesCopyPaster } from 'src/copy-paster'
import type { AnnotationSharingStates } from 'src/content-sharing/background/types'
import { getLocalStorage } from 'src/util/storage'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import type {
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import * as cacheUtils from 'src/annotations/cache/utils'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { generateAnnotationCardInstanceId } from '../containers/utils'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'

const SHOW_ISOLATED_VIEW_KEY = `show-isolated-view-notif`

type Refs = { [unifiedListId: string]: React.RefObject<HTMLDivElement> }

export interface AnnotationsSidebarProps extends SidebarContainerState {
    annotationsCache: PageAnnotationsCacheInterface
    currentUser?: UserReference
    // sidebarActions: () => void

    setActiveAnnotation: (
        annotationId: UnifiedAnnotation['unifiedId'],
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
        instanceLocation: AnnotationCardInstanceLocation,
    ) => (id: string) => JSX.Element
    shareButtonRef: React.RefObject<HTMLDivElement>
    spacePickerButtonRef: React.RefObject<HTMLDivElement>
    activeShareMenuNoteId: string
    renderShareMenuForAnnotation: (
        instanceLocation: AnnotationCardInstanceLocation,
    ) => (id: string) => JSX.Element
    renderListsPickerForAnnotation: (
        instanceLocation: AnnotationCardInstanceLocation,
    ) => (
        id: string,
        referenceElement?: React.RefObject<HTMLDivElement>,
    ) => JSX.Element

    setActiveTab: (tab: SidebarTab) => React.MouseEventHandler
    expandFollowedListNotes: (listId: string) => void

    bindAnnotationFooterEventProps: (
        annotation: Pick<UnifiedAnnotation, 'unifiedId' | 'body'>,
        instanceLocation: AnnotationCardInstanceLocation,
    ) => AnnotationFooterEventProps & {
        onGoToAnnotation?: React.MouseEventHandler
    }
    bindAnnotationEditProps: (
        annotation: Pick<UnifiedAnnotation, 'unifiedId' | 'body'>,
        instanceLocation: AnnotationCardInstanceLocation,
    ) => AnnotationEditGeneralProps & AnnotationEditEventProps
    annotationCreateProps: Omit<AnnotationCreateProps, 'onSave'> & {
        onSave: (
            shouldShare: boolean,
            isProtected: boolean,
            listInstanceId?: UnifiedList['unifiedId'],
        ) => Promise<void>
    }

    sharingAccess: AnnotationSharingAccess
    isDataLoading: boolean
    theme: Partial<SidebarTheme>
    openCollectionPage: (remoteListId: string) => void
    onShareAllNotesClick: () => void
    onCopyBtnClick: () => void
    onMenuItemClick: (sortingFn) => void

    onUnifiedListSelect: (unifiedListId: UnifiedList['unifiedId']) => void
    onLocalListSelect: (localListId: number) => void
    onResetSpaceSelect: () => void

    copyPaster: any
    normalizedPageUrls: string[]
    normalizedPageUrl?: string
    getLocalAnnotationIds: () => string[]
    contentSharing: ContentSharingInterface
    annotationsShareAll: any
    copyPageLink: any
    postBulkShareHook: (shareState: AnnotationSharingStates) => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'

    //postShareHook: (shareInfo) => void
    //postShareHook: (shareInfo) => void+
    setPopoutsActive: (popoutsOpen: boolean) => void
    getYoutubePlayer?(): YoutubePlayer
    clickFeedActivityIndicator?: () => void
    hasFeedActivity?: boolean
    // editableProps: EditableItemProps
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
    showSpaceSharePopout?: UnifiedList['unifiedId']
    linkCopyState: boolean
    othersOrOwnAnnotationsState: {
        [unifiedId: string]: 'othersAnnotations' | 'ownAnnotations'
    }
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
    private spaceShareButtonRef: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}

    state: AnnotationsSidebarState = {
        searchText: '',
        showIsolatedViewNotif: false,
        isMarkdownHelpShown: false,
        showAllNotesCopyPaster: false,
        showAllNotesShareMenu: false,
        showPageSpacePicker: false,
        showSortDropDown: false,
        linkCopyState: false,
        othersOrOwnAnnotationsState: {},
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

    private renderCopyPasterManager(localAnnotationIds: string[]) {
        if (!this.state.showAllNotesCopyPaster) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.copyButtonRef.current}
                placement={'bottom-end'}
                offsetX={5}
                offsetY={5}
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
                    annotationUrls={localAnnotationIds}
                    normalizedPageUrls={this.props.normalizedPageUrls}
                />
            </PopoutBox>
        )
    }

    private renderAllNotesCopyPaster() {
        const localAnnotationIds = this.props.getLocalAnnotationIds()

        return this.renderCopyPasterManager(localAnnotationIds)
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
                offsetY={5}
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

    private renderNewAnnotation(
        toggledListInstanceId?: UnifiedList['unifiedId'],
    ) {
        return (
            <NewAnnotationSection>
                <AnnotationCreate
                    {...this.props.annotationCreateProps}
                    onSave={(shouldShare, isProtected) =>
                        this.props.annotationCreateProps.onSave(
                            shouldShare,
                            isProtected,
                            toggledListInstanceId,
                        )
                    }
                    ref={this.annotationCreateRef as any}
                    getYoutubePlayer={this.props.getYoutubePlayer}
                />
            </NewAnnotationSection>
        )
    }

    private renderLoader = (key?: string, size?: number) => (
        <LoadingIndicatorContainer key={key}>
            <LoadingIndicatorStyled size={size ? size : undefined} />
        </LoadingIndicatorContainer>
    )

    private renderListAnnotations(
        unifiedListId: UnifiedList['unifiedId'],
        selectedListMode: boolean = false,
    ) {
        const listData = this.props.lists.byId[unifiedListId]
        const listInstance = this.props.listInstances[unifiedListId]

        // TODO: Simplify this confusing condition
        if (
            !(listInstance.isOpen || selectedListMode) ||
            (listData.hasRemoteAnnotations &&
                listInstance.annotationsLoadState === 'pristine')
        ) {
            return null
        }

        if (!listInstance || listInstance.annotationsLoadState === 'running') {
            return this.renderLoader()
        }

        if (listInstance.annotationsLoadState === 'error') {
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

        let annotationsData = listData.unifiedAnnotationIds
            .map(
                (unifiedAnnotId) => this.props.annotations.byId[unifiedAnnotId],
            )
            .filter((a) => !!a)

        let othersCounter = annotationsData.filter((annotation) => {
            return annotation.creator?.id !== this.props.currentUser?.id
        }).length
        let ownCounter = annotationsData.filter((annotation) => {
            return annotation.creator?.id === this.props.currentUser?.id
        }).length

        if (
            (this.state.othersOrOwnAnnotationsState[unifiedListId] ??
                'othersAnnotations') === 'othersAnnotations'
        ) {
            annotationsData = annotationsData.filter((annotation) => {
                return annotation.creator?.id !== this.props.currentUser?.id
            })
        }

        if (
            this.state.othersOrOwnAnnotationsState[unifiedListId] ===
            'ownAnnotations'
        ) {
            annotationsData = annotationsData.filter((annotation) => {
                return annotation.creator?.id === this.props.currentUser?.id
            })
        }

        let listAnnotations: JSX.Element | JSX.Element[]
        if (!annotationsData.length) {
            listAnnotations = (
                <EmptyMessageContainer>
                    <IconBox heightAndWidth="40px">
                        <Icon
                            filePath={icons.commentAdd}
                            heightAndWidth="20px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <InfoText>
                        No notes exist in this Space for this page.
                    </InfoText>
                </EmptyMessageContainer>
            )
        } else {
            listAnnotations = annotationsData.map((annotation) => {
                const annotationCardId = generateAnnotationCardInstanceId(
                    annotation,
                    listData.unifiedId,
                )

                // Only afford conversation logic if list is shared
                const conversation =
                    listData.remoteId != null
                        ? this.props.conversations[annotationCardId]
                        : null

                const annotationCard = this.props.annotationCardInstances[
                    annotationCardId
                ]
                const sharedAnnotationRef: SharedAnnotationReference = {
                    id: annotation.remoteId,
                    type: 'shared-annotation-reference',
                }
                const eventHandlers = this.props.bindSharedAnnotationEventHandlers(
                    sharedAnnotationRef,
                    {
                        type: 'shared-list-reference',
                        id: listData.remoteId,
                    },
                )
                const hasReplies =
                    conversation?.thread != null ||
                    conversation?.replies.length > 0

                // If annot is owned by the current user (locally available), we allow a whole bunch of other functionality
                const ownAnnotationProps: Partial<AnnotationEditableProps> = {}
                if (annotation.localId != null) {
                    ownAnnotationProps.isBulkShareProtected = [
                        AnnotationPrivacyLevels.PROTECTED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(annotation.privacyLevel)
                    ownAnnotationProps.unifiedId = annotation.unifiedId
                    ownAnnotationProps.lists = cacheUtils.getLocalListIdsForCacheIds(
                        this.props.annotationsCache,
                        annotation.unifiedListIds,
                    )
                    ownAnnotationProps.comment = annotation.comment
                    ownAnnotationProps.isShared = [
                        AnnotationPrivacyLevels.SHARED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(annotation.privacyLevel)
                    ownAnnotationProps.appendRepliesToggle =
                        listData.remoteId != null
                    ownAnnotationProps.lastEdited = annotation.lastEdited
                    ownAnnotationProps.isEditing =
                        annotationCard.isCommentEditing
                    ownAnnotationProps.isDeleting =
                        annotationCard.cardMode === 'delete-confirm'
                    const editDeps = this.props.bindAnnotationEditProps(
                        annotation,
                        unifiedListId,
                    )
                    const footerDeps = this.props.bindAnnotationFooterEventProps(
                        annotation,
                        unifiedListId,
                    )
                    ownAnnotationProps.annotationEditDependencies = editDeps
                    ownAnnotationProps.annotationFooterDependencies = footerDeps
                    ownAnnotationProps.renderListsPickerForAnnotation = this.props.renderListsPickerForAnnotation(
                        unifiedListId,
                    )
                    ownAnnotationProps.renderCopyPasterForAnnotation = this.props.renderCopyPasterForAnnotation(
                        unifiedListId,
                    )
                    ownAnnotationProps.renderShareMenuForAnnotation = this.props.renderShareMenuForAnnotation(
                        unifiedListId,
                    )
                    ownAnnotationProps.initShowSpacePicker =
                        annotationCard.cardMode === 'space-picker'
                            ? 'footer'
                            : 'hide'
                }
                return (
                    <React.Fragment key={annotation.unifiedId}>
                        <AnnotationEditable
                            creatorId={annotation.creator?.id}
                            currentUserId={this.props.currentUser?.id}
                            pageUrl={this.props.normalizedPageUrl}
                            isShared
                            isBulkShareProtected
                            unifiedId={annotation.unifiedId}
                            body={annotation.body}
                            comment={annotation.comment}
                            lastEdited={annotation.lastEdited}
                            createdWhen={annotation.createdWhen}
                            creatorDependencies={
                                annotation.localId != null ||
                                annotation.creator == null
                                    ? null
                                    : this.props.users[annotation.creator.id]
                            }
                            isActive={
                                this.props.activeAnnotationId ===
                                annotation.unifiedId
                            }
                            activeShareMenuNoteId={
                                this.props.activeShareMenuNoteId
                            }
                            onReplyBtnClick={eventHandlers.onReplyBtnClick}
                            onHighlightClick={this.props.setActiveAnnotation(
                                annotation.unifiedId,
                            )}
                            onListClick={this.props.onLocalListSelect}
                            isClickable={
                                this.props.theme.canClickAnnotations &&
                                annotation.body?.length > 0
                            }
                            repliesLoadingState={
                                listInstance.conversationsLoadState
                            }
                            hasReplies={hasReplies}
                            getListDetailsById={this.props.getListDetailsById}
                            {...ownAnnotationProps}
                            shareButtonRef={this.props.shareButtonRef}
                            spacePickerButtonRef={
                                this.props.spacePickerButtonRef
                            }
                            getYoutubePlayer={this.props.getYoutubePlayer}
                            contextLocation={this.props.sidebarContext}
                        />
                        {listData.remoteId != null &&
                            annotation.remoteId != null && (
                                <ConversationReplies
                                    newReplyEventHandlers={eventHandlers}
                                    conversation={conversation}
                                    hasReplies={hasReplies}
                                    annotation={{
                                        body: annotation.body,
                                        linkId: annotation.unifiedId,
                                        comment: annotation.comment,
                                        createdWhen: annotation.createdWhen,
                                        reference: sharedAnnotationRef,
                                    }}
                                    getYoutubePlayer={
                                        this.props.getYoutubePlayer
                                    }
                                />
                            )}
                    </React.Fragment>
                )
            })
        }

        return (
            <FollowedNotesContainer>
                {(this.spaceOwnershipStatus(listData) === 'Contributor' ||
                    this.spaceOwnershipStatus(listData) === 'Creator') && (
                    <NewAnnotationBoxMyAnnotations>
                        {this.renderNewAnnotation(
                            !selectedListMode ? unifiedListId : undefined,
                        )}
                    </NewAnnotationBoxMyAnnotations>
                )}
                <RemoteOrLocalSwitcherContainer>
                    <PrimaryAction
                        size={'small'}
                        active={
                            this.state.othersOrOwnAnnotationsState[
                                unifiedListId
                            ] === 'othersAnnotations' ||
                            this.state.othersOrOwnAnnotationsState[
                                unifiedListId
                            ] == null
                        }
                        label={
                            <SwitcherButtonContent>
                                Others
                                <SwitcherCounter>
                                    {othersCounter}
                                </SwitcherCounter>
                            </SwitcherButtonContent>
                        }
                        type={'tertiary'}
                        onClick={() => {
                            this.setState({
                                othersOrOwnAnnotationsState: {
                                    ...this.state.othersOrOwnAnnotationsState,
                                    [unifiedListId]: 'othersAnnotations',
                                },
                            })
                        }}
                    />
                    <PrimaryAction
                        size={'small'}
                        active={
                            this.state.othersOrOwnAnnotationsState[
                                unifiedListId
                            ] === 'ownAnnotations'
                        }
                        label={
                            <SwitcherButtonContent>
                                Yours
                                <SwitcherCounter>{ownCounter}</SwitcherCounter>
                            </SwitcherButtonContent>
                        }
                        type={'tertiary'}
                        onClick={() => {
                            this.setState({
                                othersOrOwnAnnotationsState: {
                                    ...this.state.othersOrOwnAnnotationsState,
                                    [unifiedListId]: 'ownAnnotations',
                                },
                            })
                        }}
                    />
                </RemoteOrLocalSwitcherContainer>
                {listAnnotations}
            </FollowedNotesContainer>
        )
    }

    private renderSpacesItem(
        listData: UnifiedList,
        listInstance: ListInstance,
        othersAnnotsCount: number,
    ) {
        return (
            <FollowedListNotesContainer
                bottom={listInstance.isOpen ? '0px' : '0px'}
                key={listData.unifiedId}
                top="0px"
            >
                <FollowedListRow
                    onClick={() =>
                        this.props.onUnifiedListSelect(listData.unifiedId)
                    }
                    title={listData.name}
                >
                    <FollowedListTitleContainer>
                        <Icon
                            icon={icons.arrowRight}
                            heightAndWidth="20px"
                            rotation={listInstance.isOpen && 90}
                            onClick={(e) => {
                                e.stopPropagation()
                                this.props.expandFollowedListNotes(
                                    listData.unifiedId,
                                )
                            }}
                        />
                        <FollowedListTitle>{listData.name}</FollowedListTitle>
                    </FollowedListTitleContainer>
                    <ButtonContainer>
                        <ActionButtons>
                            <TooltipBox
                                tooltipText="Go to Space"
                                placement="bottom"
                            >
                                <Icon
                                    icon="goTo"
                                    height="20px"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        this.props.openCollectionPage(
                                            listData.remoteId,
                                        )
                                    }}
                                />
                            </TooltipBox>
                        </ActionButtons>
                        {listData.creator?.id === this.props.currentUser?.id &&
                        listData.remoteId != null ? (
                            <TooltipBox
                                tooltipText="Space is Shared"
                                placement="bottom"
                            >
                                <Icon
                                    filePath="peopleFine"
                                    heightAndWidth="20px"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        this.setState({
                                            showSpaceSharePopout:
                                                listData.unifiedId,
                                        })
                                    }}
                                    containerRef={
                                        this.spaceShareButtonRef[
                                            listData.unifiedId
                                        ]
                                    }
                                />
                            </TooltipBox>
                        ) : undefined}
                        {listData.creator?.id === this.props.currentUser?.id &&
                        listData.remoteId == null ? (
                            <TooltipBox
                                tooltipText="Share Space"
                                placement="bottom"
                            >
                                <Icon
                                    icon="link"
                                    height="20px"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        this.setState({
                                            showSpaceSharePopout:
                                                listData.unifiedId,
                                        })
                                    }}
                                    containerRef={
                                        this.spaceShareButtonRef[
                                            listData.unifiedId
                                        ]
                                    }
                                />
                            </TooltipBox>
                        ) : undefined}
                        {listInstance.annotationRefsLoadState !== 'success' &&
                        listData.hasRemoteAnnotations ? (
                            this.renderLoader(undefined, 20)
                        ) : (
                            <FollowedListNoteCount active left="5px">
                                <TooltipBox
                                    tooltipText={'Annotations by Others'}
                                    placement={'bottom-end'}
                                >
                                    <OthersAnnotationCounter>
                                        {othersAnnotsCount}
                                    </OthersAnnotationCounter>
                                </TooltipBox>
                                <TooltipBox
                                    tooltipText={'Total Annotations'}
                                    placement={'bottom-end'}
                                >
                                    <TotalAnnotationsCounter>
                                        /
                                        {listData.hasRemoteAnnotations
                                            ? listInstance
                                                  .sharedAnnotationReferences
                                                  ?.length ?? 0
                                            : listData.unifiedAnnotationIds
                                                  .length}
                                    </TotalAnnotationsCounter>
                                </TooltipBox>
                            </FollowedListNoteCount>
                        )}
                    </ButtonContainer>
                </FollowedListRow>
                {this.renderListAnnotations(listData.unifiedId)}
                {this.renderShowShareSpacePopout(
                    listData,
                    this.spaceShareButtonRef[listData.unifiedId],
                )}
            </FollowedListNotesContainer>
        )
    }

    getBaseUrl() {
        if (process.env.NODE_ENV === 'production') {
            return `https://memex.social`
        }
        if (process.env.USE_FIREBASE_EMULATOR === 'true') {
            return 'http://localhost:3000'
        }
        return `https://staging.memex.social`
    }

    private renderShowShareSpacePopout(
        listData: UnifiedList,
        ref: React.RefObject<any>,
    ) {
        if (
            !this.state.showSpaceSharePopout ||
            this.state.showSpaceSharePopout !== listData.unifiedId
        ) {
            return
        }

        if (this.spaceOwnershipStatus(listData) === 'Creator') {
            return (
                <PopoutBox
                    placement="bottom"
                    closeComponent={() => {
                        this.setState({
                            showSpaceSharePopout: undefined,
                        })
                    }}
                    strategy={'fixed'}
                    targetElementRef={ref.current}
                >
                    TEsting this
                    {/* <SpaceContextMenu
                        {...this.props}
                        {...this.state}
                        contentSharingBG={this.props.contentSharing}
                        spacesBG={collections}
                        spaceName={listData.name}
                        localListId={listData.localId}
                        remoteListId={listData.remoteId}
                        editableProps={this.props.editableProps!}
                        // ownershipStatus={this.spaceOwnershipStatus(listData)}
                        // isMenuDisplayed={this.state.showSpaceSharePopout}
                        // onDeleteSpaceIntent={
                        //     this.props.onDeleteClick
                        // }
                        // onSpaceShare={onSpaceShare}
                        // cancelSpaceNameEdit={this.props.cancelSpaceNameEdit()}
                    /> */}
                </PopoutBox>
            )
        }
        if (
            this.spaceOwnershipStatus(listData) === 'Follower' ||
            this.spaceOwnershipStatus(listData) === 'Contributor'
        ) {
            return (
                <PopoutBox
                    placement="bottom"
                    closeComponent={() => {
                        this.setState({
                            showSpaceSharePopout: undefined,
                        })
                    }}
                    strategy={'fixed'}
                    targetElementRef={ref.current}
                >
                    <CopyBox>
                        <LinkFrame>
                            {!this.state.linkCopyState
                                ? (
                                      this.getBaseUrl() +
                                      `/c/${listData.remoteId}`
                                  ).replace('https://', '')
                                : 'Copied to clipboard'}
                        </LinkFrame>
                        <PrimaryAction
                            type={'primary'}
                            size={'medium'}
                            label={'copy'}
                            onClick={() => {
                                this.setState({
                                    linkCopyState: true,
                                })
                                setTimeout(() => {
                                    this.setState({
                                        linkCopyState: false,
                                    })
                                }, 2000)
                                navigator.clipboard.writeText(
                                    this.getBaseUrl() +
                                        `/c/${listData.remoteId}`,
                                )
                            }}
                            icon={!this.state.linkCopyState ? 'copy' : 'check'}
                        />
                    </CopyBox>
                </PopoutBox>
            )
        }
    }

    private renderSharedNotesByList() {
        const { lists, listInstances } = this.props
        let allLists: UnifiedList[] = []

        lists.allIds.forEach((unifiedListId) => {
            if (
                lists.byId[unifiedListId].unifiedAnnotationIds.length > 0 ||
                lists.byId[unifiedListId].hasRemoteAnnotations
            ) {
                allLists.push(lists.byId[unifiedListId])
            }
        })

        if (allLists.length > 0) {
            let mySpaces = allLists.filter(
                (list) => this.spaceOwnershipStatus(list) === 'Creator',
            )

            let followedSpaces = allLists.filter(
                (list) => this.spaceOwnershipStatus(list) === 'Follower',
            )

            let joinedSpaces = allLists.filter(
                (list) => this.spaceOwnershipStatus(list) === 'Contributor',
            )

            return (
                <>
                    <SpaceTypeSection>
                        <SpaceTypeSectionHeader>
                            My Spaces{' '}
                            <SpacesCounter>{mySpaces.length}</SpacesCounter>
                        </SpaceTypeSectionHeader>
                        {mySpaces.length > 0 ? (
                            <SpaceTypeSectionContainer>
                                {mySpaces.map((listData) => {
                                    let othersAnnotsCount = 0
                                    const listInstance =
                                        listInstances[listData.unifiedId]

                                    this.spaceShareButtonRef[
                                        listData.unifiedId
                                    ] = React.createRef<HTMLDivElement>()

                                    return this.renderSpacesItem(
                                        listData,
                                        listInstance,
                                        othersAnnotsCount,
                                    )
                                })}
                            </SpaceTypeSectionContainer>
                        ) : undefined}
                    </SpaceTypeSection>

                    <SpaceTypeSection>
                        <SpaceTypeSectionHeader>
                            Followed Spaces{' '}
                            <SpacesCounter>
                                {followedSpaces.length}
                            </SpacesCounter>
                        </SpaceTypeSectionHeader>
                        {followedSpaces.length > 0 ? (
                            <SpaceTypeSectionContainer>
                                {followedSpaces.map((listData) => {
                                    let othersAnnotsCount = 0
                                    const listInstance =
                                        listInstances[listData.unifiedId]

                                    return this.renderSpacesItem(
                                        listData,
                                        listInstance,
                                        othersAnnotsCount,
                                    )
                                })}
                            </SpaceTypeSectionContainer>
                        ) : undefined}
                    </SpaceTypeSection>

                    <SpaceTypeSection>
                        <SpaceTypeSectionHeader>
                            Joined Spaces{' '}
                            <SpacesCounter>{joinedSpaces.length}</SpacesCounter>
                        </SpaceTypeSectionHeader>
                        {joinedSpaces.length > 0 ? (
                            <SpaceTypeSectionContainer>
                                {joinedSpaces.map((listData) => {
                                    let othersAnnotsCount = 0
                                    const listInstance =
                                        listInstances[listData.unifiedId]

                                    return this.renderSpacesItem(
                                        listData,
                                        listInstance,
                                        othersAnnotsCount,
                                    )
                                })}
                            </SpaceTypeSectionContainer>
                        ) : undefined}
                    </SpaceTypeSection>
                </>
            )
        } else {
            return (
                <EmptyMessageContainer>
                    <IconBox heightAndWidth="40px">
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="20px"
                            color="prime1"
                            hoverOff
                        />
                    </IconBox>
                    <InfoText>
                        This page is not yet in a Space <br /> you created,
                        follow or collaborate in.
                    </InfoText>
                </EmptyMessageContainer>
            )
        }
    }

    // TODO: properly derive this
    // for (const { id } of listInstance.sharedAnnotationReferences ?? []) {
    //     if (
    //         this.props.__annotations[id]?.creatorId !==
    //         this.props.currentUser?.id
    //     ) {
    //         othersAnnotsCount++
    //     }
    // }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    private throwNoSelectedListError() {
        throw new Error(
            'Isolated view specific render method called when state not set',
        )
    }

    private renderFeed() {
        return (
            <AnnotationsSectionStyled>
                <FeedFrame src={this.whichFeed()} />
            </AnnotationsSectionStyled>
        )
    }

    private renderAnnotationsEditableForSelectedList() {
        const { listInstances, selectedListId } = this.props
        if (selectedListId == null) {
            this.throwNoSelectedListError()
        }
        const listData = this.props.lists.byId[selectedListId]
        const listInstance = listInstances[selectedListId]

        if (
            listData.remoteId != null &&
            listInstance.annotationsLoadState === 'running'
        ) {
            return this.renderLoader()
        }
        return this.renderListAnnotations(selectedListId, true)
    }

    private renderResultsBody() {
        const selectedList = this.props.annotationsCache.lists.byId[
            this.props.selectedListId
        ]

        if (this.props.activeTab === 'feed') {
            return this.renderFeed()
        }

        if (
            this.props.isDataLoading ||
            this.props.foreignSelectedListLoadState === 'running'
        ) {
            return this.renderLoader()
        }

        if (
            this.props.selectedListId &&
            this.props.activeTab !== 'annotations'
        ) {
            return (
                <>
                    {this.renderSelectedListTopBar()}
                    <AnnotationsSectionStyled>
                        {this.renderAnnotationsEditableForSelectedList()}
                    </AnnotationsSectionStyled>
                </>
            )
        }

        return (
            <>
                {this.props.activeTab === 'annotations' ? (
                    <AnnotationsSectionStyled>
                        {this.renderAnnotationsEditable(
                            cacheUtils.getUserAnnotationsArray(
                                { annotations: this.props.annotations },
                                this.props.currentUser?.id.toString(),
                            ),
                        )}
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
            </>
        )
    }

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

    private renderAnnotationsEditable(annotations: UnifiedAnnotation[]) {
        const annots: JSX.Element[] = []

        if (this.props.noteCreateState === 'running') {
            annots.push(
                <LoaderBox>{this.renderLoader('new-note-spinner')}</LoaderBox>,
            )
        }

        annots.push(
            ...annotations.map((annot, i) => {
                const instanceId = generateAnnotationCardInstanceId(annot)
                const instanceState = this.props.annotationCardInstances[
                    instanceId
                ]
                if (!instanceState) {
                    console.warn(
                        'AnnotationsSidebar rendering: Could not find annotation instance state associated with ID:',
                        instanceId,
                    )
                    return null
                }

                const footerDeps = this.props.bindAnnotationFooterEventProps(
                    annot,
                    'annotations-tab',
                )
                const ref = React.createRef<_AnnotationEditable>()
                this.annotationEditRefs[annot.unifiedId] = ref
                const isShared =
                    annot.privacyLevel >= AnnotationPrivacyLevels.SHARED
                return (
                    <AnnotationBox
                        key={annot.unifiedId}
                        isActive={
                            this.props.activeAnnotationId === annot.unifiedId
                        }
                        zIndex={
                            this.props.activeShareMenuNoteId === annot.unifiedId
                                ? 10000
                                : this.props.annotations.allIds.length - i
                        }
                        className={'AnnotationBox'}
                        id={annot.unifiedId}
                        order={i}
                    >
                        <AnnotationEditable
                            {...annot}
                            {...this.props}
                            creatorId={annot.creator?.id}
                            currentUserId={this.props.currentUser?.id}
                            lists={cacheUtils.getLocalListIdsForCacheIds(
                                this.props.annotationsCache,
                                annot.unifiedListIds,
                            )}
                            contextLocation={this.props.sidebarContext}
                            pageUrl={this.props.normalizedPageUrl}
                            body={annot.body}
                            comment={annot.comment}
                            isShared={isShared}
                            createdWhen={annot.createdWhen}
                            isBulkShareProtected={[
                                AnnotationPrivacyLevels.PROTECTED,
                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                            ].includes(annot.privacyLevel)}
                            isEditing={instanceState.isCommentEditing}
                            isDeleting={
                                instanceState.cardMode === 'delete-confirm'
                            }
                            isActive={
                                this.props.activeAnnotationId ===
                                annot.unifiedId
                            }
                            onListClick={this.props.onLocalListSelect}
                            onHighlightClick={this.props.setActiveAnnotation(
                                annot.unifiedId,
                            )}
                            onGoToAnnotation={footerDeps.onGoToAnnotation}
                            annotationEditDependencies={this.props.bindAnnotationEditProps(
                                annot,
                                'annotations-tab',
                            )}
                            annotationFooterDependencies={footerDeps}
                            isClickable={
                                this.props.theme.canClickAnnotations &&
                                annot.body?.length > 0
                            }
                            passDownRef={ref}
                            shareButtonRef={this.props.shareButtonRef}
                            initShowSpacePicker={
                                instanceState.cardMode === 'space-picker'
                                    ? 'footer'
                                    : 'hide'
                            }
                            renderShareMenuForAnnotation={this.props.renderShareMenuForAnnotation(
                                'annotations-tab',
                            )}
                            renderCopyPasterForAnnotation={this.props.renderCopyPasterForAnnotation(
                                'annotations-tab',
                            )}
                            renderListsPickerForAnnotation={this.props.renderListsPickerForAnnotation(
                                'annotations-tab',
                            )}
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
                bottom={this.props.activeTab === 'annotations' ? '00px' : '0px'}
            >
                {(this.props.activeTab === 'annotations' ||
                    this.props.selectedListId) && (
                    <>
                        <TopAreaContainer>
                            <NewAnnotationBoxMyAnnotations>
                                {this.renderNewAnnotation()}
                            </NewAnnotationBoxMyAnnotations>
                            {annots.length > 1 && (
                                <AnnotationActions>
                                    {this.renderTopBarActionButtons()}
                                </AnnotationActions>
                            )}
                        </TopAreaContainer>
                        {this.props.noteCreateState === 'running' ||
                        annotations.length > 0 ? (
                            <AnnotationContainer>{annots}</AnnotationContainer>
                        ) : (
                            <EmptyMessageContainer>
                                <IconBox heightAndWidth="40px">
                                    <Icon
                                        filePath={icons.commentAdd}
                                        heightAndWidth="20px"
                                        color="prime1"
                                        hoverOff
                                    />
                                </IconBox>
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

    private onFeedClick() {
        this.props.clickFeedActivityIndicator()
        this.props.setActiveTab('feed')
    }

    private renderTopBarSwitcher() {
        return (
            <TopBarContainer>
                <PrimaryAction
                    onClick={this.props.setActiveTab('annotations')}
                    label={'My Annotations'}
                    active={this.props.activeTab === 'annotations'}
                    type={'tertiary'}
                    size={'medium'}
                    padding={'0px 6px'}
                />
                <PrimaryAction
                    onClick={this.props.setActiveTab('spaces')}
                    label={'Spaces'}
                    active={this.props.activeTab === 'spaces'}
                    type={'tertiary'}
                    size={'medium'}
                    iconPosition={'right'}
                    padding={'0px 6px'}
                    icon={
                        this.props.cacheLoadState === 'running' ||
                        this.props.cacheLoadState === 'pristine' ? (
                            <LoadingBox>
                                <LoadingIndicator size={10} />{' '}
                            </LoadingBox>
                        ) : this.props.pageHasNetworkAnnotations ? (
                            <LoadingBox>
                                <PageActivityIndicator active />
                            </LoadingBox>
                        ) : (
                            <LoadingBox>
                                <PageActivityIndicator active={false} />
                            </LoadingBox>
                        )
                    }
                />
                <PrimaryAction
                    onClick={(event) => {
                        this.props.setActiveTab('feed')(event)
                        this.props.clickFeedActivityIndicator()
                    }}
                    label={'Feed'}
                    active={this.props.activeTab === 'feed'}
                    type={'tertiary'}
                    size={'medium'}
                    iconPosition={'right'}
                    padding={'0px 6px'}
                    icon={
                        this.props.hasFeedActivity ? (
                            <>
                                <LoadingBox>
                                    <PageActivityIndicator active />
                                </LoadingBox>
                            </>
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

    private renderSelectedListTopBar() {
        const { selectedListId, annotationsCache } = this.props
        if (!selectedListId || !annotationsCache.lists.byId[selectedListId]) {
            this.throwNoSelectedListError()
        }

        const selectedList = annotationsCache.lists.byId[selectedListId]

        return (
            <IsolatedViewHeaderContainer>
                <IsolatedViewHeaderTopBar>
                    <PrimaryAction
                        icon="arrowLeft"
                        type="tertiary"
                        size="small"
                        label="All Spaces"
                        fontColor="greyScale6"
                        onClick={() => this.props.onResetSpaceSelect()}
                    />
                    {this.renderPermissionStatusButton()}
                </IsolatedViewHeaderTopBar>
                <SpaceTitle>{selectedList.name}</SpaceTitle>
                <SpaceDescription>{selectedList.description}</SpaceDescription>
                {/* {totalAnnotsCountJSX}
                {othersAnnotsCountJSX} */}
            </IsolatedViewHeaderContainer>
        )
    }

    private spaceOwnershipStatus(listData) {
        if (listData.remoteId != null && listData.localId == null) {
            return 'Follower'
        }

        if (listData.creator?.id === this.props.currentUser?.id) {
            return 'Creator'
        }

        if (
            listData.remoteId != null &&
            listData.localId != null &&
            listData.creator?.id !== this.props.currentUser?.id
        ) {
            return 'Contributor'
        }

        return undefined
    }

    private renderPermissionStatusButton() {
        const { selectedListId, annotationsCache, currentUser } = this.props
        if (!selectedListId || !annotationsCache.lists.byId[selectedListId]) {
            this.throwNoSelectedListError()
        }

        const selectedList = this.props.annotationsCache.lists.byId[
            this.props.selectedListId
        ]

        const permissionStatus = this.spaceOwnershipStatus(selectedList)

        if (permissionStatus === 'Follower') {
            return (
                <PermissionInfoButton
                    label="Follower"
                    type="secondary"
                    size="small"
                    icon="plus"
                >
                    <Icon
                        filePath="plusIcon"
                        color="greyScale5"
                        heightAndWidth="20px"
                        hoverOff
                    />
                    Follower
                </PermissionInfoButton>
            )
        }

        if (permissionStatus === 'Creator') {
            if (selectedList.remoteId == null) {
                return (
                    <PrimaryAction
                        type="tertiary"
                        size="small"
                        icon="link"
                        label={'Share Space'}
                        onClick={null}
                        fontColor={'greyScale5'}
                    />
                )
            } else {
                return (
                    <CreatorActionButtons>
                        <PrimaryAction
                            type="tertiary"
                            size="small"
                            icon="link"
                            label={'Share Space'}
                            onClick={null}
                            fontColor={'greyScale5'}
                        />
                        <PrimaryAction
                            type="forth"
                            size="small"
                            icon="personFine"
                            label={'Creator'}
                            onClick={null}
                            fontColor={'greyScale5'}
                        />
                    </CreatorActionButtons>
                )
            }
        }

        if (permissionStatus === 'Contributor') {
            return (
                <TooltipBox
                    tooltipText={
                        <span>
                            You can add pages & <br /> annotations to this Space
                        </span>
                    }
                    placement={'bottom-end'}
                >
                    <PermissionInfoButton
                        label="Contributor"
                        type="secondary"
                        size="small"
                        icon="plus"
                    >
                        <Icon
                            filePath="peopleFine"
                            color="greyScale5"
                            heightAndWidth="20px"
                            hoverOff
                        />
                        Contributor
                    </PermissionInfoButton>
                </TooltipBox>
            )
        }

        if (permissionStatus == null) {
            // Local-only spaces don't show a button
            return null
        }
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
                offsetY={5}
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
                    <TooltipBox tooltipText={'Sort Notes'} placement={'bottom'}>
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
                    </TooltipBox>
                    <TooltipBox
                        tooltipText={'Copy & Paste Note'}
                        placement={'bottom'}
                    >
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
                    </TooltipBox>
                    <TooltipBox
                        tooltipText={'Bulk Share Notes'}
                        placement={'bottom-end'}
                    >
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
                    </TooltipBox>
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
                    {this.renderTopBarSwitcher()}
                    {/* {this.renderSharePageButton()} */}
                    {/* {this.props.sidebarActions()} */}
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

const SwitcherButtonContent = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    justify-content: space-between;
    font-size: 12px;
`

const SwitcherCounter = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
`

const RemoteOrLocalSwitcherContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 2px;
    margin-top: 10px;
`

const CopyBox = styled.div`
    display: flex;
    align-items: center;
    height: fit-content;
    padding: 10px;
    grid-gap: 8px;
`
const LinkFrame = styled.div`
    display: flex;
    align-items: center;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    height: fill-available;
    padding: 0 10px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.white};
    width: 190px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`

const SpaceTypeSection = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;

    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    &:first-child {
        margin-top: -10px;
    }

    &:last-child {
        border-bottom: none;
    }
`

const SpaceTypeSectionHeader = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale4};
    font-weight: 300;
    font-size: 14px;
    padding: 30px 20px 30px 15px;
    flex-direction: row;
    letter-spacing: 1px;
`

const SpacesCounter = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    margin-left: 20px;
`

const SpaceTypeSectionContainer = styled.div<{ SpaceTypeSectionOpen: boolean }>`
    display: flex;
    flex-direction: column;
    width: fill-available;
    padding-bottom: 30px;
    margin-top: -20px;

    ${(props) =>
        props.SpaceTypeSectionOpen &&
        css`
            display: flex;
        `};
`

const CreatorActionButtons = styled.div`
    display: flex;
    align-items: center;
    flex-direction: flex-end;
    grid-gap: 5px;
`

const NewAnnotationBoxMyAnnotations = styled.div`
    display: flex;
    margin-bottom: 5px;
    margin-top: 5px;
`

const OthersAnnotationCounter = styled.div``
const TotalAnnotationsCounter = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale5};
    letter-spacing: 4px;
    display: flex;
    align-items: center;
`

const PermissionInfoButton = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-radius: 5px;
    padding: 2px 8px;
`

const SpaceTitle = styled.div`
    font-size: 22px;
    font-weight: 500;
    width: fill-available;
    color: ${(props) => props.theme.colors.white};
    letter-spacing: 1px;
`

const SpaceDescription = styled(Markdown)`
    font-size: 14px;
    font-weight: 300;
    width: fill-available;
    color: ${(props) => props.theme.colors.greyScale5};
    letter-spacing: 1px;
`

const TopAreaContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
`

const AnnotationActions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 5px 10px 0px 10px;
    width: fill-available;
    height: 20px;
`

const ActionButtons = styled.div`
    visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
`

const LoaderBox = styled.div`
    height: 100px;
    width: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
`

const Link = styled.span`
    color: ${(props) => props.theme.colors.prime1};
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
    background-color: ${(props) => props.theme.colors.prime1};
    width: 12px;
    height: 12px;
    font-size: 12px;
    display: flex;

    ${(props) =>
        !props.active &&
        css`
            background-color: transparent;
        `};
`

const TopBar = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: ${(props) =>
        props.sidebarContext === 'dashboard' ? '40px' : '32px'};

    background: ${(props) => props.theme.colors.black};
    z-index: 11300;
    padding: 10px 10px 10px 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
`

const IsolatedViewHeaderContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    padding: 10px 10px 0 15px;
    z-index: 20;
`

const IsolatedViewHeaderTopBar = styled.div`
    display: flex;
    align-items: center;
    height: 30px;
    margin: 0px 0px 0px -10px;
    justify-content: space-between;
    width: fill-available;
`

const TopBarContainer = styled.div`
    display: flex;
    grid-gap: 4px;
    align-items: center;
`
const EmptyMessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 5px;
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

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
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

const FollowedListNotesContainer = styled(Margin)<{ key: number }>`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
    z-index: ${(props) => 1000 - props.key};
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
    flex: 1;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const FollowedNotesContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-bottom: 60px;
    z-index: 30;
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
    color: ${(props) => props.theme.colors.white};
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
    color: ${(props) => props.theme.colors.greyScale5};
    text-align: center;
    font-size: 14px;
    line-height: 17px;
`

const FollowedListRow = styled(Margin)<{ key: number; context: string }>`
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
    z-index: 40;

    &:first-child {
        margin-top: 5px;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    }

    &:hover ${ActionButtons} {
        visibility: visible;
    }
`

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`

const FollowedListSectionTitle = styled(Margin)<{ active: boolean }>`
    font-size: 14px;
    color: ${(props) => props.theme.colors.white};
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
            background: ${(props) => props.theme.colors.greyScale3};
            cursor: default;

            &:hover {
                background: ${(props) => props.theme.colors.greyScale3};
            }
        `}

    ${(props) =>
        !props.active &&
        css`
            &:hover {
                background: ${(props) => props.theme.colors.greyScale3};
            }
        `}

    & * {
        cursor: pointer;
    }
`

// TODO: stop referring to these styled components as containers
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
    color: ${(props) => props.theme.colors.white};
    grid-gap: 5px;
    align-items: center;
    width: 100px;
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    display: block;
`
const FollowedListNoteCount = styled(Margin)<{ active: boolean }>`
    font-weight: bold;
    font-size: 16px;
    display: flex;
    color: ${(props) => props.theme.colors.white};
    grid-gap: 4px;
    align-items: center;
`

const CloseIconStyled = styled.div<{ background: string }>`
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100%;
    background-color: ${(props) =>
        props.background ? props.background : props.theme.colors.primary};
    mask-image: url(${icons.removeX});
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
    background: ${(props) => props.theme.colors.black};
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
    background: ${(props) => props.theme.colors.black};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: fill-available;
    z-index: 11200;
    margin-top: 5px;
`

const AnnotationsSectionStyled = styled.div`
    font-family: 'Satoshi', sans-serif;
    background: ${(props) => props.theme.colors.black};
    color: ${(props) => props.theme.colors.white};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
    flex: 1;
    overflow: scroll;
    padding: 5px 10px 0px 10px;

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

    border-right: 1px solid ${(props) => props.theme.colors.greyScale2};
    scrollbar-width: none;

    ${(props) =>
        props.sidebarContext === 'dashboard' &&
        css`
            border-right: 'unset';
            border-left: 'unset';
        `};
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: fill-available;
    border: none;
    border-radius: 10px;
`
