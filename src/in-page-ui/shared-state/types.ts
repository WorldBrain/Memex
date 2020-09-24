import TypedEventEmitter from 'typed-emitter'
import { Anchor } from 'src/highlighting/types'
import { AnnotationSharingAccess } from 'src/content-sharing/ui/types'

export type InPageUISidebarAction =
    | 'annotate'
    | 'comment'
    | 'edit_annotation'
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
