import type TypedEventEmitter from 'typed-emitter'
import type { Anchor } from 'src/highlighting/types'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type {
    UnifiedAnnotation,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { Resolvable } from 'src/util/resolvable'
import type {
    OnDemandInPageUIComponents,
    OnDemandInPageUIProps,
} from 'src/search-injection/types'
import type { ContentScriptComponent } from 'src/content-scripts/types'

export type InPageUISidebarAction =
    | 'comment'
    | 'edit_annotation'
    | 'edit_annotation_spaces'
    | 'show_annotation'
    | 'set_sharing_access'
    | 'show_shared_spaces'
    | 'selected_list_mode_from_web_ui'
    | 'show_my_annotations'
    | 'check_sidebar_status'
    | 'show_page_summary'
    | 'rabbit_hole_open'
    | 'youtube_timestamp'
    | 'set_focus_mode'
    | 'show_transcript'
    | 'create_youtube_timestamp_with_AI_summary'
    | 'create_youtube_timestamp_with_screenshot'
    | 'open_chapter_summary'
    | 'save_image_as_new_note'
    | 'cite_page'
    | 'share_page_link'

export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = ContentScriptComponent

export type InPageUIComponentShowState = {
    [Component in InPageUIComponent]: boolean
}

export interface IncomingAnnotationData {
    highlightText?: string
    commentText?: string
    isBookmarked?: boolean
    tags?: string[]
}

// TODO: Improve this type so possible fields depend on `action` type
export interface SidebarActionOptions {
    action: InPageUISidebarAction
    anchor?: Anchor
    annotationLocalId?: string
    /** Set this for 'selected_list_mode_from_web_ui' */
    sharedListId?: string
    manuallyPullLocalListData?: boolean
    annotationCacheId?: UnifiedAnnotation['unifiedId']
    annotationData?: IncomingAnnotationData
    annotationSharingAccess?: AnnotationSharingAccess
    highlightedText?: string
    commentText?: string
    listId?: number
    videoRangeTimestamps?: number[]
    imageData?: string
    prompt?: string
}
export interface ToolTipActionOptions {
    annotationCacheId?: UnifiedAnnotation['unifiedId']
    selection?: Selection
    openForSpaces?: boolean
}

export interface SharedInPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIComponentShowState
        changes: Partial<InPageUIComponentShowState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    ribbonUpdate: () => void
    sidebarAction: (event: SidebarActionOptions) => void
    tooltipAction: (event: ToolTipActionOptions) => void
    componentShouldSetUp: (event: {
        component: InPageUIComponent
        options?: ShouldSetUpOptions
    }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
    injectOnDemandInPageUI: (event: {
        component: OnDemandInPageUIComponents
        options?: OnDemandInPageUIProps
    }) => void
}

export interface ShouldSetUpOptions {
    keepRibbonHidden?: boolean
    showSidebarOnLoad?: boolean
    showPageActivityIndicator?: boolean
    openInAIMode?: boolean
}

export interface SharedInPageUIInterface {
    events: TypedEventEmitter<SharedInPageUIEvents>
    componentsShown: InPageUIComponentShowState

    // Misc. states that need to be shared between content scripts
    selectedList: UnifiedList['unifiedId'] | null
    /** Resolves when all data is loaded to hydate UI annotations/lists cache. */
    cacheLoadPromise: Resolvable<void>

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): Promise<void>
    hideRibbon(): Promise<void>
    removeRibbon(): Promise<void>
    toggleRibbon(): Promise<void>
    updateRibbon(): void

    // Sidebar
    showSidebar(options?: SidebarActionOptions): Promise<void>
    hideSidebar(): Promise<void>
    toggleSidebar(): Promise<void>

    // Tooltip
    showTooltip(options?: ToolTipActionOptions): Promise<void>
    hideTooltip(): Promise<void>
    removeTooltip(): Promise<void>
    toggleTooltip(): Promise<void>

    // Highlights
    showHighlights(): Promise<void>
    hideHighlights(): Promise<void>
    toggleHighlights(): Promise<void>

    // On-demand in-page UIs
    loadOnDemandInPageUI(params: {
        component: OnDemandInPageUIComponents
        options?: OnDemandInPageUIProps
    }): void
}
