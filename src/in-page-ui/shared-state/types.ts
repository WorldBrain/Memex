export interface InPageUIInterface {
    showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }): void
    toggleSidebar(): void
    toggleHighlights(): void
}
