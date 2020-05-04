import TypedEventEmitter from 'typed-emitter'
import { Anchor } from 'src/highlighting/types'

export type InPageUISidebarAction = 'annotate' | 'comment'
export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = 'ribbon' | 'sidebar' | 'tooltip'
export type InPageUIState = { [Component in InPageUIComponent]: boolean }
export interface InPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIState
        changes: Partial<InPageUIState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    ribbonUpdate: () => void
    sidebarAction: (event: {
        action: InPageUISidebarAction
        anchor?: Anchor
    }) => void
    componentShouldSetUp: (event: { component: InPageUIComponent }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}

export interface InPageUIInterface {
    events: TypedEventEmitter<InPageUIEvents>
    state: InPageUIState

    // Ribbon
    showRibbon(options?: { action?: InPageUIRibbonAction }): void
    hideRibbon(): void
    removeRibbon(): void
    toggleRibbon(): void
    updateRibbon(): void

    // Sidebar
    showSidebar(options?: {
        action?: InPageUISidebarAction
        anchor?: Anchor
    }): void
    hideSidebar(): void
    toggleSidebar(): void

    // Tooltip
    setupTooltip(): void
    showTooltip(): void
    hideTooltip(): void
    removeTooltip(): void
    toggleTooltip(): void

    // Highlights
    toggleHighlights(): void
}
