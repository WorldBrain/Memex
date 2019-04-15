export interface Shortcut {
    enabled: boolean
    shortcut: string
}

export interface KeyboardShortcuts {
    shortcutsEnabled?: boolean
    createAnnotation: Shortcut
    toggleHighlights: Shortcut
    addToCollection: Shortcut
    createBookmark: Shortcut
    toggleSidebar: Shortcut
    addComment: Shortcut
    highlight: Shortcut
    addTag: Shortcut
    link: Shortcut
}
