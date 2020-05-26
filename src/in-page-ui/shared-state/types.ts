import TypedEventEmitter from 'typed-emitter'
import { Anchor } from 'src/highlighting/types'

export type InPageUISidebarAction = 'annotate' | 'comment' | 'show_annotation'
export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = 'ribbon' | 'sidebar' | 'tooltip'
export type InPageUIState = { [Component in InPageUIComponent]: boolean }
export interface SidebarActionOptions {
    action: InPageUISidebarAction
    anchor?: Anchor
    annotationUrl?: string
}
export interface InPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIState
        changes: Partial<InPageUIState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    ribbonUpdate: () => void
    sidebarAction: (event: SidebarActionOptions) => void
    componentShouldSetUp: (event: { component: InPageUIComponent }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}

export interface InPageUIInterface {
    areHighlightsShown: boolean
    events: TypedEventEmitter<InPageUIEvents>
    state: InPageUIState

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
    showHighlights(): Promise<boolean>
    hideHighlights(): Promise<void>
    toggleHighlights(): Promise<void>
}
