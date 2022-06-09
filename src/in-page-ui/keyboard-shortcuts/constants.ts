import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import type { SyncSettingsByFeature } from 'src/sync-settings/background/types'

export const KEYBOARDSHORTCUTS_STORAGE_NAME = 'memex-keyboardshortcuts'

const altKey = getKeyName({ key: 'alt' })

export const KEYBOARDSHORTCUTS_DEFAULT_STATE: SyncSettingsByFeature['extension']['keyboardShortcuts'] = {
    shortcutsEnabled: true,
    openDashboardShortcut: altKey + '+f',
    toggleSidebarShortcut: altKey + '+q',
    toggleHighlightsShortcut: altKey + '+r',
    createAnnotationShortcut: altKey + '+w',
    createHighlightShortcut: altKey + '+a',
    createBookmarkShortcut: altKey + '+s',
    addTagShortcut: altKey + '+x',
    addToCollectionShortcut: altKey + '+c',
    addCommentShortcut: altKey + '+e',
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
