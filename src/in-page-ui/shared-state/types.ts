import TypedEventEmitter from 'typed-emitter'

export type InPageUIComponent = 'ribbon' | 'sidebar'
export type InPageUIState = { [Component in InPageUIComponent]: boolean }
export interface InPageUIEvents {
    stateChanged: (event: {
        newState: InPageUIState
        changes: Partial<InPageUIState>
    }) => void
    componentShouldSetUp: (event: { component: InPageUIComponent }) => void
    componentShouldDestroy: (event: { component: InPageUIComponent }) => void
}
export interface InPageUIInterface {
    events: TypedEventEmitter<InPageUIEvents>
    state: InPageUIState

    showRibbon(): void
    hideRibbon(): void
    showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }): void
    hideSidebar(): void
    toggleSidebar(): void
    toggleHighlights(): void
}
