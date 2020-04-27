import TypedEventEmitter from 'typed-emitter'

export type InPageUISidebarAction = 'annotate' | 'comment'
export type InPageUIRibbonAction = 'comment' | 'tag' | 'list' | 'bookmark'
export type InPageUIComponent = 'ribbon' | 'sidebar'
export type InPageUIState = { [Component in InPageUIComponent]: boolean }
export interface InPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIState
        changes: Partial<InPageUIState>
    }) => void
    ribbonAction: (event: { action: InPageUIRibbonAction }) => void
    sidebarAction: (event: { action: InPageUISidebarAction }) => void
    componentShouldSetUp: (event: { component: InPageUIComponent }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}

export interface InPageUIInterface {
    events: TypedEventEmitter<InPageUIEvents>
    state: InPageUIState

    showRibbon(options?: { action?: InPageUIRibbonAction }): void
    hideRibbon(): void
    removeRibbon(): void

    showSidebar(options?: { action?: InPageUISidebarAction }): void
    hideSidebar(): void
    toggleSidebar(): void
    toggleHighlights(): void
}
