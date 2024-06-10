import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import { AImodels } from '@worldbrain/memex-common/lib/summarization/types'
import { PromptTemplate } from 'src/common-ui/components/prompt-templates/types'

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
    activityIndicator: {
        feedHasActivity: boolean
    }
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
        stickyContainerEnabled: boolean
    }
    pdfIntegration: {
        shouldAutoOpen: boolean
        /** Determines whether or not local PDFs should be auto-uploaded on index. */
        shouldAutoUpload: boolean
    }
    extension: {
        blocklist: string
        shouldTrackAnalytics: boolean
        areTagsMigratedToSpaces: boolean
        keyboardShortcuts: {
            shortcutsEnabled: boolean
            addCommentShortcutEnabled: boolean
            openDashboardShortcutEnabled: boolean
            toggleSidebarShortcutEnabled: boolean
            createBookmarkShortcutEnabled: boolean
            createHighlightShortcutEnabled: boolean
            addToCollectionShortcutEnabled: boolean
            sharePageShortcutEnabled: boolean
            toggleHighlightsShortcutEnabled: boolean
            copyCurrentLinkShortcutEnabled: boolean
            createAnnotationShortcutEnabled: boolean
            askAIShortcutEnabled: boolean
            addCommentShortcut: string
            openDashboardShortcut: string
            toggleSidebarShortcut: string
            createBookmarkShortcut: string
            createHighlightShortcut: string
            addToCollectionShortcut: string
            toggleHighlightsShortcut: string
            createAnnotationShortcut: string
            copyCurrentLinkShortcut: string
            askAIShortcut: string
            sharePageShortcut: string
        }
        betaFeatures: {
            [key: string]: boolean
        }
        shouldAutoCreateNoteLink: boolean
        shouldAutoAddSpaces: boolean
    }
    readwise: {
        apiKey: string
    }
    openAI: {
        apiKey: string
        promptSuggestions: PromptTemplate[]
        videoPromptSetting: string
        selectedModel: AImodels
    }
    inPageUI: {
        ribbonEnabled: boolean
        tooltipEnabled: boolean
        highlightsEnabled: boolean
        ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
    }
    highlightColors: {
        highlightColors: HighlightColor[]
    }
}

export type SyncSettingNames = {
    [featureName in keyof SyncSettingsByFeature]: {
        [s in keyof SyncSettingsByFeature[featureName]]: string
    }
}
