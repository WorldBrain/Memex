export const KEYBOARDSHORTCUTS_STORAGE_NAME = 'memex-keyboardshortcuts'

export const KEYBOARDSHORTCUTS_DEFAULT_STATE = {
    shortcutsEnabled: true,
    linkShortcut: 'shift+l',
    openDashboardShortcut: checkOperatingSystem() + '+f',
    toggleSidebarShortcut: checkOperatingSystem() + '+q',
    toggleHighlightsShortcut: checkOperatingSystem() + '+r',
    createAnnotationShortcut: checkOperatingSystem() + '+w',
    createHighlightShortcut: checkOperatingSystem() + '+a',
    createBookmarkShortcut: checkOperatingSystem() + '+s',
    addTagShortcut: checkOperatingSystem() + '+x',
    addToCollectionShortcut: checkOperatingSystem() + '+c',
    addCommentShortcut: checkOperatingSystem() + '+e',
    linkShortcutEnabled: false,
    toggleSidebarShortcutEnabled: true,
    toggleHighlightsShortcutEnabled: true,
    createAnnotationShortcutEnabled: true,
    createBookmarkShortcutEnabled: true,
    createHighlightShortcutEnabled: true,
    addTagShortcutEnabled: true,
    addToCollectionShortcutEnabled: true,
    addCommentShortcutEnabled: true,
    openDashboardShortcutEnabled: true,
}

function checkOperatingSystem() {
    let OperatingSystem = navigator.platform

    if (OperatingSystem.startsWith('Linux')) {
        return 'alt'
    }

    if (OperatingSystem.startsWith('Mac')) {
        return 'option'
    }
    if (OperatingSystem.startsWith('Win')) {
        return 'alt'
    }
}
