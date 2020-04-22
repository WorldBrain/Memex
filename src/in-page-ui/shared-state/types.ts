export interface InPageUIInterface {
    showRibbon(): void
    hideRibbon(): void
    showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }): void
    hideSidebar(): void
    toggleSidebar(): void
    toggleHighlights(): void
}
