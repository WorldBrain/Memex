import { AnalyticsEvents, AnalyticsEventInfo } from './types'

// Local storage keys used for analytics-related logic
export const STORAGE_KEYS = {
    // Used for timestamp of last install ping (tracks rough # of installs in period)
    MONTHLY_INSTALL: 'last-monthly-install-ping-timestamp',
    WEEKLY_INSTALL: 'last-weekly-install-ping-timestamp',
    DAILY_INSTALL: 'last-daily-install-ping-timestamp',

    // Used for timestamps of periodic activity pings (tracks # of in/active users for periods of time)
    MONTHLY_ACTIVITY: 'last-monthly-activity-ping-timestamp',
    WEEKLY_ACTIVITY: 'last-weekly-activity-ping-timestamp',
    DAILY_ACTIVITY: 'last-daily-activity-ping-timestamp',

    // Used for timestamp of last "activity-indicating" action (user needs 1 in last week to be active)
    LAST_ACTIVE: 'last-search-timestamp',

    USER_ID: 'user-id',
}

// Timezone to base milestones on
export const TIMEZONE = 'Europe/Berlin'

export const ANALYTICS_EVENTS: {
    [Category in keyof AnalyticsEvents]: {
        [Action in AnalyticsEvents[Category]]: AnalyticsEventInfo
    }
} = {
    ActivityPings: {
        daily: {
            description:
                'Daily ping sent to track how many people use Memex daily and what features they use daily',
        },
        weekly: {
            description:
                'Weekly ping sent to track how many people use Memex daily and what features they use weekly',
        },
        monthly: {
            description:
                'Monthly ping sent to track how many people use Memex daily and what features they use monthly',
        },
    },
    Annotations: {
        createWithTags: {
            description: 'The creation of an annotation with tags',
        },
        createWithoutTags: {
            description: 'The creation of an annotation without tags',
        },
    },
    Pages: {
        deleteViaRegexBlacklist: {
            description:
                'The deletion of all matching pages to a newly blacklisted regex entry via the blacklist options page',
        },
        deleteViaSiteBlacklist: {
            description:
                'The deletion of all matching pages to a newly blacklisted website/domain via the popup menu',
        },
        deleteViaOverview: {
            description: 'The deletion of a page',
        },
    },
    Settings: {
        toggleTracking: {
            description:
                `You changed whether you allow us to collect anonymous usage information to improve our product. ` +
                `If you decide not to, this is the last thing we'll know about your usage of Memex,`,
        },
        pauseIndexingViaPopup: {
            description: 'The pausing of page indexing via the popup menu',
        },
        resumeIndexingViaPopup: {
            description: 'The resuming of page indexing via the popup menu',
        },
        enableKeyboardShortcuts: {
            description:
                'The enabling of keyboard shortcuts for Memex actions via the settings page',
        },
        disableKeyboardShortcuts: {
            description:
                'The disabling of keyboard shortcuts for Memex actions via the settings page',
        },
        changeIndexingSetting: {
            description:
                'The changing of any setting in the "Indexing Preferences" menu',
        },
    },
    Bookmarks: {
        createForPage: {
            description: 'The creation of a page bookmark',
        },
        deleteForPage: {
            description: 'The deletion of a page bookmark',
        },
    },
    Global: {
        visitExternalLink: {
            description: 'The visit of a link pointing to an external webpage',
        },
        installExtension: {
            description: 'The install of Memex',
        },
        uninstallExtension: {
            description: 'The uninstall of Memex',
        },
        openPopup: {
            description: 'The opening of the extension popup menu',
        },
    },
    Tags: {
        createForPageViaPopup: {
            description: 'The creation of a tag for a page via the popup menu',
        },
        createForPageViaRibbon: {
            description: 'The creation of a tag for a page via the ribbon',
        },
        deleteForPageViaOverview: {
            description: 'The deletion of a tag for a page via the overview',
        },
        createForPageViaOverview: {
            description: 'the creation of a tage for a page via the overview',
        },
        createForAnnotation: {
            description: 'The tagging of an annotation',
        },
    },
    Sync: {
        startInitSync: {
            description: 'The initial sync between two devices has started.',
        },
        finishInitSync: {
            description: 'The initial sync between two devices has finished.',
        },
        failInitSync: {
            description: 'The initial sync between two devices has failed.',
        },
        clickPairNewDevice: {
            description:
                'The "Pair New Device" button was clicked in the sync settings',
        },
        generateQRPairingCode: {
            description: 'A new QR code has been generated for pairing devices',
        },
    },
    Collections: {
        create: {
            description: 'The creation of a new page collection',
        },
        addPageViaPopup: {
            description:
                'The creation of a new page entry in a list via the popup menu',
        },
        addPageViaDragAndDrop: {
            description:
                'The creation of a new page entry in a list via dragging and dropping a page result to a list in the overview',
        },
    },
    InPageTooltip: {
        annotateText: {
            description:
                'The creation on an annotation via the in-page tooltip',
        },
        highlightText: {
            description:
                'The creation of a text highlight via the in-page tooltip',
        },
        showTooltip: {
            description:
                'The showing of the in-page tooltip, triggered by webpage text selection',
        },
        closeTooltip: {
            description:
                'The closing of the in-page tooltip, by pressing the "X" button',
        },
        disableTooltipViaRibbon: {
            description:
                'The disabling of the in-page tooltip via the in-page sidebar ribbon',
        },
        disableTooltipViaPopup: {
            description:
                'The disabling of the in-page tooltip via the popup menu',
        },
    },
    Sidebar: {
        showSidebar: {
            description:
                'The showing of the in-page sidebar, triggered by numerous user actions',
        },
        disableTemporarily: {
            description:
                'The temporary disabling of the in-page sidebar on any webpage',
        },
        disablePermanently: {
            description: 'The permanent disabling of the in-page sidebar',
        },
    },
    Search: {
        paginateSearch: {
            description: 'The invoking of pagination for a given search',
        },
        searchViaPopup: {
            description: 'The invoking of search via the popup menu',
        },
        successViaOverview: {
            description: 'A search that returns results via the overview',
        },
        failViaOverview: {
            description: 'A search that returns no results via the overview',
        },
        successViaOmnibar: {
            description: 'A search that returns results via the address bar',
        },
        failViaOmnibar: {
            description: 'A search that returns no results via the address bar',
        },
    },
    SearchFilters: {
        addTagFilterViaQuery: {
            description: 'The applying of tags search filter',
        },
        addDomainFilterViaQuery: {
            description: 'The applying of domains search filter',
        },
        addStartDateFilterViaQuery: {
            description:
                'The entering of a valid NLP query for the start date search filter',
        },
        addStartDateFilterViaPicker: {
            description:
                'The manual selection of a date for the start date search filter',
        },
        clearStartDateFilter: {
            description: 'The manual clearing of the start date search filter',
        },
        addEndDateFilterViaQuery: {
            description:
                'The entering of a valid NLP query for the end date search filter',
        },
        addEndDateFilterViaPicker: {
            description:
                'The manual selection of a date for the end date search filter',
        },
        clearEndDateFilter: {
            description: 'The manual clearing of the end date search filter',
        },
        addInvalidDateFilterQuery: {
            description:
                'The entering of an invalid NLP query for the start/end date search filter',
        },
    },
    SearchEngineIntegration: {
        disableSearchIntegration: {
            description:
                'The disabling of Memex search results integrated in third-party search engines',
        },
    },
    Blacklist: {
        createEntryViaSettings: {
            description:
                'The blacklisting of a regex entry via the blacklist options page',
        },
        deleteEntryViaSettings: {
            description:
                'The unblacklisting of a regex entry via the blacklist options page',
        },
        createDomainEntryViaPopup: {
            description: 'The blacklisting of a domain via the popup menu',
        },
        createSiteEntryViaPopup: {
            description: 'The blacklisting of a website via the popup menu',
        },
    },
    Imports: {
        cancel: {
            description: 'The cancelling of an in-progress import',
        },
        start: {
            description: 'The starting of an import process',
        },
        pause: {
            description: 'The pausing of an in-progress import process',
        },
        resume: {
            description: 'The resumption of a paused import process',
        },
        finish: {
            description: 'The finishing of an import process',
        },
    },
}
