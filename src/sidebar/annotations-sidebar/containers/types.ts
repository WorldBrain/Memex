import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type {
    AnnotationConversationEvent,
    AnnotationConversationsState,
} from '@worldbrain/memex-common/lib/content-conversations/ui/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import type { AnnotationCardInstanceLocation, SidebarTheme } from '../types'
import type {
    AnnotationSharingStates,
    ContentSharingInterface,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { Analytics } from 'src/analytics'
import type { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type { AnnotationsSorter } from '../sorting'
import type { ContentConversationsInterface } from 'src/content-conversations/background/types'
import type { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { MemexTheme } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import type {
    PageAnnotationsCacheInterface,
    RGBAColor,
    UnifiedAnnotation,
    UnifiedList,
    UnifiedListForCache,
} from 'src/annotations/cache/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { SummarizationInterface } from 'src/summarization-llm/background/index'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import type { YoutubeService } from '@worldbrain/memex-common/lib/services/youtube'
import type { Storage, Runtime } from 'webextension-polyfill'
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import type { ListPickerShowState } from 'src/dashboard-refactor/search-results/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { ImageSupportInterface } from 'src/image-support/background/types'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    fullPageUrl?: string
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    sidebarContext: 'dashboard' | 'in-page' | 'pdf-viewer'
    onClickOutside?: React.MouseEventHandler
    showAnnotationShareModal?: () => void

    storageAPI: Storage.Static
    runtimeAPI: Runtime.Static
    shouldHydrateCacheOnInit?: boolean
    annotationsCache: PageAnnotationsCacheInterface
    analyticsBG: AnalyticsCoreInterface

    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    summarizeBG: SummarizationInterface<'caller'>
    annotationsBG: AnnotationInterface<'caller'>
    customListsBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
    contentSharingByTabsBG: RemoteContentSharingByTabsInterface<'caller'>
    contentConversationsBG: ContentConversationsInterface
    imageSupportBG: ImageSupportInterface<'caller'>
    syncSettingsBG: RemoteSyncSettingsInterface
    contentScriptsBG: ContentScriptsInterface<'caller'>
    pageIndexingBG: PageIndexingInterface<'caller'>
    authBG: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme: MemexTheme & Partial<SidebarTheme>

    getCurrentUser: () => UserReference | null
    // search: SearchInterface
    // bookmarks: BookmarksInterface
    analytics: Analytics
    copyPaster: RemoteCopyPasterInterface
    youtubePlayer?: YoutubePlayer
    youtubeService?: YoutubeService
    hasFeedActivity?: boolean
    clickFeedActivityIndicator?: () => void
    copyToClipboard: (text: string) => Promise<boolean>
    getRootElement: () => HTMLElement
}

export interface EditForm {
    isBookmarked: boolean
    commentText: string
    lists: number[]
}

export interface EditForms {
    [annotationUrl: string]: EditForm
}

export type SidebarTab =
    | 'annotations'
    | 'spaces'
    | 'feed'
    | 'summary'
    | 'rabbitHole'
export type SidebarAITab = 'ThisPage' | 'ExistingKnowledge' | 'InFollowedFeeds'

export type SuggestionsTab =
    | 'MySuggestions'
    | 'RSSsuggestions'
    | 'OtherSuggestions'

export interface SidebarContainerState extends AnnotationConversationsState {
    loadState: TaskState
    cacheLoadState: TaskState
    noteWriteError: string | null
    noteEditState: TaskState
    noteCreateState: TaskState
    noteColorUpdateState: TaskState
    firstTimeSharingPageLink: boolean
    secondarySearchState: TaskState
    remoteAnnotationsLoadState: TaskState
    foreignSelectedListLoadState: TaskState
    selectedTextAIPreview: string
    queryMode: string
    isTrial: boolean
    signupDate: number
    showState: 'visible' | 'hidden'
    isLocked: boolean
    isWidthLocked: boolean
    showAISuggestionsDropDown: boolean
    showAICounter: boolean
    hasKey: boolean
    isKeyValid: boolean
    AIsuggestions: { prompt: string; focused: boolean | null }[]
    youtubeTranscriptJSON: string
    highlightColors: string
    spaceSearchSuggestions: any
    suggestionsResults: SuggestionCard[]
    suggestionsResultsLoadState: TaskState

    activeTab: SidebarTab
    activeAITab: SidebarAITab
    summaryModeActiveTab: 'Answer' | 'References'
    isAutoAddEnabled: boolean
    activeSuggestionsTab: SuggestionsTab
    showChapters: boolean
    pillVisibility: string
    renameListErrorMessage: string | null

    sidebarWidth?: string
    sidebarRightBorderPosition?: number
    spaceTitleEditValue?: string
    existingFeedSources?: {
        feedTitle: string
        feedUrl: string
        feedFavIcon?: string
        type?: 'substack' | string
        confirmState?: TaskState | string
    }[]

    // Indicates what is the currently selected space in the leaf screen
    // for the side bar, also known as the isolated view. When a space
    // is selected, all operations default to use that selected space
    // except if explicity told otherwise.
    selectedListId: UnifiedList['unifiedId'] | null

    existingSourcesOption:
        | 'pristine'
        | 'existingKnowledge'
        | 'twitter'
        | 'localFolder'
        | 'obsidian'
        | 'logseq'

    annotationSharingAccess: AnnotationSharingAccess
    readingView?: boolean
    showAllNotesCopyPaster: boolean

    fullPageUrl?: string
    /** Keeps track of lists for which this page has remote activity (e.g., other users adding it to a collab list) */
    pageActiveListIds: UnifiedList['unifiedId'][]
    /** Mirrors the annotations cache state of the same name */
    pageListIds: Set<UnifiedList['unifiedId']>
    lists: PageAnnotationsCacheInterface['lists']

    annotations: PageAnnotationsCacheInterface['annotations']

    pageSummary: string
    prompt: string

    /** TODO: Properly set up logic to use this state instead of querying for user each time. */
    currentUserReference: UserReference | null
    users: {
        [userId: string]: {
            name: string
            profileImgSrc?: string
        }
    }

    activeAnnotationId: UnifiedAnnotation['unifiedId'] | null
    activeListContextMenuId: UnifiedList['unifiedId'] | null
    activeListEditMenuId: UnifiedList['unifiedId'] | null

    listInstances: { [unifiedListId: UnifiedList['unifiedId']]: ListInstance }
    annotationCardInstances: { [instanceId: string]: AnnotationCardInstance }
    deleteConfirmMode: boolean

    spacePickerAnnotationInstance: {
        instanceId: string
        position: ListPickerShowState
    } | null
    copyPasterAnnotationInstanceId: string | null
    shareMenuAnnotationInstanceId: string | null

    showCommentBox: boolean
    commentBox: EditForm

    pageCount: number
    noResults: boolean

    showCongratsMessage: boolean
    showClearFiltersBtn: boolean

    // Filter sidebar props
    showFiltersSidebar: boolean
    showSocialSearch: boolean
    shouldShowTagsUIs: boolean
    showUpgradeModal: boolean
    desktopAppDownloadLink: string

    annotCount?: number
    showLengthError?: boolean
    youtubeTranscriptSummary?: string
    youtubeTranscriptSummaryloadState: TaskState
    fetchLocalHTML: boolean
    rabbitHoleBetaFeatureAccess:
        | 'denied'
        | 'granted'
        | 'grantedBcOfSubscription'
        | 'requested'
        | 'tutorial'
        | 'onboarded'
        | 'onboarding'
        | 'downloadStarted'
        | 'helperConnectionDenied'
        | 'helperConnectionSuccess'
        | null

    // Search result propsallowed
    shouldShowCount: boolean
    isInvalidSearch: boolean
    totalResultCount: number
    searchResultSkip: number

    isListFilterActive: boolean
    showLoginModal: boolean
    showDisplayNameSetupModal: boolean
    showAnnotationsShareModal: boolean
    popoutsActive: boolean

    confirmPrivatizeNoteArgs: null | SidebarEvents['editAnnotation']
    confirmSelectNoteSpaceArgs: null | SidebarEvents['updateListsForAnnotation']

    showAllNotesShareMenu: boolean
    activeShareMenuNoteId: string | undefined
    immediatelyShareNotes: boolean
    pageHasNetworkAnnotations: boolean
    hasFeedActivity?: boolean
    showPageLinkShareMenu: boolean
    showPageCitationMenu: boolean
    /**
     * In the case of a page being opened from the web UI for a page link, data
     * may need to be manually pulled as sync might not have finished by the time the
     * sidebar loads. This state signifies that condition.
     */
    hasListDataBeenManuallyPulled?: boolean
    annotationCreateEditorRef?: any
    videoDetails: null
    chapterList: {
        start: number
        humanReadableTimestamp: string
        videoURLWithTime: string
        title: string
    }[]
    chapterSummaries: {
        [chapterIndex: number]: {
            chapterIndex: number
            summary: string
            loadingState: TaskState
        }
    }
    AImodel: 'gpt-3.5-turbo-1106' | 'gpt-4-0613' | 'gpt-4-32k'
    localFoldersList: LocalFolder[]
    showFeedSourcesMenu: boolean
    bulkSelectionState: string[]
}

export interface LocalFolder {
    path: string
    sourceApplication: 'local' | 'obsidian' | 'logseq'
    id: number
}

export type AnnotationEvent<T> = {
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
} & T

export type AnnotationCardInstanceEvent<T> = {
    instanceLocation: AnnotationCardInstanceLocation
} & AnnotationEvent<T>

interface SidebarEvents {
    show: { existingWidthState: string }
    hide: null
    lock: null
    unlock: null
    lockWidth: null
    unlockWidth: null
    adjustSidebarWidth: { newWidth: string; isWidthLocked?: boolean }
    adjustRighPositionBasedOnRibbonPosition: { position: number }
    setPopoutsActive: boolean
    checkIfKeyValid: { apiKey: string }
    saveAIPrompt: { prompt: string }
    removeAISuggestion: { suggestion: string }
    navigateFocusInList: { direction: 'up' | 'down' }
    setSpaceTitleEditValue: { value: string }
    setSharingTutorialVisibility: null
    toggleAutoAdd: null
    getAnnotationEditorIntoState: { ref: any }
    createYoutubeTimestampWithAISummary: {
        videoRangeTimestamps: {
            startTimeSecs: number
            endTimeSecs: number
        }
        prompt: string
    }
    setExistingSourcesOptions:
        | 'pristine'
        | 'existingKnowledge'
        | 'twitter'
        | 'localFolder'
        | 'obsidian'
        | 'logseq'
    processFileImportFeeds: { fileString: string }
    getHighlightColorSettings: null
    updateSpacesSearchSuggestions: { searchQuery: string }
    saveHighlightColor: {
        noteId: string
        color: RGBAColor
        colorId: string
    }
    saveFeedSources: {
        sources: string
    }
    removeFeedSource: {
        feedUrl: string
    }
    loadFeedSources: null
    saveHighlightColorSettings: { newState: string }
    youtubeTranscriptJSON: null
    saveImageAsNewNote: {
        imageData: string
    }
    createYoutubeTimestampWithScreenshot: {
        imageData: string
    }
    getVideoChapters: null
    addedKey: null
    summariseChapter: {
        chapterIndex: number
    }

    createNewNoteFromAISummary: { comment: string }

    setActiveSidebarTab: {
        tab: SidebarTab
        textToProcess?: string
        url?: string
        prompt?: string
    }
    setActiveSuggestionsTab: {
        tab: SuggestionsTab
    }
    setSummaryMode: {
        tab: 'Answer' | 'References'
    }
    setFeedSourcesMenu: null
    setActiveAITab: {
        tab: SidebarAITab
    }
    askAIviaInPageInteractions: {
        textToProcess?: string
        url?: string
        prompt?: string
    }
    selectAISuggestion: { suggestion: string }
    queryAIwithPrompt: {
        prompt: string
        highlightedText?: string
        queryMode?: string
    }
    setQueryMode: {
        mode: string
    }
    setAIModel: 'gpt-3.5-turbo-1106' | 'gpt-4-0613' | 'gpt-4-32k'

    toggleAISuggestionsDropDown: null
    removeSelectedTextAIPreview: null
    updatePromptState: {
        prompt: string
    }
    sortAnnotations: { sortingFn: AnnotationsSorter }
    receiveSharingAccessChange: {
        sharingAccess: AnnotationSharingAccess
    }

    // New page note box
    setNewPageNoteText: { comment: string }
    saveNewPageNote: {
        shouldShare: boolean
        isProtected?: boolean
        annotationId?: string
        /** To be set if being called from a toggled list instance's create form. */
        listInstanceId?: UnifiedList['unifiedId']
        now?: number
    }
    cancelNewPageNote: null
    setNewPageNoteLists: { lists: number[] }

    // List instance events
    expandListAnnotations: { unifiedListId: UnifiedList['unifiedId'] }
    markFeedAsRead: null
    bulkSelectAnnotations: {
        annotationIds: UnifiedAnnotation['unifiedId'][]
    }

    toggleAutoAddBulk: { shouldAutoAdd: boolean }

    // Annotation card instance events
    setAnnotationEditCommentText: AnnotationCardInstanceEvent<{
        comment: string
        annotation: Pick<
            UnifiedAnnotation,
            'unifiedId' | 'privacyLevel' | 'normalizedPageUrl' | 'localId'
        >
    }>
    setAnnotationEditBodyText: AnnotationCardInstanceEvent<{
        body: string
        annotation: Pick<
            UnifiedAnnotation,
            'unifiedId' | 'privacyLevel' | 'normalizedPageUrl' | 'localId'
        >
    }>
    setAnnotationCardMode: AnnotationCardInstanceEvent<{
        mode: AnnotationCardMode
    }>
    setAnnotationEditMode: AnnotationCardInstanceEvent<{ isEditing: boolean }>
    setHighlightEditMode: AnnotationCardInstanceEvent<{ isEditing: boolean }>
    cancelAnnotationEdit: AnnotationCardInstanceEvent<{ isEditing: boolean }>
    setAnnotationCommentMode: AnnotationCardInstanceEvent<{
        isTruncated: boolean
    }>
    editAnnotation: AnnotationCardInstanceEvent<{
        shouldShare: boolean
        isProtected?: boolean
        mainBtnPressed?: boolean
        keepListsIfUnsharing?: boolean
        now?: number
    }>

    // Annotation events
    deleteAnnotation: AnnotationEvent<{}>
    setActiveAnnotation: AnnotationEvent<{
        mode?: 'show' | 'edit' | 'edit_spaces'
        source?: 'highlightInPage' | 'highlightCard'
    }>
    updateListsForAnnotation: AnnotationEvent<{
        added: number | null
        deleted: number | null
        options?: { protectAnnotation?: boolean }
    }>
    updateListsForAnnotationS: {
        added: number | null
        deleted: number | null
    }
    updateAnnotationShareInfo: AnnotationEvent<{
        keepListsIfUnsharing?: boolean
        privacyLevel: AnnotationPrivacyLevels
    }>
    updateAllAnnotationsShareInfo: AnnotationSharingStates
    setSpacePickerAnnotationInstance: {
        state: SidebarContainerState['spacePickerAnnotationInstance']
    }
    setCopyPasterAnnotationInstanceId: { instanceId: string | null }
    setShareMenuAnnotationInstanceId: { instanceId: string | null }
    setNoteWriteError: { error: string | null }

    // Selected space management
    setSelectedList: { unifiedListId: UnifiedList['unifiedId'] | null }
    setSelectedListFromWebUI: {
        sharedListId: string
        manuallyPullLocalListData?: boolean
    }

    changeFetchLocalHTML: { shouldFetch: boolean }

    openContextMenuForList: { unifiedListId: UnifiedList['unifiedId'] }
    openEditMenuForList: { unifiedListId: UnifiedList['unifiedId'] }
    closePageLinkShareMenu: null
    openPageLinkShareMenu: null
    openPageCitationMenu: null
    editListName: {
        unifiedListId: UnifiedList['unifiedId']
        localId: number
        newName: string
        oldName: string
    }
    deleteList: { unifiedListId: UnifiedList['unifiedId'] }
    setListPrivacy: {
        unifiedListId: UnifiedList['unifiedId']
        isPrivate: boolean
    }

    goToAnnotationInNewTab: {
        unifiedAnnotationId?: UnifiedAnnotation['unifiedId']
    }

    // Misc events
    copyNoteLink: { link: string }
    copyPageLink: { link: string }

    setPageUrl: {
        fullPageUrl: string
        skipListsLoad?: boolean
        rerenderHighlights?: boolean
    }

    openWebUIPageForSpace: { unifiedListId: UnifiedList['unifiedId'] }

    // Search
    paginateSearch: null
    setPillVisibility: { value: string }
    setAnnotationsExpanded: { value: boolean }
    fetchSuggestedTags: null
    fetchSuggestedDomains: null

    setLoginModalShown: { shown: boolean }
    setDisplayNameSetupModalShown: { shown: boolean }
    setAnnotationShareModalShown: { shown: boolean }
    setBetaFeatureNotifModalShown: { shown: boolean }

    setPrivatizeNoteConfirmArgs: SidebarContainerState['confirmPrivatizeNoteArgs']
    setSelectNoteSpaceConfirmArgs: SidebarContainerState['confirmSelectNoteSpaceArgs']

    setAllNotesCopyPasterShown: { shown: boolean }
    setAllNotesShareMenuShown: { shown: boolean }

    setRabbitHoleBetaFeatureAccess: {
        permission:
            | 'denied'
            | 'granted'
            | 'requested'
            | 'tutorial'
            | 'onboarded'
            | 'onboarding'
            | 'downloadStarted'
            | 'helperConnectionDenied'
            | 'helperConnectionSuccess'
            | null
    }
    requestRabbitHoleBetaFeatureAccess: { reasonText: string }
    openLocalFile: { path: string }
    addLocalFolder: null
    removeLocalFolder: { id: number }
    getLocalFolders: null
    setCopyPasterDefaultNoteExecute: AnnotationCardInstanceEvent<{
        noteId: string
    }>
}

export type SidebarContainerEvents = UIEvent<
    AnnotationConversationEvent & SidebarEvents
>

export type AnnotationCardMode =
    | 'none'
    | 'copy-paster'
    | 'space-picker'
    | 'share-menu'
    | 'save-btn'
    | 'delete-confirm'
    | 'formatting-help'

export interface AnnotationCardInstance {
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
    isCommentTruncated: boolean
    isCommentEditing: boolean
    isHighlightEditing: boolean
    cardMode: AnnotationCardMode
    comment: string
    body: string
    color: string
    copyLoadingState: TaskState
    isBulkSelected: boolean
}
export interface SuggestionCard {
    fullUrl: UnifiedAnnotation['unifiedId']
    pageTitle: string
    contentText?: string
    contentType: 'page' | 'annotation' | 'rss-feed-item' | 'pdf' | 'markdown'
    creatorId?: UserReference['id']
    spaces?: any
    body?: string
    comment?: string
    unifiedId?: UnifiedAnnotation['unifiedId']
    sourceApplication?: string
    distance?: number
    path?: string
    topLevelFolder?: string
}

export interface ListInstance {
    unifiedListId: UnifiedList['unifiedId']
    annotationRefsLoadState: TaskState
    conversationsLoadState: TaskState
    annotationsLoadState: TaskState
    sharedAnnotationReferences?: SharedAnnotationReference[]
    isOpen: boolean
}

export interface AnnotationInstanceRefs {
    spacePickerFooterBtn: React.RefObject<HTMLDivElement>
    spacePickerBodyBtn: React.RefObject<HTMLDivElement>
    copyPasterBtn: React.RefObject<HTMLDivElement>
    shareMenuBtn: React.RefObject<HTMLDivElement>
}
