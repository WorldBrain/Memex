import type { LimitedBrowserStorage } from 'src/util/tests/browser-storage'

export type SettingValue =
    | string
    | number
    | string[]
    | number[]
    | { [key: string]: any }

export interface Setting {
    name: string
    value: SettingValue
}

export interface RemoteSettingsInterface extends LimitedBrowserStorage {}

export interface UserSettingsByFeature {
    contentSharing: {
        lastSharedAnnotationTimestamp: number
    }
    dashboard: {
        listSidebarLocked: boolean
        onboardingMsgSeen: boolean
        subscribeBannerDismissed: boolean
    }
    searchInjection: {
        showMemexResults: boolean
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
        installTime: number
        shouldTrackAnalytics: boolean
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
    inPageUI: {
        ribbonEnabled: boolean
        tooltipEnabled: boolean
        highlightsEnabled: boolean
    }
}

export type UserSettingNames = {
    [featureName in keyof UserSettingsByFeature]: {
        [s in keyof UserSettingsByFeature[featureName]]: string
    }
}
