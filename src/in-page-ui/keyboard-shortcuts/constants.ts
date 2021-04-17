import { getKeyName } from 'src/util/os-specific-key-names'

export const KEYBOARDSHORTCUTS_STORAGE_NAME = 'memex-keyboardshortcuts'

const altKey = getKeyName({ key: 'alt' })

export const KEYBOARDSHORTCUTS_DEFAULT_STATE = {
    shortcutsEnabled: true,
    linkShortcut: 'shift+l',
    openDashboardShortcut: altKey + '+f',
    toggleSidebarShortcut: altKey + '+q',
    toggleHighlightsShortcut: altKey + '+r',
    createAnnotationShortcut: altKey + '+w',
    createHighlightShortcut: altKey + '+a',
    createBookmarkShortcut: altKey + '+s',
    addTagShortcut: altKey + '+x',
    addToCollectionShortcut: altKey + '+c',
    addCommentShortcut: altKey + '+e',
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
