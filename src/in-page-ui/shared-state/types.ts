import TypedEventEmitter from 'typed-emitter'
import { Anchor } from 'src/highlighting/types'
import { AnnotationSharingAccess } from 'src/content-sharing/ui/types'

export type InPageUISidebarAction =
    | 'annotate'
    | 'comment'
    | 'show_annotation'
    | 'set_sharing_access'
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
    showSidebarOnLoad?: boolean
}

export interface SharedInPageUIInterface {
    events: TypedEventEmitter<SharedInPageUIEvents>
    componentsShown: InPageUIComponentShowState

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): void
    hideRibbon(): void
    removeRibbon(): void
    toggleRibbon(): void
    updateRibbon(): void

    // Sidebar
    showSidebar(options?: SidebarActionOptions): void
    hideSidebar(): void
    toggleSidebar(): void

    // Tooltip
    setupTooltip(): void
    showTooltip(): void
    hideTooltip(): void
    removeTooltip(): void
    toggleTooltip(): void

    // Highlights
    showHighlights(): void
    hideHighlights(): void
    toggleHighlights(): void
}
