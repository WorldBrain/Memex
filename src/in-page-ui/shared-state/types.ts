import type TypedEventEmitter from 'typed-emitter'
import type { Anchor } from 'src/highlighting/types'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type { UnifiedList } from 'src/annotations/cache/types'

export type InPageUISidebarAction =
    | 'comment'
    | 'edit_annotation'
    | 'edit_annotation_spaces'
    | 'show_annotation'
    | 'set_sharing_access'
    | 'show_shared_spaces'
export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = 'ribbon' | 'sidebar' | 'tooltip' | 'highlights'
export type InPageUIComponentShowState = {
    [Component in InPageUIComponent]: boolean
}

export interface IncomingAnnotationData {
    highlightText?: string
    commentText?: string
    isBookmarked?: boolean
    tags?: string[]
}

export interface SidebarActionOptions {
    action: InPageUISidebarAction
    anchor?: Anchor
    annotationUrl?: string
    annotationData?: IncomingAnnotationData
    annotationSharingAccess?: AnnotationSharingAccess
}

export interface SharedInPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIComponentShowState
        changes: Partial<InPageUIComponentShowState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    ribbonUpdate: () => void
    sidebarAction: (event: SidebarActionOptions) => void
    componentShouldSetUp: (event: {
        component: InPageUIComponent
        options?: ShouldSetUpOptions
    }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}

export interface ShouldSetUpOptions {
    keepRibbonHidden?: boolean
    showSidebarOnLoad?: boolean
    showPageActivityIndicator?: boolean
}

export interface SharedInPageUIInterface {
    events: TypedEventEmitter<SharedInPageUIEvents>
    componentsShown: InPageUIComponentShowState
    selectedList: UnifiedList['unifiedId'] | null

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
    showTooltip(): Promise<void>
    hideTooltip(): Promise<void>
    setupTooltip(): Promise<void>
    removeTooltip(): Promise<void>
    toggleTooltip(): Promise<void>

    // Highlights
    showHighlights(): Promise<void>
    hideHighlights(): Promise<void>
    toggleHighlights(): Promise<void>
}
