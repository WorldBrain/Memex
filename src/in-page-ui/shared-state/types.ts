import TypedEventEmitter from 'typed-emitter'
import { Anchor } from 'src/highlighting/types'
import { Annotation } from 'src/annotations/types'

export type InPageUISidebarAction = 'annotate' | 'comment' | 'show_annotation'
export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = 'ribbon' | 'sidebar' | 'tooltip'
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
}

export interface SharedInPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIComponentShowState
        changes: Partial<InPageUIComponentShowState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    ribbonUpdate: () => void
    sidebarAction: (event: SidebarActionOptions) => void
    componentShouldSetUp: (event: { component: InPageUIComponent }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}

export interface SharedInPageUIInterface {
    areHighlightsShown: boolean
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
    // TODO: (sidebar-refactor) - this feels out-of-place as part of the public interface here,
    //  but fits in to the idea of SharedInPageUI sending messages between InPageUI comps
    informSidebarOfAnnotation(
        options: Omit<SidebarActionOptions, 'action'>,
    ): void

    // Tooltip
    setupTooltip(): void
    showTooltip(): void
    hideTooltip(): void
    removeTooltip(): void
    toggleTooltip(): void

    // Highlights
    showHighlights(): Promise<boolean>
    hideHighlights(): Promise<void>
    toggleHighlights(): Promise<void>
}
