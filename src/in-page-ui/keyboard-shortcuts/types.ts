export interface Shortcut {
    enabled: boolean
    shortcut: string
    altName?: keyof AlternativeKeyboardShortcuts
}

export interface BaseKeyboardShortcuts {
    shortcutsEnabled?: boolean
    createAnnotation: Shortcut
    createHighlight: Shortcut
    toggleHighlights: Shortcut
    addToCollection: Shortcut
    createBookmark: Shortcut
    toggleSidebar: Shortcut
    openDashboard: Shortcut
    addComment: Shortcut
    addTag: Shortcut
    link: Shortcut
}

export interface AlternativeKeyboardShortcuts {
    createSharedAnnotation: Shortcut
    createSharedHighlight: Shortcut
}

export type KeyboardShortcuts = BaseKeyboardShortcuts &
    AlternativeKeyboardShortcuts
