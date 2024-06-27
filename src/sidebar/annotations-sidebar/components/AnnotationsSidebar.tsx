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
    SidebarAITab,
    SidebarContainerState,
    SidebarTab,
    SuggestionCard,
    SuggestionsTab,
} from '../containers/types'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import Margin from 'src/dashboard-refactor/components/Margin'
import { SortingDropdownMenuBtn } from '../components/SortingDropdownMenu'
import * as icons from 'src/common-ui/components/design-library/icons'
import AllNotesShareMenu from 'src/overview/sharing/AllNotesShareMenu'
import type {
    AnnotationSharingStates,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import type {
    PageAnnotationsCacheInterface,
    RGBAColor,
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import * as cacheUtils from 'src/annotations/cache/utils'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import {
    generateAnnotationCardInstanceId,
    getOrCreateAnnotationInstanceRefs,
    initListInstance,
} from '../containers/utils'
import { UpdateNotifBanner } from 'src/common-ui/containers/UpdateNotifBanner'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import IconBox from '@worldbrain/memex-common/lib/common-ui/components/icon-box'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    getFeedUrl,
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import type { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { loadThemeVariant } from 'src/common-ui/components/design-library/theme'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import Checkbox from 'src/common-ui/components/Checkbox'
import { DropdownMenuBtn as DropdownMenuBtnSmall } from 'src/common-ui/components/dropdown-menu-small'
import { interceptLinks } from '@worldbrain/memex-common/lib/common-ui/utils/interceptVideoLinks'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import { sleepPromise } from 'src/util/promises'
import { ErrorNotification } from '@worldbrain/memex-common/lib/common-ui/components/error-notification'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import PageCitations from 'src/citations/PageCitations'
import type { TaskState } from 'ui-logic-core/lib/types'
import { PageMetadataForm } from 'src/page-indexing/ui/metadata-form'
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import type { SpaceSearchSuggestion } from '@worldbrain/memex-common/lib/editor'
import AIChatComponent from '@worldbrain/memex-common/lib/ai-chat/index'
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api'
import { extractDataFromPDFDocument } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-pdf-content'
import {
    ChatHistoryItem,
    PromptData,
} from '@worldbrain/memex-common/lib/summarization/types'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import PromptTemplatesComponent from 'src/common-ui/components/prompt-templates/index'
import { COUNTER_STORAGE_KEY } from '@worldbrain/memex-common/lib/subscriptions/constants'
import browser, { Browser } from 'webextension-polyfill'
import { isUrlYTVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'
import debounce from 'lodash/debounce'
import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'

const SHOW_ISOLATED_VIEW_KEY = `show-isolated-view-notif`

type Refs = { [unifiedListId: string]: React.RefObject<HTMLDivElement> }

export interface AnnotationsSidebarProps extends SidebarContainerState {
    annotationsCache: PageAnnotationsCacheInterface
    currentUser?: UserReference
    // sidebarActions: () => void

    setActiveAnnotation: (
        annotationId: UnifiedAnnotation['unifiedId'],
        source?: 'highlightInPage' | 'highlightCard',
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
    renderAICounter: () => JSX.Element
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
    renderListPickerForBulkEdit: () => JSX.Element
    renderContextMenuForList: (listData: UnifiedList) => JSX.Element
    renderEditMenuForList: (listData: UnifiedList) => JSX.Element
    renderPageLinkMenuForList: () => JSX.Element
    openImageInPreview: (imageSource: string) => Promise<void>
    setActiveTab: (tab: SidebarTab) => void
    setActiveAITab: (tab: SidebarAITab) => React.MouseEventHandler
    setActiveSuggestionsTab: (tab: SuggestionsTab) => React.MouseEventHandler
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
    openEditMenuForList: (
        unifiedListId: UnifiedList['unifiedId'] | null,
    ) => void
    closePageLinkShareMenu: () => void
    openWebUIPage: (unifiedListId: UnifiedList['unifiedId']) => void
    onShareAllNotesClick: () => void
    onCopyBtnClick: () => void
    onMenuItemClick: (sortingFn) => void

    onUnifiedListSelect: (unifiedListId: UnifiedList['unifiedId']) => void
    onLocalListSelect: (localListId: number) => void
    onResetSpaceSelect: () => void

    copyPaster: any
    normalizedPageUrl: string
    getLocalAnnotationIds: () => string[]
    contentSharing: ContentSharingInterface
    annotationsShareAll: any
    copyPageLink: any
    queryAIwithPrompt: (
        prompt: string,
        highlightedText?: string,
        queryMode?: string,
    ) => void
    getVideoChapters: any
    chapterList: any
    videoDetails: any
    summariseChapter: any
    chapterSummaries: any
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
    events: AnnotationsSidebarInPageEventEmitter
    initGetReplyEditProps: (
        sharedListReference: SharedListReference,
    ) => RepliesProps['getReplyEditProps']
    imageSupport: ImageSupportInterface<'caller'>
    bgScriptBG: RemoteBGScriptInterface<'caller'>
    fetchLocalHTML: boolean
    changeFetchLocalHTML: (value) => void
    setAIModel: (AImodel) => void
    syncSettingsBG: RemoteSyncSettingsInterface
    saveHighlightColor: (
        noteId: UnifiedAnnotation['unifiedId'],
        color: HighlightColor['id'],
    ) => void
    getHighlightColorSettings: () => void
    highlightColorSettings: HighlightColor[]
    onGoToAnnotation?: (unifiedId) => void
    setRabbitHoleBetaFeatureAccess?: (permission) => void
    requestRabbitHoleBetaFeatureAccess?: (reasonText) => void
    setSummaryMode: (tab) => void
    saveFeedSources: (sources) => void
    loadFeedSources: () => void
    removeFeedSource: (feedUrl) => void
    processFileImportFeeds: (fileContent) => void
    openLocalFile: (path: string) => void
    addLocalFolder: () => void
    getLocalFolders: () => void
    removeLocalFolder: (id) => void
    showFeedSourcesMenu: boolean
    setFeedSourcesMenu: () => void
    setExistingSourcesOptions: (option) => void
    existingSourcesOption:
        | 'pristine'
        | 'existingKnowledge'
        | 'twitter'
        | 'localFolder'
        | 'obsidian'
        | 'logseq'
    getRootElement: () => HTMLElement
    setNoteWriteError: (error) => void
    inPageMode?: boolean
    authBG: AuthRemoteFunctionsInterface
    analyticsBG: AnalyticsCoreInterface
    browserAPIs: Browser
    pageIndexingBG: PageIndexingInterface<'caller'>
    contentSharingBG: ContentSharingInterface
    contentSharingByTabsBG: RemoteContentSharingByTabsInterface<'caller'>
    copyToClipboard: (text: string) => Promise<boolean>
    showSpacesTab: () => void
    isAutoAddEnabled: boolean
    toggleAutoAdd: () => void
    toggleAutoAddBulk: (toggleState: boolean) => void
    bulkSelectAnnotations: (annotationIds: string[]) => void
    bulkSelectionState: string[]
    updateSpacesSearchSuggestions?: (query: string) => void
    spaceSearchSuggestions?: SpaceSearchSuggestion[]
    selectSpaceForEditorPicker: (params: {
        spaceId: number
        newNote?: boolean
        unifiedAnnotationId?: UnifiedAnnotation['unifiedId']
    }) => void
    removeSpaceFromEditorPicker: (
        spaceId: UnifiedList['localId'],
        unifiedAnnotationId: UnifiedAnnotation['unifiedId'],
        newNote?: boolean,
    ) => void
    addNewSpaceViaWikiLinksNewNote: (spaceName: string) => void
    addNewSpaceViaWikiLinksEditNote: (
        spaceName: string,
        unifiedAnnotationId: string,
    ) => void

    queryAIservice: (promptData: PromptData) => Promise<void>
    updateAIChatHistoryState: (newState: ChatHistoryItem[]) => void
    updateAIChatEditorState: (AIChatEditorState: string) => void
    addedKey?: () => void
    checkIfKeyValid?: (apiKey: string) => void
    signupDate: number
    createCheckOutLink: (
        billingPeriod: 'monthly' | 'yearly',
        selectedPremiumPlans: PremiumPlans[],
        doNotOpen: boolean,
    ) => void
    bookmarkPage: () => void
    openSpacePickerInRibbon: () => void
}

interface AnnotationsSidebarState {
    searchText: string
    isolatedView?: string | null // if null show default view
    showIsolatedViewNotif: boolean // if null show default view
    isMarkdownHelpShown: boolean
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
    copiedVideoLink: boolean
    onboardingReasonContainer?: string
    feedSourcesTextAreaContent?: string
    fileDragOverFeedField?: boolean
    showSelectedAITextButtons?: boolean
    pageLinkCreationLoading: TaskState
    showSpacePickerForBulkEdit: boolean
    showAutoAddBulkSelection: boolean
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
    private autoAddBulkButtonRef = React.createRef<HTMLDivElement>()
    private addSpaceBulkButtonRef = React.createRef<HTMLDivElement>()
    private bulkEditButtonRef = React.createRef<HTMLDivElement>()
    private editPageLinkButtonRef = React.createRef<HTMLDivElement>()
    private sharePageLinkButtonRef = React.createRef<HTMLDivElement>()
    private shareInviteButtonRef = React.createRef<HTMLDivElement>()
    private spaceTitleEditFieldRef = React.createRef<HTMLInputElement>()
    private addSourcesButtonRef = React.createRef<HTMLDivElement>()
    private spaceContextBtnRefs: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}
    private spaceEditBtnRefs: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}
    private spaceUnfoldButtonRef: {
        [unifiedListId: string]: React.RefObject<HTMLDivElement>
    } = {}
    private editorPassedUp = false
    lastClickInsideSidebar = null
    theme = null

    state: AnnotationsSidebarState = {
        searchText: '',
        showIsolatedViewNotif: false,
        isMarkdownHelpShown: false,
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
        copiedVideoLink: false,
        onboardingReasonContainer: null,
        feedSourcesTextAreaContent: '',
        fileDragOverFeedField: false,
        showSelectedAITextButtons: false,
        pageLinkCreationLoading: 'pristine',
        showSpacePickerForBulkEdit: false,
        showAutoAddBulkSelection: false,
    }

    // async addYoutubeTimestampToEditor(commentText) {
    //     let annotationCreateRef = this.annotationCreateRef.current

    //     if (annotationCreateRef) {
    //         this.annotationCreateRef.current?.addYoutubeTimestampToEditor(
    //             commentText,
    //         )
    //     }
    //     // fix race condition of annotationCreateRef not being available yet, hacky but works
    //     while (!annotationCreateRef) {
    //         await sleepPromise(25)
    //         annotationCreateRef = this.annotationCreateRef.current
    //         if (annotationCreateRef) {
    //             this.annotationCreateRef.current?.addYoutubeTimestampToEditor(
    //                 commentText,
    //             )
    //         }
    //         await sleepPromise(25)
    //     }
    // }

    private maybeCreateContextBtnRef({
        unifiedId,
    }: Pick<UnifiedList, 'unifiedId'>): void {
        if (this.spaceContextBtnRefs[unifiedId]) {
            return
        }
        this.spaceContextBtnRefs[unifiedId] = React.createRef()
    }
    private maybeCreateEditBtnRef({
        unifiedId,
    }: Pick<UnifiedList, 'unifiedId'>): void {
        if (this.spaceEditBtnRefs[unifiedId]) {
            return
        }
        this.spaceEditBtnRefs[unifiedId] = React.createRef()
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

        this.theme = await loadThemeVariant()

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
        this.props.getHighlightColorSettings()

        document.addEventListener('keydown', this.handleSelectAll)
        document.addEventListener('mousedown', this.handleLastClick)
        document.addEventListener('mousemove', this.trackMouseOverSidebar)
    }

    async componentDidUpdate(
        prevProps: Readonly<AnnotationsSidebarProps>,
        prevState: Readonly<AnnotationsSidebarState>,
        snapshot?: any,
    ) {
        // if (prevProps.pageSummary != this.props.pageSummary) {
        //     this.pageSummaryText.current.scrollTop = this.pageSummaryText.current.scrollHeight
        // }
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.handleSelectAll)
        document.removeEventListener('mousedown', this.handleLastClick)
        document.removeEventListener('mousemove', this.trackMouseOverSidebar)
    }

    handleLastClick = (e) => {
        const rootElement = this.props.getRootElement()
        const sidebarContainer = rootElement.querySelector(
            '#annotationSidebarContainer',
        )
        if (sidebarContainer && e.composedPath().includes(sidebarContainer)) {
            this.lastClickInsideSidebar = true
        } else {
            this.lastClickInsideSidebar = false
        }
    }

    trackMouseOverSidebar = debounce((e: MouseEvent) => {
        const rootElement = this.props.getRootElement()
        const sidebarContainer = rootElement.querySelector(
            '#annotationSidebarContainer',
        )

        if (!sidebarContainer) return

        const {
            left,
            top,
            width,
            height,
        } = sidebarContainer.getBoundingClientRect()
        const isMouseOverSidebar =
            e.clientX >= left &&
            e.clientX <= left + width &&
            e.clientY >= top &&
            e.clientY <= top + height

        if (isMouseOverSidebar) {
            this.lastClickInsideSidebar = true
        } else {
            this.lastClickInsideSidebar = false
        }
    }, 100)

    handleSelectAll = async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            if (this.lastClickInsideSidebar) {
                e.preventDefault()
                const annotations = cacheUtils.getUserAnnotationsArray(
                    {
                        annotations: this.props.annotations,
                    },
                    this.props.normalizedPageUrl,
                    this.props.currentUser?.id.toString(),
                )

                const annotationIds = annotations.map((annotation) => {
                    return annotation.unifiedId
                })
                this.props.bulkSelectAnnotations(annotationIds)
            }
        }
    }

    async getLocalContent() {
        let isPagePDF = this.props.fullPageUrl?.includes('/pdfjs/viewer.html?')
        let fullTextToProcess: string
        if (isPagePDF) {
            const searchParams = new URLSearchParams(window.location.search)
            const filePath = searchParams.get('file')
            const pdf: PDFDocumentProxy = await (globalThis as any)[
                'pdfjsLib'
            ].getDocument(filePath).promise
            const pdfDoc = await extractDataFromPDFDocument(pdf, true)
            fullTextToProcess = pdfDoc.fullText ?? document.body.innerText
        } else {
            fullTextToProcess = (document.title ?? '') + document.body.innerText
        }
        return fullTextToProcess
    }

    handleClickOutside = (event) => {
        this.spaceTitleEditFieldRef.current.removeEventListener(
            'blur',
            this.handleClickOutside,
        )

        if (
            this.props.lists.byId[this.props.selectedListId].name !==
                this.props.spaceTitleEditValue &&
            this.props.spaceTitleEditValue?.length > 0
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
        // Initial instructions context: We need to check if the sidebar container is already within the viewport.
        // If it's not, we attempt to autofocus the create form up to 3 times every 100ms until it's within the viewport or we give up.
        const attemptFocus = (attempt = 1) => {
            // Get the document's width to compare with the sidebar's left boundary.
            const docWidth = document.documentElement.clientWidth

            const rootElement = this.props.getRootElement()

            const sidebarContainer = rootElement.querySelector(
                '#annotationSidebarContainer',
            )

            if (!sidebarContainer) {
                console.error('Sidebar container not found')
                return
            }
            const sidebarRect = sidebarContainer.getBoundingClientRect()
            // Check if the sidebar's left boundary is within the viewport.
            if (docWidth > sidebarRect.left) {
                this.setState({ autoFocusCreateForm: true })
            } else if (attempt < 3) {
                // Retry after 100ms if we have attempts left.
                setTimeout(() => attemptFocus(attempt + 1), 100)
            } else {
                console.error(
                    'Failed to autofocus create form after 3 attempts.',
                )
            }
        }
        // Start the autofocus attempt process.
        attemptFocus()
    }
    focusEditNoteForm = (annotationId: string) =>
        (this.annotationEditRefs[annotationId]?.current).focusEditForm()

    setPopoutsActive() {
        if (
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
                getPortalRoot={this.props.getRootElement}
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
                    openImageInPreview={this.props.openImageInPreview}
                    ref={this.annotationCreateRef}
                    getYoutubePlayer={this.props.getYoutubePlayer}
                    autoFocus={this.state.autoFocusCreateForm}
                    sidebarEvents={this.props.events && this.props.events}
                    imageSupport={this.props.imageSupport}
                    updateSpacesSearchSuggestions={
                        this.props.updateSpacesSearchSuggestions
                    }
                    spaceSearchSuggestions={this.props.spaceSearchSuggestions}
                    selectSpaceForEditorPicker={(spaceId: number) =>
                        this.props.selectSpaceForEditorPicker({
                            spaceId,
                            newNote: true,
                            unifiedAnnotationId: null,
                        })
                    }
                    removeSpaceFromEditorPicker={(
                        spaceId: UnifiedList['localId'],
                    ) => {
                        this.props.removeSpaceFromEditorPicker(
                            spaceId,
                            null,
                            true,
                        )
                    }}
                    addNewSpaceViaWikiLinksNewNote={
                        this.props.addNewSpaceViaWikiLinksNewNote
                    }
                />
            </NewAnnotationSection>
        )
    }

    private renderLoader = (key?: string, size?: number) => (
        <LoadingIndicatorContainer width={'100%'} height={'300px'} key={key}>
            <LoadingIndicatorStyled size={size ? size : undefined} />
        </LoadingIndicatorContainer>
    )

    private renderListAnnotations(
        unifiedListId: UnifiedList['unifiedId'],
        selectedListMode: boolean = false,
    ) {
        const listData = this.props.lists.byId[unifiedListId]
        const listInstance =
            this.props.listInstances[unifiedListId] ??
            initListInstance(listData)

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
            .filter(
                (a) =>
                    !!a && a.normalizedPageUrl === this.props.normalizedPageUrl,
            )

        let othersCounter = annotationsData.filter((annotation) => {
            return annotation.creator?.id !== this.props.currentUser?.id
        })?.length
        let ownCounter = annotationsData.filter((annotation) => {
            return annotation.creator?.id === this.props.currentUser?.id
        })?.length

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

        let listAnnotations: JSX.Element[] = []
        if (!annotationsData?.length) {
            listAnnotations = [
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
                        {listData.type === 'page-link' ? (
                            <span>
                                <EmptyMessageTitle>
                                    No notes yet
                                </EmptyMessageTitle>
                                Every highlight you create while in this
                                <br />
                                view is only added to this Space.
                            </span>
                        ) : // 'Add new notes to this page link by highlighting text, or by adding existing notes to it via the Space selector on each note.'
                        this.props.selectedListId != null ? (
                            <span>
                                <EmptyMessageTitle>
                                    No notes yet in this Space
                                </EmptyMessageTitle>
                                Every highlight you create while in this
                                <br />
                                view is only added to this Space.
                                <br />
                                <br />
                                Add highlights via the
                                <Icon
                                    icon="plus"
                                    color="prime1"
                                    heightAndWidth="20px"
                                    hoverOff
                                    inline
                                />{' '}
                                button the tooltip or annotation card, or by
                                using [[WikiLinks]] or #hashtags in the note.
                            </span>
                        ) : (
                            <span>
                                <EmptyMessageTitle>
                                    No notes yet in this Space
                                </EmptyMessageTitle>
                                Add highlights via the
                                <Icon
                                    icon="plus"
                                    color="prime1"
                                    heightAndWidth="24px"
                                    hoverOff
                                    inline
                                />{' '}
                                button the tooltip or annotation card, or by
                                using [[WikiLinks]] or #hashtags in the note.
                            </span>
                        )}
                    </InfoText>
                </EmptyMessageContainer>,
            ]
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
                    conversation?.replies?.length > 0

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
                    ownAnnotationProps.isEditingHighlight =
                        annotationCard?.isHighlightEditing ?? undefined
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
                                : this.props.annotations.allIds?.length - i
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
                            toggleAutoAdd={this.props.toggleAutoAdd}
                            isShared
                            syncSettingsBG={this.props.syncSettingsBG}
                            getRootElement={this.props.getRootElement}
                            openImageInPreview={this.props.openImageInPreview}
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
                            color={this.props.highlightColors.find((color) => {
                                return color.id === annotation.color
                            })}
                            saveHighlightColor={async (
                                color: HighlightColor['id'],
                            ) => {
                                return this.props.saveHighlightColor(
                                    annotation.unifiedId,
                                    color,
                                )
                            }}
                            bulkSelectAnnotation={() =>
                                this.props.bulkSelectAnnotations([
                                    annotation.unifiedId,
                                ])
                            }
                            isBulkSelected={this.props.bulkSelectionState.includes(
                                annotation.unifiedId,
                            )}
                            highlightColorSettings={
                                this.props.highlightColorSettings
                            }
                            isEditing={annotationCard?.isCommentEditing}
                            isEditingHighlight={
                                annotationCard?.isHighlightEditing
                            }
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
                                'highlightCard',
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
                            updateSpacesSearchSuggestions={
                                this.props.updateSpacesSearchSuggestions
                            }
                            spaceSearchSuggestions={
                                this.props.spaceSearchSuggestions
                            }
                            selectSpaceForEditorPicker={(spaceId: number) =>
                                this.props.selectSpaceForEditorPicker({
                                    spaceId,
                                    newNote: false,
                                    unifiedAnnotationId: annotation.unifiedId,
                                })
                            }
                            removeSpaceFromEditorPicker={(
                                spaceId: UnifiedList['localId'],
                            ) => {
                                this.props.removeSpaceFromEditorPicker(
                                    spaceId,
                                    annotation.unifiedId,
                                )
                            }}
                            addNewSpaceViaWikiLinksEditNote={
                                this.props.addNewSpaceViaWikiLinksEditNote
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
                                    openImageInPreview={
                                        this.props.openImageInPreview
                                    }
                                    getYoutubePlayer={
                                        this.props.getYoutubePlayer
                                    }
                                    getReplyEditProps={this.props.initGetReplyEditProps(
                                        {
                                            type: 'shared-list-reference',
                                            id: listData.remoteId,
                                        },
                                    )}
                                    imageSupport={this.props.imageSupport}
                                    getRootElement={this.props.getRootElement}
                                />
                            )}
                    </AnnotationBox>
                )
            })
        }

        return (
            <FollowedNotesContainer zIndex={parseFloat(listData.unifiedId)}>
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
                        {annotationsData?.length ? (
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
                                                [unifiedListId]:
                                                    'ownAnnotations',
                                            },
                                        })
                                    }}
                                />
                            </RemoteOrLocalSwitcherContainer>
                        ) : null}
                        {this.props.bulkSelectionState?.length > 0 &&
                            this.renderBulkEditBar()}
                    </>
                )}
                {listAnnotations}
                {this.renderAnnotationDropdowns()}
                <Spacer height={120} />
            </FollowedNotesContainer>
        )
    }

    private renderSpacesItem(
        listData: UnifiedList,
        listInstance?: ListInstance,
    ) {
        listInstance = listInstance ?? initListInstance(listData)
        const title = listData.name
        let keepHovered = false

        if (
            this.props.activeListContextMenuId === listData.unifiedId ||
            this.props.activeListEditMenuId === listData.unifiedId
        ) {
            keepHovered = true
        } else {
            keepHovered = false
        }

        return (
            <FollowedListNotesContainer
                bottom="0px"
                key={parseFloat(listData.unifiedId)}
                top="5px"
                onMouseOver={() => {
                    this.setState({
                        hoveredListId: listData.unifiedId,
                    })
                }}
                onMouseLeave={() => {
                    this.setState({
                        hoveredListId: null,
                    })
                }}
                isHovered={
                    keepHovered ||
                    this.state.hoveredListId === listData.unifiedId
                }
            >
                <FollowedListRow
                    onClick={() =>
                        this.props.onUnifiedListSelect(listData.unifiedId)
                    }
                    zIndex={parseFloat(listData.unifiedId)}
                    keepHovered={keepHovered}
                >
                    <FollowedListTitleContainer
                        context={this.props.sidebarContext}
                    >
                        <TooltipBox
                            tooltipText={
                                <span>
                                    Click here to unfold.
                                    <br /> Click entire bar to go into Focus
                                    Mode
                                </span>
                            }
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
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
                            <FollowedListTitle
                                context={this.props.sidebarContext}
                            >
                                {title}
                            </FollowedListTitle>
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
                                getPortalRoot={this.props.getRootElement}
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
                                    <>
                                        <TooltipBox
                                            tooltipText="Edit Space"
                                            placement="bottom"
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
                                        >
                                            <Icon
                                                icon="edit"
                                                height="20px"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    this.props.openEditMenuForList(
                                                        listData.unifiedId,
                                                    )
                                                }}
                                                containerRef={
                                                    this.spaceEditBtnRefs[
                                                        listData.unifiedId
                                                    ]
                                                }
                                                background={
                                                    this.props
                                                        .activeListEditMenuId ===
                                                    listData.unifiedId
                                                        ? 'greyScale2'
                                                        : null
                                                }
                                            />
                                        </TooltipBox>
                                        {((!listData.isPrivate &&
                                            !listData.remoteId) ||
                                            listData.isPrivate) && (
                                            <TooltipBox
                                                tooltipText="Share Space"
                                                placement="bottom-end"
                                                getPortalRoot={
                                                    this.props.getRootElement
                                                }
                                            >
                                                <Icon
                                                    icon="invite"
                                                    height="20px"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        this.props.openContextMenuForList(
                                                            listData.unifiedId,
                                                        )
                                                    }}
                                                    containerRef={
                                                        this
                                                            .spaceContextBtnRefs[
                                                            listData.unifiedId
                                                        ]
                                                    }
                                                    background={
                                                        this.props
                                                            .activeListContextMenuId ===
                                                        listData.unifiedId
                                                            ? 'greyScale2'
                                                            : null
                                                    }
                                                />
                                            </TooltipBox>
                                        )}
                                    </>
                                )}
                        </ActionButtons>
                        {listData.localId != null &&
                            listData.creator?.id ===
                                this.props.currentUser?.id &&
                            listData.isPrivate === false && (
                                <TooltipBox
                                    tooltipText="Space is Shared"
                                    placement="bottom-end"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <Icon
                                        filePath="peopleFine"
                                        heightAndWidth="22px"
                                        color="white"
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
                                        background={
                                            this.props
                                                .activeListContextMenuId ===
                                            listData.unifiedId
                                                ? 'greyScale2'
                                                : null
                                        }
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
                                    getPortalRoot={this.props.getRootElement}
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
                {this.renderEditMenu(
                    listData,
                    this.spaceEditBtnRefs[listData.unifiedId],
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
                    this.props.openContextMenuForList(listData.unifiedId)
                }}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderContextMenuForList(listData)}
            </PopoutBox>
        )
    }

    private renderEditMenu(listData: UnifiedList, ref: any) {
        if (this.props.activeListEditMenuId !== listData.unifiedId) {
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
                    this.props.openEditMenuForList(listData.unifiedId)
                }}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderEditMenuForList(listData)}
            </PopoutBox>
        )
    }

    private renderPageLinkMenu() {
        if (
            !this.props.showPageLinkShareMenu &&
            !this.props.showPageCitationMenu
        ) {
            return null
        }

        const localAnnotationIds = this.props.getLocalAnnotationIds()

        return (
            <PopoutBox
                strategy="fixed"
                placement="bottom-end"
                offsetX={10}
                offsetY={0}
                targetElementRef={this.sharePageLinkButtonRef.current}
                closeComponent={this.props.closePageLinkShareMenu}
                getPortalRoot={this.props.getRootElement}
            >
                <PageCitations
                    annotationUrls={localAnnotationIds}
                    copyPasterProps={{
                        copyPasterBG: this.props.copyPaster,
                        getRootElement: this.props.getRootElement,
                        onClickOutside: this.props.closePageLinkShareMenu,
                    }}
                    pageLinkProps={{
                        authBG: this.props.authBG,
                        analyticsBG: this.props.analyticsBG,
                        annotationsCache: this.props.annotationsCache,
                        contentSharingBG: this.props.contentSharingBG,
                        contentSharingByTabsBG: this.props
                            .contentSharingByTabsBG,
                        copyToClipboard: this.props.copyToClipboard,
                        fullPageUrl: this.props.fullPageUrl,
                        getRootElement: this.props.getRootElement,
                        showSpacesTab: this.props.showSpacesTab,
                        setLoadingState: (loadingState) =>
                            this.setState({
                                pageLinkCreationLoading: loadingState,
                            }),
                        fromDashboard:
                            this.props.sidebarContext === 'dashboard',
                    }}
                    getRootElement={this.props.getRootElement}
                    defaultOpenTab={
                        this.props.showPageCitationMenu
                            ? 'ShareViaLink'
                            : 'CopyToClipboard'
                    }
                />
                {this.props.renderPageLinkMenuForList()}
            </PopoutBox>
        )
    }

    private deriveAllListsForPage(): UnifiedList[] {
        const {
            lists,
            annotations,
            pageListIds,
            pageActiveListIds,
            normalizedPageUrl,
        } = this.props
        const allPageListIds = normalizedStateToArray(lists)
            .filter(
                (listData) =>
                    pageListIds.has(listData.unifiedId) ||
                    pageActiveListIds.includes(listData.unifiedId),
            )
            .map((listData) => listData.unifiedId)
        const allAnnotationListIds = normalizedStateToArray(annotations)
            .filter(
                (annotData) =>
                    annotData.normalizedPageUrl === normalizedPageUrl,
            )
            .flatMap((annotData) => annotData.unifiedListIds)
        const distinctListIds = new Set([
            ...allAnnotationListIds,
            ...allPageListIds,
        ])
        return [...distinctListIds].map((listId) => lists.byId[listId])
    }

    private renderSharedNotesByList() {
        const { listInstances } = this.props
        const allLists = this.deriveAllListsForPage()
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
                    <PrimaryAction
                        size={'medium'}
                        label={'Add page to Space'}
                        onClick={() => {
                            this.props.openSpacePickerInRibbon()
                        }}
                        icon={'plus'}
                        type={'forth'}
                    />
                </EmptyMessageContainer>
            )
        }

        const {
            followedLists,
            pageLinkLists,
            joinedLists,
            myLists,
        } = cacheUtils.siftListsIntoCategories(allLists, this.props.currentUser)

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
                                this.maybeCreateEditBtnRef(listData)
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
                    {myLists.length > 0 && (
                        <SpaceTypeSectionContainer>
                            {myLists.map((listData) => {
                                this.maybeCreateContextBtnRef(listData)
                                this.maybeCreateEditBtnRef(listData)
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
                        Followed Spaces{' '}
                        <SpacesCounter>{followedLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {followedLists.length > 0 && (
                        <SpaceTypeSectionContainer>
                            {followedLists.map((listData) =>
                                this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                ),
                            )}
                        </SpaceTypeSectionContainer>
                    )}
                </SpaceTypeSection>

                <SpaceTypeSection>
                    <SpaceTypeSectionHeader>
                        Joined Spaces{' '}
                        <SpacesCounter>{joinedLists.length}</SpacesCounter>
                    </SpaceTypeSectionHeader>
                    {joinedLists.length > 0 && (
                        <SpaceTypeSectionContainer>
                            {joinedLists.map((listData) =>
                                this.renderSpacesItem(
                                    listData,
                                    listInstances[listData.unifiedId],
                                ),
                            )}
                        </SpaceTypeSectionContainer>
                    )}
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
    error() {
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
        const listInstance =
            listInstances[selectedListId] ?? initListInstance(listData)

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
    private showChapterList() {
        if (this.props.videoDetails == null) {
            return (
                <AIContainerNotif>
                    <AIContainerNotifTitle>
                        No chapters available for this video
                    </AIContainerNotifTitle>
                </AIContainerNotif>
            )
        }

        return (
            <ChapterSection>
                <ChapterContainer>
                    {this.props.chapterList?.map((chapter, i) => {
                        const hasSummary =
                            this.props.chapterSummaries != null &&
                            this.props.chapterSummaries[i] != null &&
                            this.props.chapterSummaries[i]?.summary.length > 0
                        return (
                            <ChapterItem showButtons={hasSummary}>
                                <ChapterItemTopBox>
                                    <ChapterTitleContent>
                                        <ChapterTitle hasSummary={hasSummary}>
                                            {chapter.title}
                                        </ChapterTitle>
                                        <ChapterTimestamp
                                            onClick={(event) => {
                                                interceptLinks(
                                                    event,
                                                    this.props.sidebarContext,
                                                    this.props.getYoutubePlayer,
                                                )
                                            }}
                                            href={
                                                this.props.fullPageUrl +
                                                `&t=${chapter.start}`
                                            }
                                        >
                                            {chapter.humanReadableTimestamp}
                                        </ChapterTimestamp>
                                    </ChapterTitleContent>
                                    <ActionButton>
                                        <PrimaryAction
                                            size={'small'}
                                            label={'Summarize'}
                                            icon={'feed'}
                                            type="tertiary"
                                            onClick={() => {
                                                this.props.summariseChapter({
                                                    chapterIndex: i,
                                                })
                                            }}
                                            padding={'4px 6px 4px 2px'}
                                        />
                                    </ActionButton>
                                </ChapterItemTopBox>
                                {this.props.chapterSummaries != null &&
                                    this.props.chapterSummaries[i] != null &&
                                    (this.props.chapterSummaries[i]
                                        .loadingState === 'running' ? (
                                        <LoadingIndicator size={20} />
                                    ) : (
                                        <ChapterSummaryText
                                            getYoutubePlayer={
                                                this.props.getYoutubePlayer
                                            }
                                            contextLocation={
                                                this.props.sidebarContext
                                            }
                                            isStream={true}
                                            textColor={'greyScale6'}
                                        >
                                            {
                                                this.props.chapterSummaries[i]
                                                    .summary
                                            }
                                        </ChapterSummaryText>
                                    ))}
                            </ChapterItem>
                        )
                    })}
                </ChapterContainer>
            </ChapterSection>
        )
    }

    renderQaASection() {
        return (
            <AISidebarContainer>
                <AIChatComponent
                    getRootElement={this.props.getRootElement}
                    imageSupport={this.props.imageSupport}
                    queryAIservice={this.props.queryAIservice}
                    currentAIResponse={this.props.pageSummary}
                    renderAICounter={this.props.renderAICounter}
                    isTrial={this.props.isTrial}
                    getLocalContent={() => this.getLocalContent()}
                    updateAIChatHistoryState={
                        this.props.updateAIChatHistoryState
                    }
                    analyticsBG={this.props.analyticsBG}
                    updateEditorContentState={
                        this.props.updateAIChatEditorState
                    }
                    createNewNoteFromAISummary={
                        this.props.createNewNoteFromAISummary
                    }
                    openImageInPreview={this.props.openImageInPreview}
                    getYoutubePlayer={this.props.getYoutubePlayer}
                    sidebarEvents={this.props.events}
                    aiChatStateExternal={{
                        loadState: this.props.loadState,
                        selectedModel: this.props.AImodel,
                        fetchLocalSetting: this.props.fetchLocalHTML,
                        editorContent: this.props.aiQueryEditorState,
                        chatHistory: this.props.AIChatHistoryState,
                        currentChatId: this.props.currentChatId,
                        currentAIresponse: this.props.pageSummary,
                    }}
                    signupDate={this.props.signupDate}
                    hasKey={this.props.hasKey}
                    syncSettingsBG={this.props.syncSettingsBG}
                    browserAPIs={this.props.browserAPIs}
                    isKeyValid={this.props.isKeyValid}
                    checkIfKeyValid={this.props.checkIfKeyValid}
                    renderOptionsContainer={() => this.renderOptionsContainer()}
                    counterStorageKey={COUNTER_STORAGE_KEY}
                    setAIModel={this.props.setAIModel}
                    createCheckOutLink={this.props.createCheckOutLink}
                    authBG={this.props.authBG}
                    renderPromptTemplates={() => {
                        return (
                            <PromptTemplatesComponent
                                syncSettingsBG={this.props.syncSettingsBG}
                                getRootElement={this.props.getRootElement}
                                onTemplateSelect={(text: string) =>
                                    this.props.events.emit(
                                        'addTextToEditor',
                                        text,
                                        () => {},
                                    )
                                }
                            />
                        )
                    }}
                    omitLocalContentFeature={
                        this.props.sidebarContext === 'dashboard'
                    }
                />
            </AISidebarContainer>
        )
    }

    renderOptionsContainer() {
        return (
            <OptionsContainer>
                <SummaryActionButtonBox>
                    <TooltipBox
                        tooltipText={
                            this.props.pageSummary ? (
                                <>
                                    Create new note from output
                                    <br /> or selected parts of it
                                </>
                            ) : (
                                <>
                                    Create new note from output.
                                    <br />
                                    Though nothing to save yet.
                                </>
                            )
                        }
                        placement="bottom-end"
                        getPortalRoot={this.props.getRootElement}
                    >
                        <SummaryActionsButton
                            onMouseDown={() => {
                                let contentToUse = this.props.pageSummary
                                const selectedText = window
                                    .getSelection()
                                    ?.toString()

                                if (selectedText) {
                                    contentToUse = selectedText
                                }
                                if (this.props.pageSummary) {
                                    this.props.createNewNoteFromAISummary(
                                        contentToUse,
                                    )
                                }
                            }}
                            disabled={!this.props.pageSummary}
                        >
                            <Icon
                                icon={'commentAdd'}
                                hoverOff
                                heightAndWidth={'16px'}
                                padding={'2px'}
                            />
                            New Note
                            {/* <KeyShortcut>N</KeyShortcut> */}
                        </SummaryActionsButton>
                    </TooltipBox>
                </SummaryActionButtonBox>
                <SummaryActionButtonBox>
                    <TooltipBox
                        tooltipText={
                            this.props.fullPageUrl.includes(
                                'youtube.com/watch',
                            ) ? (
                                <>
                                    Fetches the locally visible content instead
                                    of a faster cloud fetch. <br />
                                    Not available on YouTube videos.
                                </>
                            ) : (
                                <>
                                    Fetches the locally visible content instead
                                    of a faster cloud fetch. <br />
                                    Useful if you are behind a paywall or
                                    members restricted area.
                                </>
                            )
                        }
                        placement="bottom"
                        width="200px"
                        getPortalRoot={this.props.getRootElement}
                    >
                        <SummaryActionsButton
                            disabled={this.props.fullPageUrl.includes(
                                'youtube.com/watch',
                            )}
                        >
                            <Checkbox
                                key={34534453}
                                id={'Local'}
                                isChecked={this.props.fetchLocalHTML}
                                handleChange={(event) => {
                                    event.stopPropagation()
                                    this.props.fetchLocalHTML
                                        ? this.props.changeFetchLocalHTML(false)
                                        : this.props.changeFetchLocalHTML(true)
                                }}
                                // isDisabled={!this.state.shortcutsEnabled}
                                name={'Local'}
                                size={14}
                                label={'Local Content'}
                                fontSize={14}
                                checkBoxColor="black"
                                borderColor="greyScale3"
                                fontColor="greyScale5"
                            />
                        </SummaryActionsButton>
                    </TooltipBox>
                </SummaryActionButtonBox>
                <SummaryActionButtonBox>
                    <SummaryActionsButton padding={'0px'}>
                        <DropdownMenuBtnSmall
                            elementHeight="fit-content"
                            hideDescriptionInPreview
                            menuItems={[
                                {
                                    id: 'gpt-3',
                                    name: 'GPT 3.5',
                                    info: 'Faster & good for summarization',
                                },
                                {
                                    id: 'gpt-4',
                                    name: 'GPT 4',
                                    isDisabled: this.props.hasKey
                                        ? false
                                        : true,
                                    info: (
                                        <span>
                                            Better at reasoning and with
                                            complexity
                                            <br />
                                            ONLY WITH OWN KEY
                                        </span>
                                    ),
                                },
                            ]}
                            onMenuItemClick={async (item) => {
                                this.props.setAIModel(item.id)
                            }}
                            initSelectedItem={this.props.AImodel ?? 'gpt-3'}
                            keepSelectedState
                            getRootElement={this.props.getRootElement}
                            renderAICounter={this.props.renderAICounter}
                        />
                    </SummaryActionsButton>
                </SummaryActionButtonBox>
            </OptionsContainer>
        )
    }

    renderCitations() {
        return (
            <PageMetaDataContainer>
                <PageMetadataFormTitle>Page Metadata</PageMetadataFormTitle>
                {this.props.pageMetaDataLoadingState === 'running' ? (
                    <LoadingBox3>
                        <LoadingIndicator size={30} />
                    </LoadingBox3>
                ) : !this.props.pageAlreadySaved ? (
                    <PageNotSavedContainer>
                        <PageNotSavedText>
                            Save this page to fetch metadata.
                            <br /> Sorry for the extra step we know it could be
                            better!
                        </PageNotSavedText>
                        <PrimaryAction
                            size={'medium'}
                            label={'Save Page'}
                            onClick={() => {
                                this.props.bookmarkPage()
                            }}
                            icon={'heartEmpty'}
                            type={'forth'}
                        />
                    </PageNotSavedContainer>
                ) : (
                    <PageMetadataForm
                        pageIndexingBG={this.props.pageIndexingBG}
                        fullPageUrl={this.props.fullPageUrl}
                    />
                )}
            </PageMetaDataContainer>
        )
    }

    private renderResultsBody(themeVariant: MemexThemeVariant) {
        const listData = this.props.lists.byId[this.props.selectedListId]

        if (this.props.activeTab === 'feed') {
            return this.renderFeed()
        }

        // if (
        //     (this.props.isDataLoading ||
        //         this.props.foreignSelectedListLoadState === 'running') &&
        //     this.props.activeTab !== 'summary'
        // ) {
        //     return this.renderLoader()
        // }
        if (this.props.activeTab === 'summary') {
            if (
                this.props.prompt?.length > 0 &&
                this.props.suggestionsResults?.length > 0 &&
                this.props.pageSummary?.length > 0 &&
                this.props.activeAITab !== 'ThisPage'
            ) {
                return (
                    <ResultsBodyBox>{this.renderQaASection()}</ResultsBodyBox>
                )
            }
            return this.renderQaASection()
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

        if (this.props.activeTab === 'citations') {
            return this.renderCitations()
        }

        return (
            <>
                {(this.props.activeTab === 'annotations' ||
                    this.props.activeTab === 'spaces') && (
                    <AnnotationsSectionStyled>
                        <SuggestionsListSwitcher>
                            <SuggestionsSwitcherButton
                                onClick={() => {
                                    this.props.setActiveTab('annotations')
                                }}
                                active={this.props.activeTab === 'annotations'}
                            >
                                All Notes{' '}
                            </SuggestionsSwitcherButton>
                            <SuggestionsSwitcherButton
                                onClick={() => {
                                    this.props.setActiveTab('spaces')
                                }}
                                active={this.props.activeTab === 'spaces'}
                            >
                                By Spaces{' '}
                            </SuggestionsSwitcherButton>
                        </SuggestionsListSwitcher>
                        <AnnotationSectionScrollContainer
                            id={'AnnotationSectionScrollContainer'}
                        >
                            {this.props.isDataLoading ||
                            this.props.foreignSelectedListLoadState ===
                                'running' ? (
                                this.renderLoader()
                            ) : (
                                <>
                                    {this.props.activeTab === 'annotations' &&
                                        this.renderAnnotationsEditable(
                                            cacheUtils.getUserAnnotationsArray(
                                                {
                                                    annotations: this.props
                                                        .annotations,
                                                },
                                                this.props.normalizedPageUrl,
                                                this.props.currentUser?.id.toString(),
                                            ),
                                        )}
                                    {this.props.activeTab === 'spaces' &&
                                        this.renderSharedNotesByList()}
                                </>
                            )}
                            <Spacer height={120} />
                        </AnnotationSectionScrollContainer>
                    </AnnotationsSectionStyled>
                )}
                <UpdateNotifBanner
                    location={'sidebar'}
                    theme={{ variant: themeVariant, position: 'fixed' }}
                    sidebarContext={this.props.sidebarContext}
                    getFeatureBaseToken={
                        this.props.authBG.getJWTTokenForFeatureBase
                    }
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
                        getPortalRoot={this.props.getRootElement}
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
                        getPortalRoot={this.props.getRootElement}
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
                        getPortalRoot={this.props.getRootElement}
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
                                : this.props.annotations.allIds?.length - i
                        }
                        className={'AnnotationBox'}
                        id={annot.unifiedId}
                        order={i}
                    >
                        <AnnotationEditable
                            {...annot}
                            {...this.props}
                            selector={annot.selector}
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
                            saveHighlightColor={async (
                                color: HighlightColor['id'],
                            ) => {
                                return this.props.saveHighlightColor(
                                    annot.unifiedId,
                                    color,
                                )
                            }}
                            highlightColorSettings={
                                this.props.highlightColorSettings
                            }
                            contextLocation={this.props.sidebarContext}
                            pageUrl={this.props.normalizedPageUrl}
                            body={annot.body}
                            comment={annot.comment}
                            color={this.props.highlightColors.find((color) => {
                                return color.id === annot.color
                            })}
                            isShared={isShared}
                            createdWhen={annot.createdWhen}
                            isBulkShareProtected={[
                                AnnotationPrivacyLevels.PROTECTED,
                                AnnotationPrivacyLevels.SHARED_PROTECTED,
                            ].includes(annot.privacyLevel)}
                            isEditing={instanceState.isCommentEditing}
                            isEditingHighlight={
                                instanceState.isHighlightEditing
                            }
                            bulkSelectAnnotation={() =>
                                this.props.bulkSelectAnnotations([
                                    annot.unifiedId,
                                ])
                            }
                            isBulkSelected={this.props.bulkSelectionState.includes(
                                annot.unifiedId,
                            )}
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
                                'highlightCard',
                            )}
                            onGoToAnnotation={footerDeps.onGoToAnnotation}
                            annotationEditDependencies={this.props.bindAnnotationEditProps(
                                annot,
                                'annotations-tab',
                            )}
                            syncSettingsBG={this.props.syncSettingsBG}
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
                            updateSpacesSearchSuggestions={
                                this.props.updateSpacesSearchSuggestions
                            }
                            spaceSearchSuggestions={
                                this.props.spaceSearchSuggestions
                            }
                            selectSpaceForEditorPicker={(spaceId: number) =>
                                this.props.selectSpaceForEditorPicker({
                                    spaceId,
                                    newNote: false,
                                    unifiedAnnotationId: annot.unifiedId,
                                })
                            }
                            removeSpaceFromEditorPicker={(
                                spaceId: UnifiedList['localId'],
                            ) => {
                                this.props.removeSpaceFromEditorPicker(
                                    spaceId,
                                    annot.unifiedId,
                                )
                            }}
                            addNewSpaceViaWikiLinksEditNote={
                                this.props.addNewSpaceViaWikiLinksEditNote
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
                        </TopAreaContainer>
                        {annots?.length > 1 && (
                            <AnnotationActions>
                                {this.renderTopBarActionButtons()}
                            </AnnotationActions>
                        )}
                        {this.props.bulkSelectionState?.length > 0 &&
                            this.renderBulkEditBar()}
                        {this.props.noteCreateState === 'running' ||
                        annotations?.length > 0 ? (
                            <AnnotationContainer>
                                {this.renderAnnotationDropdowns()}
                                {annots}
                                <Spacer height={120} />
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
        return (
            <TopBarContainer>
                <TopBarTabsContainer>
                    <TopBarButtonContainer>
                        <PrimaryAction
                            onClick={() => {
                                this.props.setActiveTab('annotations')
                            }}
                            label={'Notes'}
                            active={
                                this.props.activeTab === 'annotations' ||
                                this.props.activeTab === 'spaces'
                            }
                            type={'menuBar'}
                            size={'medium'}
                            padding={'3px 6px'}
                            height={'30px'}
                            icon={'commentAdd'}
                        />{' '}
                    </TopBarButtonContainer>

                    <TopBarButtonContainer>
                        <PrimaryAction
                            onClick={async () => {
                                this.props.setActiveTab('summary')
                                let executed = false
                                while (!executed) {
                                    try {
                                        if (
                                            isUrlYTVideo(this.props.fullPageUrl)
                                        ) {
                                            let video = document.getElementsByTagName(
                                                'video',
                                            )[0]

                                            let duration = Math.floor(
                                                video.duration,
                                            )

                                            executed = await this.props.events.emit(
                                                'addMediaRangeToEditor',
                                                0,
                                                duration,
                                                '',
                                                false,
                                                (success) => {
                                                    if (success) {
                                                        executed = success
                                                    }
                                                },
                                            )
                                        } else {
                                            executed = this.props.events.emit(
                                                'addPageUrlToEditor',
                                                this.props.fullPageUrl,
                                                null,
                                                false,
                                                (success) => {
                                                    executed = success
                                                },
                                            )
                                        }
                                    } catch (e) {}
                                    await new Promise((resolve) =>
                                        setTimeout(resolve, 10),
                                    )
                                }
                            }}
                            label={'Ask'}
                            active={this.props.activeTab === 'summary'}
                            type={'menuBar'}
                            size={'medium'}
                            height={'30px'}
                            icon={'stars'}
                        />
                    </TopBarButtonContainer>

                    <TopBarButtonContainer>
                        <PrimaryAction
                            label={'Cite'}
                            onClick={this.props.clickCreatePageLinkBtn}
                            type="menuBar"
                            iconColor="prime1"
                            fontColor="white"
                            size="medium"
                            innerRef={this.sharePageLinkButtonRef}
                            icon="copy"
                            padding={'0px 12px 0 6px'}
                            height={'30px'}
                            hoverState={
                                this.props.showPageLinkShareMenu ||
                                this.props.showPageCitationMenu
                            }
                        />
                        {this.state.pageLinkCreationLoading === 'running' && (
                            <LoadingBox2>
                                <TooltipBox
                                    tooltipText={
                                        <span>
                                            You can already copy & share the
                                            links but the data is still
                                            uploading
                                        </span>
                                    }
                                    placement="bottom"
                                    width="180px"
                                    getPortalRoot={this.props.getRootElement}
                                >
                                    <LoadingIndicator size={14} />
                                </TooltipBox>
                            </LoadingBox2>
                        )}
                    </TopBarButtonContainer>

                    {this.props.sidebarContext === 'in-page' &&
                        this.props.rabbitHoleBetaFeatureAccess ===
                            'onboarded' && (
                            <TopBarButtonContainer>
                                <PrimaryAction
                                    onClick={() => {
                                        this.props.setActiveTab('rabbitHole')
                                    }}
                                    label={'RabbitHole'}
                                    active={
                                        this.props.activeTab === 'rabbitHole'
                                    }
                                    type={'tertiary'}
                                    size={'medium'}
                                    iconPosition={'right'}
                                    padding={'3px 6px'}
                                    height={'30px'}
                                />
                            </TopBarButtonContainer>
                        )}
                </TopBarTabsContainer>
                {this.renderPageLinkMenu()}
            </TopBarContainer>
        )
    }

    private handleNameEditInputKeyDown: React.KeyboardEventHandler<
        HTMLInputElement
    > = async (event) => {
        const selectedList = this.props.annotationsCache.lists.byId[
            this.props.selectedListId
        ]

        event.stopPropagation()
        if (
            (event.target as HTMLInputElement).value?.length != null &&
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
                            this.shareInviteButtonRef,
                        )}
                        {this.renderEditMenu(
                            selectedList,
                            this.editPageLinkButtonRef,
                        )}
                        <TooltipBox
                            tooltipText={
                                isPageLink ? 'Edit Page Link' : 'Edit Space'
                            }
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                icon="edit"
                                containerRef={this.editPageLinkButtonRef}
                                onClick={() =>
                                    this.props.openEditMenuForList(
                                        selectedList.unifiedId,
                                    )
                                }
                                heightAndWidth="20px"
                            />
                        </TooltipBox>
                        <TooltipBox
                            tooltipText={
                                isPageLink
                                    ? 'Share Annotated Page'
                                    : 'Share Space'
                            }
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                icon="link"
                                containerRef={this.shareInviteButtonRef}
                                onClick={() =>
                                    this.props.openContextMenuForList(
                                        selectedList.unifiedId,
                                    )
                                }
                                heightAndWidth="20px"
                            />
                        </TooltipBox>
                        <TooltipBox
                            tooltipText={
                                isPageLink ? 'Open Page Link' : 'Go to Space'
                            }
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
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
                                        webUIUrl =
                                            webUIUrl + '&´noAutoOpen=true'
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
                        this.props.spaceTitleEditValue != null
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
                {selectedList.description?.length > 0 && (
                    <SpaceDescription>
                        {selectedList.description}
                    </SpaceDescription>
                )}
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
                    <PermissionsDisplayBox>
                        <Icon
                            icon="peopleFine"
                            heightAndWidth="18px"
                            hoverOff
                            color="greyScale6"
                        />
                        Following
                    </PermissionsDisplayBox>
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
                        getPortalRoot={this.props.getRootElement}
                    >
                        <PermissionsDisplayBox>
                            <Icon
                                icon="personFine"
                                heightAndWidth="18px"
                                hoverOff
                                color="greyScale6"
                            />
                            Creator
                        </PermissionsDisplayBox>
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
                    getPortalRoot={this.props.getRootElement}
                >
                    <PermissionsDisplayBox>
                        <Icon
                            icon="peopleFine"
                            heightAndWidth="18px"
                            hoverOff
                            color="greyScale6"
                        />
                        Contributor
                    </PermissionsDisplayBox>
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
                placement={'bottom-start'}
                offsetX={5}
                offsetY={5}
                closeComponent={() =>
                    this.setState({
                        showSortDropDown: false,
                    })
                }
                width={'fit-content'}
                strategy={'fixed'}
                getPortalRoot={this.props.getRootElement}
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
                {this.renderAllNotesShareMenu()}
                <TopBarActionBtns>
                    <TooltipBox
                        tooltipText={'Sort Notes'}
                        placement={'bottom'}
                        getPortalRoot={this.props.getRootElement}
                    >
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
                    <RightSideContainer>
                        <TooltipBox
                            tooltipText={
                                this.props.isAutoAddEnabled ? (
                                    <span>
                                        New notes are added
                                        <br /> to all Spaces you put the page
                                        into
                                    </span>
                                ) : (
                                    <span>
                                        New notes only added to Spaces
                                        <br /> you manually put them
                                    </span>
                                )
                            }
                            placement={'bottom'}
                            getPortalRoot={this.props.getRootElement}
                        >
                            <AutoAddContainer
                                onClick={(event) => {
                                    event.stopPropagation()
                                    this.props.toggleAutoAdd()
                                }}
                            >
                                <Icon
                                    icon="spread"
                                    heightAndWidth="20px"
                                    hoverOff
                                    color="prime1"
                                />
                                <Checkbox
                                    key={33}
                                    id={'33'}
                                    width="fit-content"
                                    isChecked={
                                        this.props.isAutoAddEnabled === true
                                    }
                                    handleChange={(event) => {
                                        event.stopPropagation()
                                        this.props.toggleAutoAdd()
                                    }}
                                    // isDisabled={!this.state.shortcutsEnabled}
                                    name={
                                        this.props.isAutoAddEnabled
                                            ? 'Is Default'
                                            : 'Make Default'
                                    }
                                    label={'Auto Add'}
                                    fontSize={12}
                                    fontColor={'greyScale5'}
                                    size={14}
                                    textPosition="left"
                                    isLoading={
                                        this.props.isAutoAddEnabled == null
                                    }
                                    checkBoxColor="greyScale4"
                                />
                            </AutoAddContainer>
                        </TooltipBox>
                    </RightSideContainer>

                    {/* <TooltipBox
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
                    </TooltipBox> */}
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
                placement={'bottom-end'}
                closeComponent={() =>
                    this.setState({
                        showPageSpacePicker: !this.state.showPageSpacePicker,
                    })
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                TOOD: Space picker goes here!
            </PopoutBox>
        )
    }
    renderBulkSpacePicker() {
        if (!this.state.showSpacePickerForBulkEdit) {
            return
        }
        return (
            <PopoutBox
                targetElementRef={this.addSpaceBulkButtonRef.current}
                placement={'bottom-end'}
                closeComponent={() =>
                    this.setState({
                        showSpacePickerForBulkEdit: false,
                    })
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderListPickerForBulkEdit()}
            </PopoutBox>
        )
    }
    renderAutoAddBulkSelection() {
        if (!this.state.showAutoAddBulkSelection) {
            return
        }
        return (
            <PopoutBox
                targetElementRef={this.autoAddBulkButtonRef.current}
                placement={'bottom-end'}
                closeComponent={() =>
                    this.setState({
                        showAutoAddBulkSelection: false,
                    })
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                <AutoAddBulkSelectionContainer>
                    <AutoAddBulkSelection
                        onClick={() => {
                            this.setState({
                                showAutoAddBulkSelection: false,
                            })
                            this.props.toggleAutoAddBulk(true)
                        }}
                    >
                        Enable Auto Added
                    </AutoAddBulkSelection>

                    <AutoAddBulkSelection
                        onClick={() => {
                            this.setState({
                                showAutoAddBulkSelection: false,
                            })
                            this.props.toggleAutoAddBulk(false)
                        }}
                    >
                        Disable Auto Added
                    </AutoAddBulkSelection>
                </AutoAddBulkSelectionContainer>
            </PopoutBox>
        )
    }

    renderBulkEditBar() {
        return (
            <BulkEditBarContainer>
                <PrimaryAction
                    onClick={() => this.props.bulkSelectAnnotations([])}
                    label={this.props.bulkSelectionState?.length + ' Selected'}
                    type={'tertiary'}
                    size={'small'}
                    height={'30px'}
                    icon={'removeX'}
                    fontColor={
                        this.theme === 'dark' ? 'greyScale7' : 'greyScale5'
                    }
                    iconPosition="right"
                />

                <BulkEditBarActionBar>
                    <PrimaryAction
                        onClick={() =>
                            this.setState({ showSpacePickerForBulkEdit: true })
                        }
                        label={'Spaces'}
                        type={'tertiary'}
                        size={'small'}
                        height={'30px'}
                        icon={'plus'}
                        innerRef={this.addSpaceBulkButtonRef}
                    />
                    <PrimaryAction
                        onClick={() =>
                            this.setState({ showAutoAddBulkSelection: true })
                        }
                        label={'Change Status'}
                        type={'tertiary'}
                        size={'small'}
                        height={'30px'}
                        icon={'spread'}
                        innerRef={this.autoAddBulkButtonRef}
                    />
                </BulkEditBarActionBar>
                {this.renderAutoAddBulkSelection()}
                {this.renderBulkSpacePicker()}
            </BulkEditBarContainer>
        )
    }

    render() {
        if (!this.state.themeVariant) {
            return null
        }

        return (
            <ResultBodyContainer
                inPageMode={this.props.inPageMode}
                sidebarContext={this.props.sidebarContext}
            >
                {this.props.noteWriteError && (
                    <ErrorNotification
                        closeComponent={() =>
                            this.props.setNoteWriteError(null)
                        }
                        getPortalRoot={this.props.getRootElement}
                        blockedBackground
                        positioning="centerCenter"
                        title="Error saving note"
                        errorMessage={this.props.noteWriteError}
                    />
                )}
                {/* <GlobalStyle sidebarContext={this.props.sidebarContext} /> */}
                <TopBar sidebarContext={this.props.sidebarContext}>
                    {this.renderTopBarSwitcher()}
                    {/* {this.renderSharePageButton()} */}
                    {/* {this.props.sidebarActions()} */}
                </TopBar>
                {this.renderResultsBody(this.state.themeVariant)}
                {this.renderPageShareModal()}
            </ResultBodyContainer>
        )
    }
}

const RemoveListEntryBox = styled.div`
    position: absolute;
    right: 10px;
    display: none;
`

const PromptTemplateButton = styled.div``

const InfoTextTitle = styled.div`
    font-size: 16px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.greyScale7};
`

const DownloadDropArea = styled.div`
    width: fill-available;
    width: -moz-available;
    height: fill-available;
    height: -moz-available;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
    padding: 30px;
    transition: 0.5s ease-in-out opacity;
    color: ${(props) => props.theme.colors.greyScale6};
    outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 8px;

    & * {
        user-select: none;
    }
`

const AddSourcesContainer = styled.div`
    position: absolute;
    right: 0px;
    top: 0px;
`

const TextAreaContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
    width: -moz-available;
    height: fit-content;
    position: relative;
    padding: 15px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const SourcesButtonRow = styled.div`
    padding: 10px 0px;
    //border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    display: flex;
    justify-content: space-between;
    &:last-child {
        border-bottom: none;
    }
`

const ExistingSourcesList = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    width: 100%;
    height: fit-content;
    max-height: 300px;
    overflow: scroll;
    padding: 5px 10px 5px 10px;
    width: fill-available;
    width: -moz-available;
    color: ${(props) => props.theme.colors.greyScale7};
    font-weight: 400;
    font-size: 14px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const ExistingSourcesListItem = styled.div`
    display: flex;
    justify-content: center;
    align-items: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    cursor: pointer;
    flex-direction: column;
    min-width: 10%;
    flex: 1;
    position: relative;

    &:last-child {
        border-bottom: none;
    }

    &:hover ${RemoveListEntryBox} {
        display: flex;
    }
`

const ExistingKnowledgeContainer = styled.div<{
    padding?: string
    gap?: string
}>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: fit-content;
    max-height: 300px;
    overflow: scroll;
    width: fill-available;
    width: -moz-available;
    color: ${(props) => props.theme.colors.greyScale7};
    font-weight: 400;
    font-size: 14px;
    /* grid-gap: 10px; */
    padding: 0 10px 10px 10px;
    padding: ${(props) => props.padding};
    grid-gap: ${(props) => props.gap};
    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const ExistingSourcesListItemImage = styled.div`
    border-radius: 50px;
    height: 50px;
    width: 50px;
`

const ExistingSourcesListItemTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-weight: 500;
    font-size: 14px;
`

const ExistingSourcesListItemUrl = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 400;
    font-size: 14px;
`

const ResultsBodyBox = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
    justify-content: flex-start;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const OnboardingContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    background: ${(props) => props.theme.colors.greyScale1};
    margin: 10px;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
`

const OnboardingTitle = styled.div`
    display: flex;
    font-size: 18px;
    font-weight: bold;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    align-items: center;
    grid-gap: 10px;
`
const OnboardingH2Title = styled.div`
    display: flex;
    font-size: 16px;
    font-weight: 500;
    margin-top: 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    align-items: center;
`

const OnboardingSubtitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    line-height: 24px;
`

const SuggestionsListSwitcher = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    position: sticky;
    top: 0px;
    z-index: 1000;
    background: ${(props) => props.theme.colors.greyScale1}5c;
`

const SuggestionsSwitcherButton = styled.div<{ active }>`
    display: flex;
    width: 33%;
    flex: 1;
    align-items: center;
    border-bottom: 2px solid ${(props) => props.theme.colors.greyScale3};
    height: 30px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 13px;
    cursor: pointer;
    justify-content: center;
    grid-gap: 5px;
    position: relative;

    ${(props) =>
        props.active &&
        css`
            border-bottom: 2px solid ${props.theme.colors.prime2};
        `}
`

const AddSourceIconContainer = styled.div`
    display: flex;
    align-items: center;
    position: absolute;
    right: 5px;
    cursor: pointer;
`

const SuggestionsCounter = styled.div<{ hasResults }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 13px;

    ${(props) =>
        props.hasResults &&
        css`
            color: ${(props) => props.theme.colors.prime1};
        `}
`

const ListSegmentBox = styled.div`
    margin-top: -10px;
`

const AnnotationSuggestionsBox = styled.div`
    display: block;
    width: 100%;
    margin-left: 25px !important;
`
const NoteText = styled(Markdown)`
    display: block;
    width: 100%;
`

const AnnotationEditContainer = styled.div<{ hasHighlight: boolean }>`
    padding: 0px 20px 20px 30px;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0;
    padding: 15px 15px 7px 15px;
    line-height: 20px;
    text-align: left;
    line-break: normal;
    display: flex;
    position: relative;
    margin-bottom: 15px;
`

const StyledPageResult = styled.div<{ isAnnotation: boolean; href: string }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 12px;

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            box-shadow: ${props.theme.borderStyles
                .boxShadowHoverElementsLighter};
            border: 1px solid ${props.theme.colors.greyScale2};
        `};
    ${(props) =>
        props.isAnnotation &&
        css`
            border-bottom: 1px solid ${props.theme.colors.greyScale2};
            border-radius: 12px 12px 0px 0px;
        `};
`

const PageContentBox = styled.div`
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-decoration: none;
    border-radius: 10px;
`

const SuggestionsList = styled.div`
    display: flex;
    grid-gap: 5px;
    flex-direction: column;
    padding: 10px;
    width: fill-available;
    width: -moz-available;
    overflow: scroll;
    padding-bottom: 150px;
    position: relative;
    height: fill-available;
    height: -moz-available;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const SuggestionsCardContainer = styled(ItemBox)`
    margin-bottom: 5px;
`
const SuggestionsCardBox = styled.div`
    margin-bottom: 5px;
    grid-gap: 10px;
    display: flex;
    flex-direction: column;
    padding: 15px;
`
const SuggestionsCardTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    font-weight: 400;
`
const SuggestionsCardUrl = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
`
const SuggestionsDescription = styled(Markdown)`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
`

const ActionButton = styled.div`
    display: none;
    justify-self: flex-start;
    margin-left: -7px;
    margin-bottom: -7px;
`

const ChapterItemTopBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-gap: 10px;
    justify-content: space-between;
    position: relative;
    width: 100%;
`

const ChapterTitleContent = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    grid-gap: 10px;
    width: 100%;
`

const ChapterSummaryText = styled(Markdown)`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    line-height: 24px;
    margin-bottom: 20px;
`

const Highlightbar = styled.div`
    background: ${(props) => props.theme.colors.prime1};
    margin-right: 10px;
    border-radius: 2px;
    width: 5px;
    cursor: pointer;
    position: absolute;
    height: -webkit-fill-available;
`

const SuggestionsDescriptionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 10px;
    align-items: flex-start;
    justify-content: flex-start;
    position: relative;
    padding: 0 20px 15px 20px;
`

const ChapterTitle = styled.div<{ hasSummary }>`
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.white
            : props.theme.colors.greyScale7};
    font-size: 14px;
    flex: 1;
    font-weight: ${(props) => (props.hasSummary ? 500 : 400)};
`

const ChapterItem = styled.div<{
    showButtons: boolean
}>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    grid-gap: 15px;
    width: fill-available;
    border-radius: 8px;
    justify-content: flex-start;
    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    }
    &:hover ${ActionButton} {
        display: flex;
    }
    &:hover ${ChapterTitle} {
        font-weight: 500;
    }

    &:last-child {
        margin-bottom: 150px;
    }

    ${(props) =>
        props.showButtons &&
        css`
            display: flex;
        `}
`

const ChapterTimestamp = styled.a`
    color: ${(props) => props.theme.colors.prime1};
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    width: fit-content;
    text-align: right;
`

const OptionsContainerRight = styled.div`
    display: flex;
    align-items: center;
    position: absolute;
    right: 5px;
`

const AIContainerNotif = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: fit-content;
    width: 100%;
    margin: 30px 0px;
    flex-direction: column;
    padding: 20px 60px;
    width: fill-available;
    width: -moz-available;
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
    text-align: center;
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
    padding: 5px 15px 5px 15px;
    width: fill-available;
    grid-gap: 2px;
    z-index: 101;
    height: 24px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};

    > div {
        flex: 1;
        display: flex;
    }
`
const OptionsContainerLeft = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 12px;
    grid-gap: 3px;
    z-index: 100;
`

const SelectedHeaderButtonBox = styled.div`
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${(props) => props.theme.colors.greyScale7};
    bottom: 2px;
    right: 5px;
    grid-gap: 5px;
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
    flex: 1;
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
`

const QueryContainer = styled.div<{
    AIDropDownShown: boolean
}>`
    height: fit-content;
    padding: 5px 15px 10px 15px;
    display: flex;
    flex-direction: column;
    z-index: 102;
    position: relative;

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
    position: relative;
    height: fill-available;
    /* overflow: scroll; */
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    flex: 1;

    &::-webkit-scrollbar {
        display: none;
    }
    scrollbar-width: none;
`

const SelectedAITextBox = styled.div`
    display: flex;
    padding: 10px 20px 10px 20px;
    align-items: center;
    justify-content: flex-start;
    flex-direction: column;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    max-height: 80%;
    position: relative;
`

const SelectedTextBoxBar = styled.div`
    width: 4px;
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.prime1};
    height: 100%;
`

const SelectedAIText = styled.div<{ fullHeight: boolean }>`
    color: ${(props) => props.theme.colors.white};
    flex: 1;
    font-size: 14px;
    line-height: 22px;
    flex-wrap: wrap;
    display: flex;
    align-items: center;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    overflow: scroll;
    ${(props) =>
        !props.fullHeight &&
        css`
            -webkit-mask-image: -webkit-gradient(
                linear,
                left top,
                left bottom,
                from(rgba(0, 0, 0, 1)),
                to(rgba(0, 0, 0, 0.28))
            );
            -moz-mask-image: -moz-gradient(
                linear,
                left top,
                left bottom,
                from(rgba(0, 0, 0, 1)),
                to(rgba(0, 0, 0, 0.5))
            );
        `};
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
    padding: 10px 0px 10px 0px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
const ChapterContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: flex-start;
    grid-gap: 2px;
    align-items: flex-start;
    min-height: 60px;
    height: 100%;
    overflow: scroll;
    padding: 10px 10px 10px 10px;
`

const SummarySection = styled.div`
    display: flex;
    width: 100%;
    justify-content: flex-start;
    align-items: start;
    flex-direction: column;
    min-height: 10%;
    flex: 1;
`
const ChapterSection = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: start;
    height: fill-available;
    flex: 1;
    height: 30%;
`

const SummaryText = styled.div`
    padding: 0px 20px 20px 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    line-height: 22px;
    white-space: break-spaces;
    flex-direction: column-reverse;

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
const EmptyMessageTitle = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    text-align: center;
    margin-bottom: 10px;
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
    padding-bottom: 10px;
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

    &:first-child {
        margin-top: -10px;
    }

    &:last-child {
        border-bottom: none;
    }
`

const SpaceTypeSectionHeader = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
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

const SpaceTypeSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: fill-available;
    padding-bottom: 30px;
    margin-top: -20px;
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

const TotalAnnotationsCounter = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale5};
    letter-spacing: 4px;
    display: flex;
    align-items: center;
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
    z-index: 1;
    padding: 5px 10px;
            justify-content: flex-start;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    /* background: ${(props) => props.theme.colors.black}80;
    backdrop-filter: blur(8px); */

    &:hover{
        z-index: 19;
    }
`

const AnnotationActions = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: fill-available;
    min-height: 40px;
    padding: 0px 15px 0px 15px;
`

const ActionButtons = styled.div`
    visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
`

const LoaderBox = styled.div<{ height?: string }>`
    height: ${(props) => (props.height ? props.height : '100px')};
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

const LoadingBox = styled.div<{ hasToolTip? }>`
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

const TopBar = styled.div<{ sidebarContext: string }>`
    font-size: 14px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: ${(props) =>
        props.sidebarContext === 'dashboard' ? '60px' : '50px'};
    z-index: 11300;
    padding: 0 10px;

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            /* box-shadow: ${(props) =>
                props.theme.borderStyles.boxShadowBottom}; */
        `};
`

const IsolatedViewHeaderContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 10px;
    flex-direction: column;
    padding: 0px 15px 10px 15px;
    z-index: 20;
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
    grid-gap: 5px;
    width: fill-available;
    width: -moz-available;
    justify-content: space-between;
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
    margin-bottom: 10px;
    line-height: 24px;
`

const FollowedListNotesContainer = styled(Margin)<{
    key?: number
    isHovered?: boolean
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
            z-index: 999;
        `};
`

const sidebarContentOpen = keyframes`
 0% { opacity: 0}
 100% { opacity: 1}
`

const AnnotationContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    /* padding-bottom: 500px;
    overflow-y: scroll;
    overflow-x: visible; */
    padding: 0 10px;
    padding-bottom: 100px;
    z-index: 10;
    position: relative;
    width: fill-available;
    width: -moz-available;
    min-height: fit-content;
    height: fill-available;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    animation-name: ${sidebarContentOpen};
    animation-duration: 200ms;
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

    /* animation-name: ${openAnimation};
    animation-duration: 100ms;
    animation-delay: ${(props) => props.order * 20}ms;
    animation-timing-function: cubic-bezier(0.3, 0.35, 0.14, 0.8);
    animation-fill-mode: forwards; */
    position: relative;
    margin-bottom: 5px;
`

const FollowedNotesContainer = styled.div<{ zIndex: number }>`
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    padding-bottom: 60px;
    z-index: ${(props) => 999 - props.zIndex};
    width: fill-available;
    width: -moz-available;
    overflow: auto;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
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
    zIndex?: number
    keepHovered?: boolean
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

    padding: 0px 15px 0px 10px;
    z-index: ${(props) => 1000 - props.zIndex};

    &:first-child {
        margin-top: 5px;
    }

    &:hover {
        background: ${(props) => props.theme.colors.greyScale2}5c;
    }

    ${(props) =>
        props.keepHovered &&
        css`
            ${ActionButtons} {
                visibility: visible;
            }
        `}

    &:hover ${ActionButtons} {
        visibility: visible;
    }
    margin: 5px;
`

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`

// TODO: stop referring to these styled components as containers
const FollowedListTitleContainer = styled(Margin)<{ context: string }>`
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
const FollowedListTitleBox = styled.div`
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
    width: 100%;
    z-index: 11200;
    margin-top: 5px;
`

const AnnotationSectionScrollContainer = styled.div`
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    height: fill-available;
    overflow-y: auto;
    width: fill-available;
    width: -moz-available;
    height: fit-content;

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
    overflow: hidden;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const TopBarActionBtns = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    display: flex;
    grid-gap: 10px;
    height: 24px;
    width: fill-available;
    width: -moz-available;
    z-index: 10000;
`

const ResultBodyContainer = styled.div<{
    sidebarContext: string
    inPageMode: boolean
}>`
    height: fill-available;
    width: fill-available;
    display: flex;
    flex-direction: column;
    height: 100vh;

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

    ${(props) =>
        props.inPageMode &&
        css`
            height: fill-available;
            height: 100%;
        `}
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: fill-available;
    border: none;
    border-radius: 10px;
`

const SummaryActionsBar = styled.div``

const slideIn = keyframes`
  0% {
    transform: translateX(-50%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

const slideOut = keyframes`
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%);
    opacity: 0;
  }
`

const SummaryActionButtonBox = styled.div`
    display: flex;
    flex: 1;
    height: fill-available;
    justify-content: center;
    & > * {
        width: fill-available;
        width: -moz-available;
    }
`

const SummaryActionsButton = styled.div<{
    inPageMode?: boolean
    active?: boolean
    disabled?: boolean
    padding?: string
}>`
    height: fill-available;
    width: fill-available;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: 1;
    height: fill-available;
    height: -moz-available;
    grid-gap: 5px;
    border-radius: 5px;
    font-size: 14px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    &:hover {
        background: ${(props) =>
            props.theme.variant === 'dark'
                ? props.theme.colors.greyScale2 + '80'
                : props.theme.colors.greyScale6 + '35'};
    }
    color: ${(props) =>
        props.color
            ? props.theme.colors[props.color]
            : props.theme.colors.greyScale5};

    ${(
        { active }, // Destructure width here
    ) =>
        active &&
        css`
            background-color: ${(props) => props.theme.colors.greyScale1};
        `}

    ${(props) =>
        props.inPageMode &&
        css`
            color: ${props.color
                ? props.theme.colors[props.color]
                : props.theme.colors.greyScale5};
            &:hover {
                background: ${(props) =>
                    props.theme.variant === 'dark'
                        ? props.theme.colors.greyScale2 + '80'
                        : props.theme.colors.greyScale6 + '35'};
                backdrop-filter: unset;
            }
            & * {
                color: props.theme.colors.greyScale5;
            }
        `}
    ${(props) =>
        props.disabled &&
        css`
            opacity: 0.8;
            cursor: not-allowed;
            &:hover {
                background-color: none;
            }
        `}
`
const TopBarButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: fill-available;
    width: -moz-available;
`
const LoadingBox2 = styled.div`
    position: absolute;
    right: 25px;
`
const LoadingBox3 = styled.div`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
`

const RightSideContainer = styled.div`
    justify-content: flex-end;
    display: flex;
    flex: 1;
`

const AutoAddContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 4px;
`

const PermissionsDisplayBox = styled.div`
    height: 30px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    border-radius: 5px;
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    background: ${(props) => props.theme.colors.greyScale1};
    cursor: default;
`

const TutorialButtonContainer = styled.div`
    position: absolute;
    right: 20px;
    bottom: 15px;
`
const BulkEditBarContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 0 15px 0 15px;
    min-height: 40px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    margin-bottom: 10px;
    width: 100%;
    width: fill-available;
    justify-content: space-between;
    grid-gap: 10px;
`

const BulkEditBarActionBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 10px;
`

const AutoAddBulkSelectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
    padding: 10px;
    width: fit-content;
`

const AutoAddBulkSelection = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 5px;
    padding: 0 15px;
    height: 40px;
    width: fit-conten;
    border-radius: 5px;
    &:hover {
        cursor: pointer;
        background: ${(props) => props.theme.colors.greyScale2};
    }
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
`
const Spacer = styled.div<{ height?: number }>`
    min-height: ${(props) => props.height ?? '10'}px;
    width: 120px;
`

const PageMetaDataContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 5px;
    width: fill-available;
    width: -moz-available;
    height: 100%;
`
const PageMetadataFormTitle = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 18px;
    font-weight: 700;
    margin-left: 15px;
    margin-bottom: 5px;
`

const PageNotSavedContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 10px;
    border-radius: 5px;
    grid-gap: 10px;
`
const PageNotSavedText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
    display: flex;
    align-items: flex-start;
    grid-gap: 5px;
    margin-bottom: 10px;
    padding: 0 5px;
    width: 100%;
    box-sizing: border-box;
`
