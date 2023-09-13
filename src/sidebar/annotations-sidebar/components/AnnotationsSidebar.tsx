import * as React from 'react'

import Waypoint from 'react-waypoint'
import styled, { css, keyframes } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    ConversationReplies,
    SharedProps as RepliesProps,
} from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
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
import type { ListDetailsGetter } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import type {
    AnnotationCardInstanceLocation,
    AnnotationsSidebarInPageEventEmitter,
    SidebarTheme,
} from '../types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type {
    AnnotationInstanceRefs,
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
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
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
import {
    generateAnnotationCardInstanceId,
    getOrCreateAnnotationInstanceRefs,
} from '../containers/utils'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import {
    getFeedUrl,
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { loadThemeVariant } from 'src/common-ui/components/design-library/theme'
import { ImageSupportInterface } from 'src/image-support/background/types'

const SHOW_ISOLATED_VIEW_KEY = `show-isolated-view-notif`

type Refs = { [unifiedListId: string]: React.RefObject<HTMLDivElement> }

export interface AnnotationsSidebarProps extends SidebarContainerState {
    annotationsCache: PageAnnotationsCacheInterface
    currentUser?: UserReference
    // sidebarActions: () => void

    setActiveAnnotation: (
        annotationId: UnifiedAnnotation['unifiedId'],
    ) => React.MouseEventHandler
    setSpacePickerAnnotationInstance: (
        state: SidebarContainerState['spacePickerAnnotationInstance'],
    ) => Promise<void>
    setShareMenuAnnotationInstance: (
        state: SidebarContainerState['shareMenuAnnotationInstanceId'],
    ) => Promise<void>
    setCopyPasterAnnotationInstance: (
        state: SidebarContainerState['copyPasterAnnotationInstanceId'],
    ) => Promise<void>
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
    annotationInstanceRefs: {
        [instanceId: string]: AnnotationInstanceRefs
    }
    activeShareMenuNoteId: string
    selectedListForShareMenu: UnifiedList['unifiedId']
    renderAICounter: (position) => JSX.Element
    renderShareMenuForAnnotation: (
        instanceLocation: AnnotationCardInstanceLocation,
    ) => (id: string) => JSX.Element
    renderListsPickerForAnnotation: (
        instanceLocation: AnnotationCardInstanceLocation,
    ) => (
        id: string,
        closePicker?: () => void,
        referenceElement?: React.RefObject<HTMLDivElement>,
    ) => JSX.Element
    renderContextMenuForList: (listData: UnifiedList) => JSX.Element
    renderPageLinkMenuForList: (listData: UnifiedList) => JSX.Element

    setActiveTab: (tab: SidebarTab) => React.MouseEventHandler
    expandFollowedListNotes: (listId: string) => void
    selectedListId: string

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
    openContextMenuForList: (
        unifiedListId: UnifiedList['unifiedId'] | null,
    ) => void
    openPageListMenuForList: () => void
    openWebUIPage: (unifiedListId: UnifiedList['unifiedId']) => void
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
    queryAIwithPrompt: any
    selectAISuggestion: any
    setQueryMode: (mode) => void
    updatePromptState: any
    postBulkShareHook: (shareState: AnnotationSharingStates) => void
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'
    toggleAISuggestionsDropDown: () => void

    //postShareHook: (shareInfo) => void
    //postShareHook: (shareInfo) => void+
    setPopoutsActive: (popoutsOpen: boolean) => void
    getYoutubePlayer?(): YoutubePlayer
    clickFeedActivityIndicator?: () => void
    clickCreatePageLinkBtn: () => void
    hasFeedActivity?: boolean
    removeSelectedTextAIPreview?: () => void
    // editableProps: EditableItemProps
    saveAIPrompt: (prompt) => void
    removeAISuggestion: (prompt) => void
    navigateFocusInList: (direction: 'up' | 'down') => void
    spaceTitleEditValue: string
    updateListName: (
        unifiedId: string,
        localId: number,
        oldName: string,
        newName: string,
    ) => void
    setSpaceTitleEditValue: (value) => void
    createNewNoteFromAISummary: (summary) => void
    showSharePageTooltip: boolean
    events: AnnotationsSidebarInPageEventEmitter
    initGetReplyEditProps: (
        sharedListReference: SharedListReference,
    ) => RepliesProps['getReplyEditProps']
    imageSupport: ImageSupportInterface<'provider'>
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
    linkCopyState: boolean
    othersOrOwnAnnotationsState: {
        [unifiedId: string]: 'othersAnnotations' | 'ownAnnotations' | 'all'
    }
    showAIhighlight: boolean
    showAISuggestionsDropDown: boolean
    themeVariant?: MemexThemeVariant
    AIsuggestions: []
    autoFocusCreateForm: boolean
    spaceTitleEditState: boolean
    hoveredListId: string | null
}

export class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps,
    AnnotationsSidebarState
> {
    private annotationCreateRef = React.createRef<AnnotationCreate>()
    private annotationEditRefs: {
        [annotationUrl: string]: React.RefObject<_AnnotationEditable>
    } = {}
    private sortDropDownButtonRef = React.createRef<HTMLDivElement>()
    private copyButtonRef = React.createRef<HTMLDivElement>()
    private pageSummaryText = React.createRef<HTMLDivElement>()
    private pageShareButtonRef = React.createRef<HTMLDivElement>()
    private bulkEditButtonRef = React.createRef<HTMLDivElement>()
    private editPageLinkButtonRef = React.createRef<HTMLDivElement>()
    private sharePageLinkButtonRef = React.createRef<HTMLDivElement>()
    private spaceTitleEditFieldRef = React.createRef<HTMLInputElement>()
    private spaceContextBtnRefs: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}
    private spaceUnfoldButtonRef: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}
    private editorPassedUp = false

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
        showAIhighlight: false,
        showAISuggestionsDropDown: false,
        AIsuggestions: [],
        autoFocusCreateForm: false,
        spaceTitleEditState: false,
        hoveredListId: null,
    }

    addYoutubeTimestampToEditor(commentText) {
        this.annotationCreateRef.current?.addYoutubeTimestampToEditor(
            commentText,
        )
    }

    private maybeCreateContextBtnRef({
        unifiedId,
    }: Pick<UnifiedList, 'unifiedId'>): void {
        if (this.spaceContextBtnRefs[unifiedId]) {
            return
        }
        this.spaceContextBtnRefs[unifiedId] = React.createRef()
    }
    private maybeCreatespaceUnfoldButtonRef({
        unifiedId,
    }: Pick<UnifiedList, 'unifiedId'>): void {
        if (this.spaceUnfoldButtonRef[unifiedId]) {
            return
        }
        this.spaceUnfoldButtonRef[unifiedId] = React.createRef()
    }

    async componentDidMount() {
        //setLocalStorage(SHOW_ISOLATED_VIEW_KEY, true)
        const isolatedViewNotifVisible = await getLocalStorage(
            SHOW_ISOLATED_VIEW_KEY,
        )

        if (isolatedViewNotifVisible == null) {
            await setLocalStorage(SHOW_ISOLATED_VIEW_KEY, true)
            this.setState({
                showIsolatedViewNotif: true,
            })
        } else {
            this.setState({
                showIsolatedViewNotif: isolatedViewNotifVisible,
            })
        }

        let themeVariant: MemexThemeVariant = 'dark'
        try {
            themeVariant = await loadThemeVariant()
        } catch (err) {
            console.error('Could not load theme, falling back to dark mode')
        }
        this.setState({ themeVariant })
    }

    async componentDidUpdate(
        prevProps: Readonly<AnnotationsSidebarProps>,
        prevState: Readonly<AnnotationsSidebarState>,
        snapshot?: any,
    ) {
        if (prevProps.pageSummary != this.props.pageSummary) {
            this.pageSummaryText.current.scrollTop = this.pageSummaryText.current.scrollHeight
        }
    }

    componentWillUnmount() {}

    handleClickOutside = (event) => {
        this.spaceTitleEditFieldRef.current.removeEventListener(
            'blur',
            this.handleClickOutside,
        )

        if (
            this.props.lists.byId[this.props.selectedListId].name !==
                this.props.spaceTitleEditValue &&
            this.props.spaceTitleEditValue.length > 0
        ) {
            this.props.updateListName(
                this.props.lists.byId[this.props.selectedListId].unifiedId,
                this.props.lists.byId[this.props.selectedListId].localId,
                this.props.lists.byId[this.props.selectedListId].name,
                this.props.spaceTitleEditValue,
            )
        }
        this.setState({
            spaceTitleEditState: false,
        })
    }
    focusCreateForm = () => {
        this.setState({ autoFocusCreateForm: true })
    }
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

    private getAnnotInstanceDropdownTogglers = (
        instanceId: string,
    ): Pick<
        AnnotationEditableProps,
        'onSpacePickerToggle' | 'onCopyPasterToggle' | 'onShareMenuToggle'
    > => ({
        onSpacePickerToggle: (showState) =>
            this.props.setSpacePickerAnnotationInstance(
                showState === 'hide'
                    ? null
                    : {
                          instanceId,
                          position: showState,
                      },
            ),
        onCopyPasterToggle: () =>
            this.props.setCopyPasterAnnotationInstance(
                this.props.copyPasterAnnotationInstanceId == null
                    ? instanceId
                    : null,
            ),
        onShareMenuToggle: () =>
            this.props.setShareMenuAnnotationInstance(
                this.props.shareMenuAnnotationInstanceId == null
                    ? instanceId
                    : null,
            ),
    })

    private renderCopyPasterManager(localAnnotationIds: string[]) {
        if (!this.state.showAllNotesCopyPaster) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.copyButtonRef.current}
                placement={'bottom'}
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
                placement={'bottom'}
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
                    onSave={async (shouldShare, isProtected) => {
                        this.props.annotationCreateProps.onSave(
                            shouldShare,
                            isProtected,
                            toggledListInstanceId,
                        )
                        this.setState({ autoFocusCreateForm: false })
                    }}
                    onCancel={() => {
                        this.setState({ autoFocusCreateForm: false })
                    }}
                    ref={this.annotationCreateRef}
                    getYoutubePlayer={this.props.getYoutubePlayer}
                    autoFocus={this.state.autoFocusCreateForm}
                    sidebarEvents={this.props.events && this.props.events}
                    imageSupport={this.props.imageSupport}
                />
            </NewAnnotationSection>
        )
    }

    private renderLoader = (key?: string, size?: number) => (
        <LoadingIndicatorContainer width={'100%'} height={'200px'} key={key}>
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
            (listData.hasRemoteAnnotationsToLoad &&
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

        let allCounter = othersCounter + ownCounter

        if (
            !this.state.othersOrOwnAnnotationsState[unifiedListId] ||
            this.state.othersOrOwnAnnotationsState[unifiedListId] === 'all'
        ) {
            annotationsData = annotationsData
        }

        if (
            this.state.othersOrOwnAnnotationsState[unifiedListId] ===
            'ownAnnotations'
        ) {
            annotationsData = annotationsData.filter((annotation) => {
                return annotation.creator?.id === this.props.currentUser?.id
            })
        }
        if (
            this.state.othersOrOwnAnnotationsState[unifiedListId] ===
            'othersAnnotations'
        ) {
            annotationsData = annotationsData.filter((annotation) => {
                return annotation.creator?.id !== this.props.currentUser?.id
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
                        {listData.type === 'page-link'
                            ? 'Add new notes to this page link by highlighting text, or by adding existing notes to it via the Space selector on each note.'
                            : 'This page is added to this Space, but has no notes yet.'}
                    </InfoText>
                </EmptyMessageContainer>
            )
        } else {
            listAnnotations = annotationsData.map((annotation, i) => {
                const instanceId = generateAnnotationCardInstanceId(
                    annotation,
                    listData.unifiedId,
                )
                const instanceRefs = getOrCreateAnnotationInstanceRefs(
                    instanceId,
                    this.props.annotationInstanceRefs,
                )

                // Only afford conversation logic if list is shared
                const conversation =
                    listData.remoteId != null
                        ? this.props.conversations[instanceId]
                        : null

                const annotationCard = this.props.annotationCardInstances[
                    instanceId
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
                        annotationCard?.isCommentEditing ?? undefined
                    ownAnnotationProps.isDeleting =
                        annotationCard?.cardMode === 'delete-confirm'
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
                        annotationCard?.cardMode === 'space-picker'
                            ? 'footer'
                            : 'hide'
                }

                return (
                    <AnnotationBox
                        key={annotation.unifiedId}
                        isActive={
                            this.props.activeAnnotationId ===
                            annotation.unifiedId
                        }
                        zIndex={
                            this.props.activeShareMenuNoteId ===
                            annotation.unifiedId
                                ? 10000
                                : this.props.annotations.allIds.length - i
                        }
                        className={'AnnotationBox'}
                        id={annotation.unifiedId}
                        order={i}
                    >
                        <AnnotationEditable
                            imageSupport={this.props.imageSupport}
                            creatorId={annotation.creator?.id}
                            currentUserId={this.props.currentUser?.id}
                            pageUrl={this.props.normalizedPageUrl}
                            isShared
                            isBulkShareProtected
                            onSpacePickerToggle={() => {
                                this.props.setSpacePickerAnnotationInstance(
                                    this.props.spacePickerAnnotationInstance ==
                                        null
                                        ? {
                                              instanceId: instanceId,
                                              position: 'footer',
                                          }
                                        : null,
                                )
                            }}
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
                            {...this.getAnnotInstanceDropdownTogglers(
                                instanceId,
                            )}
                            listIdToFilterOut={
                                this.props.annotationsCache.lists.byId[
                                    unifiedListId
                                ]?.localId
                            }
                            shareMenuButtonRef={instanceRefs.shareMenuBtn}
                            copyPasterButtonRef={instanceRefs.copyPasterBtn}
                            spacePickerBodyButtonRef={
                                instanceRefs.spacePickerBodyBtn
                            }
                            spacePickerFooterButtonRef={
                                instanceRefs.spacePickerFooterBtn
                            }
                            getYoutubePlayer={this.props.getYoutubePlayer}
                            contextLocation={this.props.sidebarContext}
                            copyPasterAnnotationInstanceId={
                                this.props.copyPasterAnnotationInstanceId ===
                                    instanceId && annotation.unifiedId
                            }
                            spacePickerAnnotationInstance={
                                this.props.spacePickerAnnotationInstance
                                    ?.instanceId === instanceId &&
                                annotation.unifiedId
                            }
                            shareMenuAnnotationInstanceId={
                                this.props.shareMenuAnnotationInstanceId ===
                                    instanceId && annotation.unifiedId
                            }
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
                                    getReplyEditProps={this.props.initGetReplyEditProps(
                                        {
                                            type: 'shared-list-reference',
                                            id: listData.remoteId,
                                        },
                                    )}
                                />
                            )}
                    </AnnotationBox>
                )
            })
        }

        return (
            <FollowedNotesContainer zIndex={listData.unifiedId}>
                {(cacheUtils.deriveListOwnershipStatus(
                    listData,
                    this.props.currentUser,
                ) === 'Contributor' ||
                    cacheUtils.deriveListOwnershipStatus(
                        listData,
                        this.props.currentUser,
                    ) === 'Creator') && (
                    <>
                        <NewAnnotationBoxMyAnnotations>
                            {this.renderNewAnnotation(
                                !selectedListMode ? unifiedListId : undefined,
                            )}
                        </NewAnnotationBoxMyAnnotations>
                        <RemoteOrLocalSwitcherContainer>
                            <PrimaryAction
                                size={'small'}
                                active={
                                    this.state.othersOrOwnAnnotationsState[
                                        unifiedListId
                                    ] === 'all' ||
                                    !this.state.othersOrOwnAnnotationsState[
                                        unifiedListId
                                    ]
                                }
                                label={
                                    <SwitcherButtonContent>
                                        All
                                        <SwitcherCounter>
                                            {allCounter}
                                        </SwitcherCounter>
                                    </SwitcherButtonContent>
                                }
                                type={'tertiary'}
                                onClick={() => {
                                    this.setState({
                                        othersOrOwnAnnotationsState: {
                                            ...this.state
                                                .othersOrOwnAnnotationsState,
                                            [unifiedListId]: 'all',
                                        },
                                    })
                                }}
                            />
                            <PrimaryAction
                                size={'small'}
                                active={
                                    this.state.othersOrOwnAnnotationsState[
                                        unifiedListId
                                    ] === 'othersAnnotations'
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
                                            ...this.state
                                                .othersOrOwnAnnotationsState,
                                            [unifiedListId]:
                                                'othersAnnotations',
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
                                        <SwitcherCounter>
                                            {ownCounter}
                                        </SwitcherCounter>
                                    </SwitcherButtonContent>
                                }
                                type={'tertiary'}
                                onClick={() => {
                                    this.setState({
                                        othersOrOwnAnnotationsState: {
                                            ...this.state
                                                .othersOrOwnAnnotationsState,
                                            [unifiedListId]: 'ownAnnotations',
                                        },
                                    })
                                }}
                            />
                        </RemoteOrLocalSwitcherContainer>
                    </>
                )}
                {listAnnotations}
                {this.renderAnnotationDropdowns()}
            </FollowedNotesContainer>
        )
    }

    private renderSpacesItem(
        listData: UnifiedList,
        listInstance: ListInstance,
    ) {
        const title = listData.name
        return (
            <FollowedListNotesContainer
                bottom={listInstance.isOpen ? '0px' : '0px'}
                key={listData.unifiedId}
                top="5px"
                onMouseOver={() =>
                    this.setState({
                        hoveredListId: listData.unifiedId,
                    })
                }
                onMouseLeave={() => {
                    this.setState({
                        hoveredListId: null,
                    })
                }}
                isHovered={this.state.hoveredListId === listData.unifiedId}
            >
                <FollowedListRow
                    onClick={() =>
                        this.props.onUnifiedListSelect(listData.unifiedId)
                    }
                    zIndex={listData.unifiedId}
                >
                    <FollowedListTitleContainer>
                        <TooltipBox
                            tooltipText={
                                <span>
                                    Click here to unfold.
                                    <br /> Click entire bar to go into Focus
                                    Mode
                                </span>
                            }
                            placement="bottom"
                        >
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
                                containerRef={
                                    this.spaceUnfoldButtonRef[
                                        listData.unifiedId
                                    ]
                                }
                            />
                        </TooltipBox>
                        <FollowedListTitleBox title={title}>
                            <FollowedListTitle>{title}</FollowedListTitle>
                        </FollowedListTitleBox>
                    </FollowedListTitleContainer>
                    <ButtonContainer>
                        <ActionButtons>
                            <TooltipBox
                                tooltipText={
                                    listData.type === 'page-link'
                                        ? 'Go to page in Web Reader'
                                        : 'Go to Space'
                                }
                                placement="bottom"
                            >
                                <Icon
                                    icon="goTo"
                                    height="20px"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        this.props.openWebUIPage(
                                            listData.unifiedId,
                                        )
                                    }}
                                />
                            </TooltipBox>
                            {listData.localId != null &&
                                listData.creator?.id ===
                                    this.props.currentUser?.id && (
                                    <TooltipBox
                                        tooltipText="Share & Edit"
                                        placement="bottom"
                                    >
                                        <Icon
                                            icon="dots"
                                            height="20px"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                this.props.openContextMenuForList(
                                                    listData.unifiedId,
                                                )
                                            }}
                                            containerRef={
                                                this.spaceContextBtnRefs[
                                                    listData.unifiedId
                                                ]
                                            }
                                        />
                                    </TooltipBox>
                                )}
                        </ActionButtons>
                        {listData.creator?.id === this.props.currentUser?.id &&
                            listData.remoteId != null && (
                                <TooltipBox
                                    tooltipText="Space is Shared"
                                    placement="bottom-end"
                                >
                                    <Icon
                                        hoverOff
                                        filePath="peopleFine"
                                        heightAndWidth="20px"
                                    />
                                </TooltipBox>
                            )}
                        {listInstance.annotationRefsLoadState === 'running' ? (
                            this.renderLoader(undefined, 20)
                        ) : listData.hasRemoteAnnotationsToLoad ? (
                            <FollowedListNoteCount active left="5px">
                                <TooltipBox
                                    tooltipText={'Has annotations by others'}
                                    placement={'bottom-end'}
                                >
                                    <TotalAnnotationsCounter>
                                        {this.props
                                            .pageHasNetworkAnnotations ? (
                                            <PageActivityIndicator active />
                                        ) : undefined}
                                    </TotalAnnotationsCounter>
                                </TooltipBox>
                            </FollowedListNoteCount>
                        ) : null}
                    </ButtonContainer>
                </FollowedListRow>
                {this.renderListAnnotations(listData.unifiedId)}
                {this.renderContextMenu(
                    listData,
                    this.spaceContextBtnRefs[listData.unifiedId],
                )}
            </FollowedListNotesContainer>
        )
    }

    private renderContextMenu(listData: UnifiedList, ref: any) {
        if (this.props.activeListContextMenuId !== listData.unifiedId) {
            return
        }
        const refObject = ref
        return (
            <PopoutBox
                strategy="fixed"
                placement="bottom-end"
                offsetX={10}
                offsetY={0}
                targetElementRef={refObject?.current}
                closeComponent={() => {
                    this.props.setSpaceTitleEditValue(listData.name)
                    this.props.openContextMenuForList(listData.unifiedId)
                }}
            >
                {this.props.renderContextMenuForList(listData)}
            </PopoutBox>
        )
    }
    private renderPageLinkMenu(listData: UnifiedList) {
        let selectedList
        if (this.props.selectedListForShareMenu != null) {
            selectedList = this.props.annotationsCache.lists.byId[
                this.props.selectedListForShareMenu
            ]
        }
        return (
            <PopoutBox
                strategy="fixed"
                placement="bottom-end"
                offsetX={10}
                offsetY={0}
                targetElementRef={this.sharePageLinkButtonRef.current}
                closeComponent={() => {
                    this.props.openPageListMenuForList()
                }}
            >
                {!this.props.selectedListForShareMenu || !selectedList ? (
                    <LoadingIndicatorContainer height="180px" width="330px">
                        <LoadingIndicatorStyled size={20} />
                    </LoadingIndicatorContainer>
                ) : (
                    this.props.renderPageLinkMenuForList(selectedList)
                )}
            </PopoutBox>
        )
    }

    private renderSharedNotesByList() {
        const {
            lists,
            currentUser,
            fullPageUrl,
            pageListIds,
            listInstances,
            pageActiveListIds,
        } = this.props
        const normalizedPageUrl = fullPageUrl
            ? normalizeUrl(fullPageUrl)
            : undefined
        const allLists = normalizedStateToArray(lists).filter(
            (listData) =>
                listData.unifiedAnnotationIds.length > 0 ||
                listData.hasRemoteAnnotationsToLoad ||
                (listData.type === 'page-link' &&
                    listData.normalizedPageUrl === normalizedPageUrl) ||
                pageListIds.has(listData.unifiedId) ||
                pageActiveListIds.includes(listData.unifiedId),
        )

        if (allLists.length === 0) {
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

        const {
            followedLists,
            pageLinkLists,
            joinedLists,
            myLists,
        } = cacheUtils.siftListsIntoCategories(allLists, currentUser)

        return (
            <>
                <SpaceTypeSection>
                    <SpaceTypeSectionHeader>
                        Page Links{' '}
                        <SpacesCounter>{pageLinkLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {pageLinkLists.length > 0 && (
                        <SpaceTypeSectionContainer>
                            {pageLinkLists.map((listData) => {
                                this.maybeCreateContextBtnRef(listData)
                                this.maybeCreatespaceUnfoldButtonRef(listData)
                                return this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                )
                            })}
                        </SpaceTypeSectionContainer>
                    )}
                </SpaceTypeSection>
                <SpaceTypeSection>
                    <SpaceTypeSectionHeader>
                        My Spaces{' '}
                        <SpacesCounter>{myLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {myLists.length > 0 ? (
                        <SpaceTypeSectionContainer>
                            {myLists.map((listData) => {
                                this.maybeCreateContextBtnRef(listData)
                                return this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                )
                            })}
                        </SpaceTypeSectionContainer>
                    ) : undefined}
                </SpaceTypeSection>

                <SpaceTypeSection>
                    <SpaceTypeSectionHeader>
                        Followed Spaces{' '}
                        <SpacesCounter>{followedLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {followedLists.length > 0 ? (
                        <SpaceTypeSectionContainer>
                            {followedLists.map((listData) =>
                                this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                ),
                            )}
                        </SpaceTypeSectionContainer>
                    ) : undefined}
                </SpaceTypeSection>

                <SpaceTypeSection>
                    <SpaceTypeSectionHeader>
                        Joined Spaces{' '}
                        <SpacesCounter>{joinedLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {joinedLists.length > 0 ? (
                        <SpaceTypeSectionContainer>
                            {joinedLists.map((listData) =>
                                this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                ),
                            )}
                        </SpaceTypeSectionContainer>
                    ) : undefined}
                </SpaceTypeSection>
            </>
        )
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

    private throwNoSelected
    rror() {
        throw new Error(
            'Isolated view specific render method called when state not set',
        )
    }

    private renderFeed() {
        return (
            <AnnotationsSectionStyled>
                <FeedFrame src={getFeedUrl()} />
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

    isolatedViewNotifVisible = async () => {
        this.setState({ showIsolatedViewNotif: false })
        await setLocalStorage(SHOW_ISOLATED_VIEW_KEY, false)
    }

    private renderFocusModeNotif(listData: UnifiedList) {
        const ownershipStatus = cacheUtils.deriveListOwnershipStatus(
            listData,
            this.props.currentUser,
        )
        if (
            this.state.showIsolatedViewNotif &&
            (ownershipStatus === 'Contributor' || ownershipStatus === 'Creator')
        ) {
            return (
                <FocusModeNotifContainer>
                    <FocusModeNotifTopBar>
                        <FocusModeNotifTitle>
                            <Icon
                                filePath={'commentAdd'}
                                heightAndWidth={'20px'}
                                color={'prime1'}
                                hoverOff
                            />
                            Space Focus Mode
                        </FocusModeNotifTitle>
                        <Icon
                            filePath={'removeX'}
                            heightAndWidth={'20px'}
                            color={'greyScale5'}
                            onClick={() => this.isolatedViewNotifVisible()}
                        />
                    </FocusModeNotifTopBar>
                    <FocusModeNotifExplainer>
                        While you have a Space opened in this view (even with
                        the sidebar closed), all new highlights and notes are
                        automatically added to it.
                    </FocusModeNotifExplainer>
                </FocusModeNotifContainer>
            )
        }
    }

    private showSummary() {
        let contentType: 'highlight' | 'page' | 'video'

        if (this.props.fullPageUrl.includes('youtube.com')) {
            contentType = 'video'
        } else if (this.props.selectedTextAIPreview?.length > 0) {
            contentType = 'highlight'
        } else {
            contentType = 'page'
        }

        return (
            <SummarySection>
                <SummaryContainer>
                    {this.props.showLengthError &&
                        this.props.queryMode === 'summarize' && (
                            <ErrorContainer>
                                This article is too big. Consider summarising
                                per paragraph for better quality.
                            </ErrorContainer>
                        )}
                    {this.props.pageSummary?.length > 0 ? (
                        <SummaryText ref={this.pageSummaryText}>
                            {this.props.pageSummary}
                        </SummaryText>
                    ) : (
                        <AIContainerNotif>
                            <AIContainerNotifTitle>
                                Summarise or ask questions <br /> about{' '}
                                {contentType === 'video'
                                    ? 'this video'
                                    : contentType === 'highlight'
                                    ? 'the selected text'
                                    : 'this article'}
                            </AIContainerNotifTitle>
                            <AIContainerNotifSubTitle>
                                Just type in a question or pick one of the
                                templates
                            </AIContainerNotifSubTitle>
                        </AIContainerNotif>
                    )}
                </SummaryContainer>
                {/* {this.state
                    .summarizeArticleLoadState[
                    entry.normalizedUrl
                ] === 'error' && (
                    <ErrorContainer>
                        Page could not be
                        summarised. This
                        may be because it
                        is behind a
                        paywall.
                    </ErrorContainer>
                )} */}
            </SummarySection>
        )
    }

    private renderResultsBody(themeVariant: MemexThemeVariant) {
        const listData = this.props.lists.byId[this.props.selectedListId]

        if (this.props.activeTab === 'feed') {
            return this.renderFeed()
        }

        if (
            (this.props.isDataLoading ||
                this.props.foreignSelectedListLoadState === 'running') &&
            this.props.activeTab !== 'summary'
        ) {
            return this.renderLoader()
        }

        const addPromptButton = (prompt) => (
            <TooltipBox
                tooltipText="Save prompt as template"
                placement="bottom-end"
            >
                <Icon
                    onClick={() => this.props.saveAIPrompt(prompt)}
                    filePath={icons.plus}
                    heightAndWidth="22px"
                    color="prime1"
                />
            </TooltipBox>
        )

        if (this.props.activeTab === 'summary') {
            const SuggestionsList = ({
                AIsuggestions,
            }: Pick<AnnotationsSidebarProps, 'AIsuggestions'>) => {
                return (
                    <ClickAway
                        onClickAway={() =>
                            this.props.toggleAISuggestionsDropDown()
                        }
                    >
                        <DropDown>
                            {AIsuggestions.map((suggestion) => (
                                <DropDownItem
                                    key={suggestion.prompt}
                                    onClick={() =>
                                        this.props.selectAISuggestion(
                                            suggestion.prompt,
                                        )
                                    }
                                    focused={
                                        suggestion.focused && suggestion.focused
                                    }
                                >
                                    {suggestion.prompt}
                                    <RemoveTemplateIconBox>
                                        <TooltipBox
                                            tooltipText="Remove template"
                                            placement="left"
                                        >
                                            <Icon
                                                filePath={icons.removeX}
                                                heightAndWidth="18px"
                                                color="greyScale5"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    this.props.removeAISuggestion(
                                                        suggestion.prompt,
                                                    )
                                                }}
                                            />
                                        </TooltipBox>
                                    </RemoveTemplateIconBox>
                                </DropDownItem>
                            ))}
                        </DropDown>
                    </ClickAway>
                )
            }

            return (
                <AISidebarContainer>
                    {this.props.selectedTextAIPreview && (
                        <SelectedAITextBox>
                            <SelectedAITextHeader>
                                <PrimaryAction
                                    icon={
                                        this.state.showAIhighlight
                                            ? 'compress'
                                            : 'expand'
                                    }
                                    onClick={() =>
                                        this.setState({
                                            showAIhighlight: !this.state
                                                .showAIhighlight,
                                        })
                                    }
                                    type="tertiary"
                                    size="small"
                                    label={
                                        this.state.showAIhighlight
                                            ? 'Hide'
                                            : 'Show All'
                                    }
                                />
                                <PrimaryAction
                                    icon={'removeX'}
                                    onClick={() =>
                                        this.props.removeSelectedTextAIPreview()
                                    }
                                    type="tertiary"
                                    size="small"
                                    label={'Reset'}
                                />
                            </SelectedAITextHeader>
                            <SelectedAITextContainer
                                fullHeight={this.state.showAIhighlight}
                            >
                                <SelectedTextBoxBar />
                                <SelectedAIText>
                                    {this.props.selectedTextAIPreview}
                                </SelectedAIText>
                                {!this.state.showAIhighlight && (
                                    <BlurContainer />
                                )}
                            </SelectedAITextContainer>
                        </SelectedAITextBox>
                    )}
                    <QueryContainer
                        AIDropDownShown={
                            this.props.showAISuggestionsDropDown &&
                            this.props.AIsuggestions.length > 0
                        }
                    >
                        <TextField
                            placeholder={
                                this.props.prompt ??
                                'Type a prompt like "Summarize in 2 paragraphs"'
                            }
                            value={this.props.prompt}
                            icon="feed"
                            element={null}
                            iconSize="18px"
                            padding={'10px 10px'}
                            onChange={async (event) => {
                                await this.props.updatePromptState(
                                    (event.target as HTMLInputElement).value,
                                )
                            }}
                            onKeyDown={async (event) => {
                                if (event.key === 'Enter') {
                                    await this.props.queryAIwithPrompt(
                                        this.props.prompt,
                                    )
                                }
                                if (event.key === 'Escape') {
                                    this.props.toggleAISuggestionsDropDown()
                                }
                                if (event.key === 'ArrowUp') {
                                    if (!this.props.showAISuggestionsDropDown) {
                                        this.props.toggleAISuggestionsDropDown()
                                    }
                                    this.props.navigateFocusInList('up')
                                    focus()
                                }

                                if (event.key === 'ArrowDown') {
                                    if (!this.props.showAISuggestionsDropDown) {
                                        this.props.toggleAISuggestionsDropDown()
                                    }
                                    this.props.navigateFocusInList('down')
                                    focus()
                                }
                                event.stopPropagation()
                            }}
                            height="40px"
                            onClick={() =>
                                this.props.toggleAISuggestionsDropDown()
                            }
                            actionButton={
                                this.props.prompt &&
                                this.props.prompt.length > 0 &&
                                addPromptButton(this.props.prompt)
                            }
                            autoFocus={this.props.activeTab === 'summary'}
                        />
                        {this.props.showAISuggestionsDropDown &&
                            this.props.AIsuggestions.length > 0 && (
                                <SuggestionsList {...this.props} />
                            )}
                    </QueryContainer>
                    {!this.props.selectedTextAIPreview && (
                        <OptionsContainer>
                            <OptionsContainerLeft>
                                <TooltipBox
                                    tooltipText={
                                        <>
                                            Just takes the first few paragraphs
                                            or roughly the first 10 minutes of a
                                            video for the summary. Much faster.
                                        </>
                                    }
                                    placement="bottom"
                                    width="150px"
                                >
                                    <SelectionPill
                                        onClick={async () => {
                                            this.props.setQueryMode(
                                                'glanceSummary',
                                            )
                                            await this.props.queryAIwithPrompt(
                                                this.props.prompt,
                                            )
                                        }}
                                        selected={
                                            this.props.queryMode ===
                                            'glanceSummary'
                                        }
                                    >
                                        Quick Glance
                                    </SelectionPill>
                                </TooltipBox>
                                <TooltipBox
                                    tooltipText={
                                        <>
                                            Takes in the whole article or video.
                                            Much slower.
                                        </>
                                    }
                                    placement="bottom"
                                    width="150px"
                                >
                                    <SelectionPill
                                        onClick={async () => {
                                            this.props.setQueryMode('summarize')
                                            await this.props.queryAIwithPrompt(
                                                this.props.prompt,
                                            )
                                        }}
                                        selected={
                                            this.props.queryMode === 'summarize'
                                        }
                                    >
                                        Full Page
                                    </SelectionPill>
                                </TooltipBox>
                                <TooltipBox
                                    tooltipText={
                                        <>
                                            This mode is ideal for general
                                            questions that are not specific to
                                            this page
                                        </>
                                    }
                                    placement="bottom"
                                    width="150px"
                                >
                                    <SelectionPill
                                        onClick={() =>
                                            this.props.setQueryMode('question')
                                        }
                                        selected={
                                            this.props.queryMode === 'question'
                                        }
                                    >
                                        General Question
                                    </SelectionPill>
                                </TooltipBox>
                            </OptionsContainerLeft>
                            <OptionsContainerRight>
                                {this.props.pageSummary.length > 0 && (
                                    <TooltipBox
                                        tooltipText={
                                            <>
                                                Create new note <br /> from
                                                output
                                            </>
                                        }
                                        placement="bottom-end"
                                    >
                                        <Icon
                                            icon={'commentAdd'}
                                            onClick={() => {
                                                let summary = `# AI Summary\n\n ## Prompt:\n  ${this.props.prompt}\n\n ## Answer: \n ${this.props.pageSummary}`

                                                this.props.createNewNoteFromAISummary(
                                                    this.props.pageSummary,
                                                )
                                            }}
                                            heightAndWidth="22px"
                                            color="prime1"
                                        />
                                    </TooltipBox>
                                )}
                                {this.props.renderAICounter('top')}
                            </OptionsContainerRight>
                        </OptionsContainer>
                    )}
                    {this.props.loadState === 'running' ? (
                        <LoaderBoxInSummary>
                            {this.renderLoader()}
                        </LoaderBoxInSummary>
                    ) : (
                        this.showSummary()
                    )}
                    <SummaryFooter>
                        <RightSideButtons>
                            <BetaButton>
                                <BetaButtonInner>BETA</BetaButtonInner>
                            </BetaButton>
                            <PrimaryAction
                                type="tertiary"
                                size="small"
                                onClick={() => {
                                    window.open(
                                        'https://memex.garden/chatsupport',
                                        '_blank',
                                    )
                                }}
                                label="Report Bug"
                            />
                        </RightSideButtons>
                        <PoweredBy>
                            Powered by
                            <Icon
                                icon="openAI"
                                height="18px"
                                hoverOff
                                width="70px"
                            />
                        </PoweredBy>
                    </SummaryFooter>
                </AISidebarContainer>
            )
        }

        if (
            this.props.selectedListId &&
            this.props.activeTab !== 'annotations'
        ) {
            return (
                <>
                    {this.renderFocusModeNotif(listData)}
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
                    theme={{ variant: themeVariant, position: 'fixed' }}
                    sidebarContext={this.props.sidebarContext}
                />
            </>
        )
    }

    private renderAnnotationDropdowns() {
        const {
            annotationCardInstances,
            spacePickerAnnotationInstance,
            shareMenuAnnotationInstanceId,
            copyPasterAnnotationInstanceId,
            annotationInstanceRefs: annotationInstanceDropdownBtnRefs,
        } = this.props

        const instanceId =
            spacePickerAnnotationInstance?.instanceId ??
            shareMenuAnnotationInstanceId ??
            copyPasterAnnotationInstanceId
        if (!instanceId) {
            return null
        }

        const instanceRefs = getOrCreateAnnotationInstanceRefs(
            instanceId,
            annotationInstanceDropdownBtnRefs,
        )
        const instance = annotationCardInstances[instanceId]

        return (
            <>
                {spacePickerAnnotationInstance != null && (
                    <PopoutBox
                        targetElementRef={
                            spacePickerAnnotationInstance.position ===
                            'lists-bar'
                                ? instanceRefs.spacePickerBodyBtn.current
                                : instanceRefs.spacePickerFooterBtn.current
                        }
                        placement={
                            spacePickerAnnotationInstance.position ===
                            'lists-bar'
                                ? 'bottom'
                                : 'bottom-end'
                        }
                        closeComponent={() =>
                            this.props.setSpacePickerAnnotationInstance(null)
                        }
                        offsetX={10}
                    >
                        {this.props.renderListsPickerForAnnotation(
                            spacePickerAnnotationInstance.instanceId,
                        )(instance.unifiedAnnotationId, () =>
                            this.props.setSpacePickerAnnotationInstance(null),
                        )}
                    </PopoutBox>
                )}
                {shareMenuAnnotationInstanceId != null && (
                    <PopoutBox
                        targetElementRef={instanceRefs.shareMenuBtn.current}
                        placement="bottom-start"
                        strategy="fixed"
                        closeComponent={() =>
                            this.props.setShareMenuAnnotationInstance(null)
                        }
                        offsetX={10}
                    >
                        {this.props.renderShareMenuForAnnotation(
                            shareMenuAnnotationInstanceId,
                        )(instance.unifiedAnnotationId)}
                    </PopoutBox>
                )}
                {copyPasterAnnotationInstanceId != null && (
                    <PopoutBox
                        targetElementRef={instanceRefs.copyPasterBtn.current}
                        placement="bottom-end"
                        closeComponent={() =>
                            this.props.setCopyPasterAnnotationInstance(null)
                        }
                        offsetX={10}
                    >
                        {this.props.renderCopyPasterForAnnotation(
                            copyPasterAnnotationInstanceId,
                        )(instance.unifiedAnnotationId)}
                    </PopoutBox>
                )}
            </>
        )
    }

    private renderAnnotationsEditable(annotations: UnifiedAnnotation[]) {
        const annots: JSX.Element[] = []

        if (this.props.noteCreateState === 'running') {
            annots.push(
                <LoaderBox key="annot-loading-box">
                    {this.renderLoader('new-note-spinner')}
                </LoaderBox>,
            )
        }

        annots.push(
            ...annotations.map((annot, i) => {
                const instanceId = generateAnnotationCardInstanceId(annot)
                const instanceState = this.props.annotationCardInstances[
                    instanceId
                ]
                const instanceRefs = getOrCreateAnnotationInstanceRefs(
                    instanceId,
                    this.props.annotationInstanceRefs,
                )

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
                            onSpacePickerToggle={() => {
                                this.props.setSpacePickerAnnotationInstance(
                                    this.props.spacePickerAnnotationInstance ==
                                        null
                                        ? {
                                              instanceId,
                                              position: 'footer',
                                          }
                                        : null,
                                )
                            }}
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
                            {...this.getAnnotInstanceDropdownTogglers(
                                instanceId,
                            )}
                            passDownRef={ref}
                            shareMenuButtonRef={instanceRefs.shareMenuBtn}
                            copyPasterButtonRef={instanceRefs.copyPasterBtn}
                            spacePickerBodyButtonRef={
                                instanceRefs.spacePickerBodyBtn
                            }
                            spacePickerFooterButtonRef={
                                instanceRefs.spacePickerFooterBtn
                            }
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
                            copyPasterAnnotationInstanceId={
                                this.props.copyPasterAnnotationInstanceId ===
                                    instanceId && annot.unifiedId
                            }
                            spacePickerAnnotationInstance={
                                this.props.spacePickerAnnotationInstance
                                    ?.instanceId === instanceId &&
                                annot.unifiedId
                            }
                            shareMenuAnnotationInstanceId={
                                this.props.shareMenuAnnotationInstanceId ===
                                    instanceId && annot.unifiedId
                            }
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
                        {/* <DiscordNotification /> */}
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
                            <AnnotationContainer>
                                {this.renderAnnotationDropdowns()}
                                {annots}
                            </AnnotationContainer>
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

    private renderTopBarSwitcher() {
        const listData = this.props.lists.byId[this.props.selectedListId]

        return (
            <TopBarContainer>
                <TopBarTabsContainer>
                    <PrimaryAction
                        onClick={this.props.setActiveTab('annotations')}
                        label={'Notes'}
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
                                <TooltipBox
                                    tooltipText={'Has annotations by others'}
                                    placement={'bottom'}
                                >
                                    <LoadingBox hasToolTip>
                                        <PageActivityIndicator active />
                                    </LoadingBox>
                                </TooltipBox>
                            ) : (
                                <LoadingBox>
                                    <PageActivityIndicator active={false} />
                                </LoadingBox>
                            )
                        }
                    />
                    <PrimaryAction
                        onClick={this.props.setActiveTab('summary')}
                        label={'Ask'}
                        active={this.props.activeTab === 'summary'}
                        type={'tertiary'}
                        size={'medium'}
                        iconPosition={'right'}
                        padding={'0px 6px'}
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
                                <TooltipBox
                                    tooltipText={'Has new feed updates'}
                                    placement={'bottom'}
                                >
                                    <LoadingBox hasToolTip>
                                        <PageActivityIndicator active />
                                    </LoadingBox>
                                </TooltipBox>
                            ) : (
                                <LoadingBox>
                                    <PageActivityIndicator active={false} />
                                </LoadingBox>
                            )
                        }
                    />
                </TopBarTabsContainer>
                <TopBarBtnsContainer ref={this.sharePageLinkButtonRef}>
                    <PrimaryAction
                        label={'Share Page'}
                        onClick={this.props.clickCreatePageLinkBtn}
                        type="tertiary"
                        iconColor="prime1"
                        fontColor="white"
                        size="medium"
                        active={this.props.showSharePageTooltip}
                        icon={
                            this.props.pageLinkCreateState === 'running' ? (
                                <LoadingIndicator
                                    margin={'0 5px 0 0'}
                                    size={14}
                                />
                            ) : (
                                'invite'
                            )
                        }
                        padding={'0px 12px 0 6px'}
                    />
                    {this.props.showSharePageTooltip &&
                        this.renderPageLinkMenu(listData ?? null)}
                </TopBarBtnsContainer>
            </TopBarContainer>
        )
    }

    private handleNameEditInputKeyDown: React.KeyboardEventHandler = async (
        event,
    ) => {
        const selectedList = this.props.annotationsCache.lists.byId[
            this.props.selectedListId
        ]

        event.stopPropagation()
        if (
            (event.target as HTMLInputElement).value.length > 0 &&
            event.key === 'Enter'
        ) {
            // this blurring is tracked and will automatically save it
            this.spaceTitleEditFieldRef.current.blur()
            this.setState({
                spaceTitleEditState: false,
            })
            this.props.setSpaceTitleEditValue(null)
        } else if (event.key === 'Escape') {
            event.stopPropagation()
            this.setState({
                spaceTitleEditState: false,
            })
            this.props.setSpaceTitleEditValue(selectedList.name)
        }

        // If we don't have this, events will bubble up into the page!

        const nativeEvent = event.nativeEvent as KeyboardEvent

        nativeEvent.stopImmediatePropagation()
        event.stopPropagation()
    }

    private renderSelectedListTopBar() {
        const { selectedListId, annotationsCache } = this.props
        if (!selectedListId || !annotationsCache.lists.byId[selectedListId]) {
            this.throwNoSelectedListError()
        }

        const selectedList = annotationsCache.lists.byId[selectedListId]

        const isPageLink = selectedList.type === 'page-link'

        return (
            <IsolatedViewHeaderContainer>
                <IsolatedViewHeaderTopBar>
                    <PrimaryAction
                        icon="arrowLeft"
                        type="tertiary"
                        size="small"
                        label="All Spaces"
                        fontColor="greyScale6"
                        padding="3px 8px 3px 2px"
                        onClick={() => this.props.onResetSpaceSelect()}
                    />
                    <RightSideButtonsTopBar>
                        {this.renderContextMenu(
                            selectedList,
                            this.editPageLinkButtonRef,
                        )}
                        <TooltipBox
                            tooltipText={'Copy Invite Links'}
                            placement="bottom"
                        >
                            <Icon
                                icon="link"
                                containerRef={this.editPageLinkButtonRef}
                                onClick={() =>
                                    this.props.openContextMenuForList(
                                        selectedList.unifiedId,
                                    )
                                }
                                heightAndWidth="20px"
                            />
                        </TooltipBox>
                        <TooltipBox
                            tooltipText={'Open Page Link'}
                            placement="bottom"
                        >
                            <Icon
                                icon="goTo"
                                heightAndWidth="20px"
                                onClick={() => {
                                    let webUIUrl = isPageLink
                                        ? getSinglePageShareUrl({
                                              remoteListId:
                                                  selectedList.remoteId,
                                              remoteListEntryId:
                                                  selectedList.sharedListEntryId,
                                          })
                                        : getListShareUrl({
                                              remoteListId:
                                                  selectedList.remoteId,
                                          })

                                    if (webUIUrl.includes('?') && isPageLink) {
                                        webUIUrl = webUIUrl + '&noAutoOpen=true'
                                    } else if (isPageLink) {
                                        webUIUrl = webUIUrl + '?noAutoOpen=true'
                                    }
                                    window.open(webUIUrl, '_blank')
                                }}
                            />
                        </TooltipBox>
                        {this.renderPermissionStatusButton()}
                    </RightSideButtonsTopBar>
                </IsolatedViewHeaderTopBar>
                {/* {this.state.spaceTitleEditState ? ( */}
                <SpaceTitleEditField
                    ref={this.spaceTitleEditFieldRef}
                    value={
                        this.props.spaceTitleEditValue
                            ? this.props.spaceTitleEditValue
                            : selectedList.name
                    }
                    onChange={(event) => {
                        {
                            this.props.setSpaceTitleEditValue(
                                event.target.value,
                            )
                        }
                    }}
                    disabled={
                        cacheUtils.deriveListOwnershipStatus(
                            selectedList,
                            this.props.currentUser,
                        ) !== 'Creator'
                    }
                    isActivated={this.state.spaceTitleEditState}
                    isCreator={
                        cacheUtils.deriveListOwnershipStatus(
                            selectedList,
                            this.props.currentUser,
                        ) === 'Creator'
                    }
                    onClick={() => {
                        const permissionStatus = cacheUtils.deriveListOwnershipStatus(
                            selectedList,
                            this.props.currentUser,
                        )
                        if (permissionStatus === 'Creator') {
                            this.props.setSpaceTitleEditValue(selectedList.name)
                            this.spaceTitleEditFieldRef.current.addEventListener(
                                'blur',
                                this.handleClickOutside,
                            )
                            !this.state.spaceTitleEditState &&
                                this.setState({
                                    spaceTitleEditState: true,
                                })
                        }
                    }}
                    onKeyDown={this.handleNameEditInputKeyDown}
                />
                <SpaceDescription>{selectedList.description}</SpaceDescription>
                {/* {totalAnnotsCountJSX}
                {othersAnnotsCountJSX} */}
            </IsolatedViewHeaderContainer>
        )
    }

    private throwNoSelectedListError() {
        throw new Error(
            'Isolated view specific render method called when state not set',
        )
    }

    private renderPermissionStatusButton() {
        const { selectedListId, annotationsCache, currentUser } = this.props
        if (!selectedListId || !annotationsCache.lists.byId[selectedListId]) {
            this.throwNoSelectedListError()
        }

        const selectedList = this.props.annotationsCache.lists.byId[
            this.props.selectedListId
        ]

        const permissionStatus = cacheUtils.deriveListOwnershipStatus(
            selectedList,
            this.props.currentUser,
        )

        if (permissionStatus === 'Follower' && !selectedList.isForeignList) {
            return (
                <CreatorActionButtons>
                    <PrimaryAction
                        label="Follower"
                        type="forth"
                        size="small"
                        icon="check"
                        onClick={null}
                        fontColor={'greyScale6'}
                    />
                </CreatorActionButtons>
            )
        }

        if (permissionStatus === 'Creator') {
            return (
                <CreatorActionButtons>
                    <TooltipBox
                        tooltipText={
                            <span>
                                While being in this view, even if the sidebar
                                closes, all new annotations are added to to this
                                Space.
                            </span>
                        }
                        placement={'bottom-end'}
                        width={'200px'}
                    >
                        {/* <PrimaryAction
                        type="tertiary"
                        size="small"
                        icon="link"
                        label={'Share Space'}
                        onClick={null}
                        fontColor={'greyScale5'}
                    /> */}
                        <PrimaryAction
                            type="forth"
                            size="small"
                            icon="personFine"
                            label={'Creator'}
                            onClick={null}
                            fontColor={'greyScale6'}
                        />
                    </TooltipBox>
                </CreatorActionButtons>
            )
            // if (selectedList.remoteId == null) {
            //     return (
            //         <PrimaryAction
            //             type="tertiary"
            //             size="small"
            //             icon="link"
            //             label={'Share Space'}
            //             onClick={null}
            //             fontColor={'greyScale5'}
            //         />
            //     )
            // } else {
            //     return (
            //         <CreatorActionButtons>
            //             {/* <PrimaryAction
            //                 type="tertiary"
            //                 size="small"
            //                 icon="link"
            //                 label={'Share Space'}
            //                 onClick={null}
            //                 fontColor={'greyScale5'}
            //             /> */}
            //             <PrimaryAction
            //                 type="forth"
            //                 size="small"
            //                 icon="personFine"
            //                 label={'Creator'}
            //                 onClick={null}
            //                 fontColor={'greyScale5'}
            //             />
            //         </CreatorActionButtons>
            //     )
            // }
        }

        if (permissionStatus === 'Contributor') {
            return (
                <TooltipBox
                    tooltipText={
                        <span>
                            You can add pages & annotations to this Space.{' '}
                            <br /> While being in this view, even if the sidebar
                            closes, all new annotations are added to it.
                        </span>
                    }
                    placement={'bottom-end'}
                    width={'200px'}
                >
                    <PrimaryAction
                        label="Contributor"
                        type="forth"
                        size="small"
                        icon="peopleFine"
                        onClick={null}
                        fontColor={'greyScale6'}
                    />
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
                placement={'bottom'}
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

    private renderTopBarActionButtons() {
        return (
            <>
                {this.renderSortingMenuDropDown()}
                {this.renderAllNotesCopyPaster()}
                {this.renderAllNotesShareMenu()}
                <TopBarActionBtns>
                    <TooltipBox tooltipText={'Sort Notes'} placement={'bottom'}>
                        <PrimaryAction
                            icon={'sort'}
                            iconSize="20px"
                            size={'small'}
                            type={'tertiary'}
                            label={'Sort'}
                            padding={'0px 6px 0 0'}
                            innerRef={this.sortDropDownButtonRef}
                            onClick={async () => {
                                await this.setState({
                                    showSortDropDown: true,
                                })
                                this.setPopoutsActive()
                            }}
                            active={this.state.showSortDropDown}
                        />
                    </TooltipBox>
                    <TooltipBox
                        tooltipText={'Copy & Paste Note'}
                        placement={'bottom'}
                    >
                        <PrimaryAction
                            icon={'copy'}
                            size={'small'}
                            iconSize="18px"
                            padding={'0px 6px 0 0'}
                            type={'tertiary'}
                            label={'Copy'}
                            innerRef={this.copyButtonRef}
                            onClick={async () => {
                                await this.setState({
                                    showAllNotesCopyPaster: true,
                                })
                                this.setPopoutsActive()
                            }}
                            active={this.state.showAllNotesCopyPaster}
                        />
                    </TooltipBox>
                    <TooltipBox
                        tooltipText={'Bulk Share Notes'}
                        placement={'bottom'}
                    >
                        <PrimaryAction
                            icon={'multiEdit'}
                            size={'small'}
                            iconSize="18px"
                            padding={'0px 6px 0 0'}
                            type={'tertiary'}
                            label={'Bulk Share'}
                            innerRef={this.bulkEditButtonRef}
                            onClick={async () => {
                                await this.setState({
                                    showAllNotesShareMenu: true,
                                })
                                this.setPopoutsActive()
                            }}
                            active={this.state.showAllNotesShareMenu}
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
        if (!this.state.themeVariant) {
            return null
        }

        return (
            <ResultBodyContainer sidebarContext={this.props.sidebarContext}>
                <TopBar sidebarContext={this.props.sidebarContext}>
                    {this.renderTopBarSwitcher()}
                    {/* {this.renderSharePageButton()} */}
                    {/* {this.props.sidebarActions()} */}
                </TopBar>
                {this.renderPageShareModal()}
                {this.renderResultsBody(this.state.themeVariant)}
            </ResultBodyContainer>
        )
    }
}

const OptionsContainerRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 10px;
`

const AIContainerNotif = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: fit-content;
    width: 100%;
    margin: 30px 0px;
    flex-direction: column;
`

const AIContainerNotifTitle = styled.div`
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 5px;
    color: ${(props) => props.theme.colors.greyScale6};
    text-align: center;
`

const AIContainerNotifSubTitle = styled.div`
    font-size: 14px;
    font-weight: 300;
    margin-bottom: 5px;
    color: ${(props) => props.theme.colors.greyScale5};
`

const LoaderBoxInSummary = styled.div`
    display: flex;
    justify-content: center;
    height: 100%;
    padding-top: 50px;
`

const LoadingPageLinkBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-right: 15px;
    height: 30px;
    width: 30px;
`

const RightSideButtonsTopBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 10px;
`

const OptionsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 15px 10px 15px;
    z-index: 100;
    height: 24px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
`
const OptionsContainerLeft = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
    grid-gap: 10px;
    z-index: 100;
`

const SelectionPill = styled.div<{ selected: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 10px;
    color: ${(props) => props.theme.colors.greyScale6};
    border-radius: 20px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    cursor: pointer;
    font-size: 10px;

    ${(props) =>
        props.selected &&
        css`
            background: ${(props) => props.theme.colors.greyScale1};
        `}
`

const SelectedAITextHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    margin-right: -30px;
`

const SelectedAITextContainer = styled.div<{
    fullHeight?: boolean
}>`
    position: relative;
    display: flex;
    flex-direction: row;
    grid-gap: 10px;
    min-height: 30px;
    width: 100%;
    max-height: 100px;
    overflow: hidden;

    ${(props) =>
        props.fullHeight &&
        css`
            max-height: unset;
            height: fit-content;
        `}
`

const DropDown = styled.div`
    display: flex;
    flex-direction: column;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 0 0 6px 6px;
    outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    min-width: 100px;
`

const RemoveTemplateIconBox = styled.div`
    display: none;
    position: absolute;
`

const DropDownItem = styled.div<{ focused: boolean }>`
    display: flex;
    min-height: 24px;
    align-items: center;
    padding: 10px 20px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyScale5
            : props.theme.colors.greyScale7};
    justify-content: space-between;
    position: relative;
    font-size: 14px;
    &:first-child {
        border-top: 1px solid ${(props) => props.theme.colors.greyScale1};
    }

    &:hover {
        background: ${(props) => props.theme.colors.greyScale2};
        cursor: pointer;

        ${RemoveTemplateIconBox} {
            display: flex;
            right: 15px;
            z-index: 100;
        }
    }

    ${(props) =>
        props.focused &&
        css`
            background: ${(props) => props.theme.colors.greyScale2};
        `}
`

const BlurContainer = styled.div`
    position: absolute;
    bottom: 0px;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        ${(props) => props.theme.colors.black}00 0%,
        ${(props) => props.theme.colors.black} 100%
    );
`

const QueryContainer = styled.div<{
    AIDropDownShown: boolean
}>`
    height: 40px;
    padding: 15px 15px 10px 15px;
    display: flex;
    flex-direction: column;
    z-index: 101;

    ${(props) =>
        props.AIDropDownShown &&
        css`
            & > div:first-child {
                border-bottom-right-radius: 0px;
                border-bottom-left-radius: 0px;
            }
        `}
`

const AISidebarContainer = styled.div`
    display: flex;
    height: fill-available;
    /* overflow: scroll; */
    display: flex;
    flex-direction: column;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
`

const SelectedAITextBox = styled.div`
    display: flex;
    padding: 5px 25px 25px 20px;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const SelectedTextBoxBar = styled.div`
    width: 4px;
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.prime1};
    height: 100%;
`

const SelectedAIText = styled.div`
    color: ${(props) => props.theme.colors.white};
    flex: 1;
    white-space: break-spaces;
    font-size: 16px;
`

const RightSideButtons = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 10px;
`

const BetaButton = styled.div`
    display: flex;
    background: linear-gradient(
        90deg,
        #d9d9d9 0%,
        #2e73f8 0.01%,
        #0a4bca 78.86%,
        #0041be 100%
    );
    border-radius: 50px;
    height: 24px;
    width: 50px;
    align-items: center;
    justify-content: center;
`

const BetaButtonInner = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.black};
    color: #0a4bca;
    font-weight: bold;
    font-size: 12px;
    letter-spacing: 1px;
    height: 20px;
    width: 46px;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
`

const ErrorContainer = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.warning}40;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    border-radius: 10px;
    padding: 10px;
    margin: 10px;
    align-items: center;
    justify-content: center;
    text-align: center;
`

const SummaryContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: space-between;
    grid-gap: 10px;
    align-items: flex-start;
    min-height: 60px;
    height: 100%;
    overflow: scroll;
    padding-top: 10px;
`

const SummaryFooter = styled.div`
    width: fill-available;
    display: flex;
    align-items: center;
    justify-content: space-between;
    grid-gap: 10px;
    padding: 10px 20px 10px 20px;
    margin-right: 1px;
    background: ${(props) => props.theme.colors.black}20;
    backdrop-filter: blur(8px);
    position: fixed;
    bottom: -1px;
`

const PoweredBy = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
    height: 26px;
`

const SummarySection = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: start;
    height: fill-available;
    flex: 1;
    height: 30%;
`

const SummaryText = styled.div`
    padding: 0px 20px 240px 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    line-height: 22px;
    white-space: break-spaces;
    flex-direction: column-reverse;
    margin-bottom: 200px;

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            color: ${(props) => props.theme.colors.greyScale5};
        `};
`

const FocusModeNotifContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 15px;
    background-color: ${(props) => props.theme.colors.black};
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    margin: 10px;
    grid-gap: 10px;

    & * {
        font-family: Satoshi, sans-serif;
    }
`

const FocusModeNotifTopBar = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`

const FocusModeNotifTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    align-items: center;
    grid-gap: 5px;
    font-weight: 500;
`

const FocusModeNotifExplainer = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    line-height: 21px;
`

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

    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale1};
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
    margin-left: 10px;
`

const NewAnnotationBoxMyAnnotations = styled.div`
    display: flex;
    margin-bottom: 5px;
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
    font-size: 18px;
    font-weight: 500;
    width: fill-available;
    color: ${(props) => props.theme.colors.white};
    letter-spacing: 1px;
    padding: 5px 3px 5px 5px;
    margin: -5px -3px -5px -5px;
    border-radius: 5px;
    outline: 1px solid transparent;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    border: none;

    &:hover {
        cursor: pointer;
        background: ${(props) => props.theme.colors.greyScale1};
    }
`
const SpaceTitleEditField = styled.input<{
    isActivated: boolean
    isCreator: boolean
}>`
    font-size: 18px;
    font-weight: 500;
    width: fill-available;
    color: ${(props) => props.theme.colors.white};
    letter-spacing: 1px;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 5px;
    padding: 5px 3px 5px 5px;
    margin: -5px -3px -5px -5px;
    outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on;
    border: none;

    ${(props) =>
        !props.isActivated &&
        css`
            font-size: 18px;
            font-weight: 500;
            width: fill-available;
            color: ${(props) => props.theme.colors.white};
            background: transparent;
            letter-spacing: 1px;
            padding: 5px 3px 5px 5px;
            margin: -5px -3px -5px -5px;
            border-radius: 5px;
            outline: 1px solid transparent;
            font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on,
                'ss04' on;
            border: none;

            &:hover {
                cursor: pointer;
                background: ${(props) => props.theme.colors.greyScale1};
            }
        `};
    ${(props) =>
        !props.isCreator &&
        css`
            &:hover {
                cursor: default;
                background: transparent;
            }
        `};
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
    z-index: 20;
    padding: 5px 0px;
    grid-gap: 7px;
    background: ${(props) => props.theme.colors.black};
`

const AnnotationActions = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: fill-available;
    height: 24px;
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

const LoadingBox = styled.div<{ hasToolTip }>`
    display: flex;
    justify-content: center;
    position: absolute;
    height: 12px;
    width: 12px;
    align-items: center;
    right: 0px;
    margin-top: ${(props) => (props.hasToolTip ? '-15px' : '-20px')};
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
    z-index: 11300;
    padding: 10px 10px 10px 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    background: ${(props) => props.theme.colors.black};

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            /* box-shadow: ${(props) =>
                props.theme.borderStyles.boxShadowBottom}; */
            border-bottom: 1px solid
                ${(props) =>
                    props.theme.borderStyles.borderLineColorBigElements};
        `};
`

const IsolatedViewHeaderContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    padding: 0px 15px 0 15px;
    z-index: 20;
    background: ${(props) => props.theme.colors.black};
`

const IsolatedViewHeaderTopBar = styled.div`
    display: flex;
    align-items: center;
    height: 30px;
    padding: 5px;
    justify-content: space-between;
    width: fill-available;
    z-index: 100;
    margin: 3px -8px 0 -3px;

    &:first-child {
        margin-left: -10px;
    }
`

const TopBarContainer = styled.div`
    display: flex;
    grid-gap: 4px;
    width: 100%;
    align-items: center;
    justify-content: space-between;
`
const TopBarTabsContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 2px;
`

const TopBarBtnsContainer = styled.div``

const EmptyMessageContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 40px 5px;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    width: fill-available;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
    max-width: 80%;
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

const FollowedListNotesContainer = styled(Margin)<{
    key: number
    isHovered: boolean
}>`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: fill-available;
    width: -moz-available;
    z-index: ${(props) => 1000 - props.key};
    height: -webkit-fill-available;

    ${(props) =>
        props.isHovered &&
        css`
            z-index: 100000;
        `};
`

const sidebarContentOpen = keyframes`
 0% { margin-top: 20px}
 100% { margin-top: 0px}
`

const AnnotationContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    /* padding-bottom: 500px;
    overflow-y: scroll;
    overflow-x: visible; */
    height: 100%;
    overflow: scroll;
    padding-bottom: 100px;
    flex: 1;
    z-index: 10;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    animation-name: ${sidebarContentOpen};
    animation-duration: 800ms;
    animation-timing-function: cubic-bezier(0.3, 0.35, 0.14, 0.8);
    animation-fill-mode: both;
`

const openAnimation = keyframes`
 0% { opacity: 0; margin-top: 20px;}
 100% { opacity: 1; margin-top: 0px;}
`

const AnnotationBox = styled.div<{
    isActive: boolean
    zIndex: number
    order: number
}>`
    width: 100%;
    z-index: ${(props) => props.zIndex};

    animation-name: ${openAnimation};
    animation-duration: 600ms;
    animation-delay: ${(props) => props.order * 20}ms;
    animation-timing-function: cubic-bezier(0.3, 0.35, 0.14, 0.8);
    animation-fill-mode: both;
    position: relative;
`

const FollowedNotesContainer = styled.div<{ zIndex: number }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-bottom: 60px;
    z-index: ${(props) => 999 - props.zIndex};
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

const FollowedListRow = styled(Margin)<{
    key: number
    context: string
    zIndex?: number
}>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    width: fill-available;
    cursor: pointer;
    border-radius: 8px;
    height: 44px;
    padding: 5px 15px 5px 10px;
    z-index: ${(props) => 1000 - props.zIndex};

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
    height: 100%;
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
const FollowedListTitleBox = styled.div<{ context: string }>`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-width: 30px;
    flex: 1;
    height: 100%;
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

const LoadingIndicatorContainer = styled.div<{ height: string; width: string }>`
    width: 100%;
    width: ${(props) => (props.width ? props.width : '15px')};
    height: ${(props) => (props.height ? props.height : '15px')};
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
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    height: auto;
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
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
    flex: 1;
    z-index: 19;
    overflow: scroll;
    padding: 0px 10px 0px 10px;

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
    height: 100%;

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

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            /* box-shadow: ${(props) =>
                props.theme.borderStyles.boxShadowLeft}; */
            border-right: 1px solid
                ${(props) =>
                    props.theme.borderStyles.borderLineColorBigElements};
        `};
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: fill-available;
    border: none;
    border-radius: 10px;
`
