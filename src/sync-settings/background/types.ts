import type { LimitedBrowserStorage } from 'src/util/tests/browser-storage'

export type SyncSettingValue =
    | string
    | number
    | string[]
    | number[]
    | boolean
    | { [key: string]: any }

export interface SyncSetting {
    key: string
    value: SyncSettingValue
}

export interface RemoteSyncSettingsInterface extends LimitedBrowserStorage {}

export interface SyncSettingsByFeature {
    contentSharing: {
        lastSharedAnnotationTimestamp: number
    }
    dashboard: {
        listSidebarLocked: boolean
        onboardingMsgSeen: boolean
        /** Timestamp after which the pioneer sub banner will be shown. Or `null` to always hide. */
        subscribeBannerShownAfter: number | null
    }
    searchInjection: {
        hideMemexResults: boolean
        memexResultsPosition: 'side' | 'above'
        searchEnginesEnabled: {
            duckduckgo: boolean
            google: boolean
        }
    }
    pdfIntegration: {
        shouldAutoOpen: boolean
    }
    extension: {
        blocklist: string
        shouldTrackAnalytics: boolean
        areTagsMigratedToSpaces: boolean
        keyboardShortcuts: {
            shortcutsEnabled: boolean
            addTagShortcutEnabled: boolean
            addCommentShortcutEnabled: boolean
            openDashboardShortcutEnabled: boolean
            toggleSidebarShortcutEnabled: boolean
            createBookmarkShortcutEnabled: boolean
            createHighlightShortcutEnabled: boolean
            addToCollectionShortcutEnabled: boolean
            toggleHighlightsShortcutEnabled: boolean
            createAnnotationShortcutEnabled: boolean
            addTagShortcut: string
            addCommentShortcut: string
            openDashboardShortcut: string
            toggleSidebarShortcut: string
            createBookmarkShortcut: string
            createHighlightShortcut: string
            addToCollectionShortcut: string
            toggleHighlightsShortcut: string
            createAnnotationShortcut: string
        }
    }
    readwise: {
        apiKey: string
    }
    inPageUI: {
        ribbonEnabled: boolean
        tooltipEnabled: boolean
        highlightsEnabled: boolean
    }
}

export type SyncSettingNames = {
    [featureName in keyof SyncSettingsByFeature]: {
        [s in keyof SyncSettingsByFeature[featureName]]: string
    }
}
