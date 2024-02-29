import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import type { SyncSettingsByFeature } from 'src/sync-settings/background/types'

export const KEYBOARDSHORTCUTS_STORAGE_NAME = 'memex-keyboardshortcuts'

const altKey = getKeyName({ key: 'alt' })

export const KEYBOARDSHORTCUTS_DEFAULT_STATE: SyncSettingsByFeature['extension']['keyboardShortcuts'] = {
    shortcutsEnabled: true,
    openDashboardShortcut: altKey + '+f',
    toggleSidebarShortcut: altKey + '+d',
    toggleHighlightsShortcut: altKey + '+r',
    createAnnotationShortcut: altKey + '+a',
    copyCurrentLinkShortcut: altKey + '+l',
    createHighlightShortcut: altKey + '+w',
    createBookmarkShortcut: altKey + '+q',
    addToCollectionShortcut: altKey + '+s',
    sharePageShortcut: altKey + '+c',
    askAIShortcut: altKey + '+y',
    addCommentShortcut: altKey + '+e',
    toggleSidebarShortcutEnabled: true,
    toggleHighlightsShortcutEnabled: true,
    askAIShortcutEnabled: true,
    createAnnotationShortcutEnabled: true,
    createBookmarkShortcutEnabled: true,
    createHighlightShortcutEnabled: true,
    copyCurrentLinkShortcutEnabled: true,
    addToCollectionShortcutEnabled: true,
    addCommentShortcutEnabled: true,
    openDashboardShortcutEnabled: true,
    sharePageShortcutEnabled: true,
}
