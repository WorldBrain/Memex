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
}

// Timezone to base milestones on
export const TIMEZONE = 'Europe/Berlin'

export const ANALYTICS_EVENTS: {
    [Category in keyof AnalyticsEvents]: {
        [Action in AnalyticsEvents[Category]]: AnalyticsEventInfo
    }
} = {
    'Activity Pings': {
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
    Privacy: {
        'Change tracking pref': {
            description:
                `You changed whether you allow us to collect anonymous usage information to improve our product. ` +
                `If you decide not to, this is the last thing we'll know about your usage of Memex,`,
        },
    },
    Overview: {
        'Create result bookmark': {
            description: 'The creation of a page bookmark',
        },
        'Remove result bookmark': {
            description: 'The deletion of a page bookmark',
        },
        'Delete result': {
            description: 'The deletion of a page',
        },
    },
    'Overview start date': {
        'Successful NLP query': {
            description:
                'The entering of a valid NLP query for the start date search filter',
        },
        'Unsuccessful NLP query': {
            description:
                'The entering of an invalid NLP query for the start date search filter',
        },
        'Date selection': {
            description:
                'The manual selection of a date for the start date search filter',
        },
        'Date clear': {
            description: 'The manual clearing of the start date search filter',
        },
    },
    'Overview end date': {
        'Successful NLP query': {
            description:
                'The entering of a valid NLP query for the end date search filter',
        },
        'Unsuccessful NLP query': {
            description:
                'The entering of an invalid NLP query for the end date search filter',
        },
        'Date selection': {
            description:
                'The manual selection of a date for the end date search filter',
        },
        'Date clear': {
            description: 'The manual clearing of the end date search filter',
        },
    },
    Popup: {
        'Blacklist domain': {
            description: 'The blacklisting of a domain via the popup menu',
        },
        'Blacklist site': {
            description: 'The blacklisting of a website via the popup menu',
        },
        'Delete blacklisted pages': {
            description:
                'The deletion of all matching pages to a newly blacklisted website/domain via the popup menu',
        },
        'Pause indexing': {
            description: 'The pausing of page indexing via the popup menu',
        },
        'Resume indexing': {
            description: 'The resuming of page indexing via the popup menu',
        },
    },
    Global: {
        'Page Visit': {
            description: 'UNUSED',
        },
        'External Link': {
            description: 'The visit of a link pointing to an external webpage',
        },
        Install: {
            description: 'The install of an extension',
        },
    },
    Tag: {
        pageFromPopup: {
            description: 'The creation of a tag for a page via the popup menu',
        },
        addToExistingAnnotation: {
            description: 'The tagging of an annotation',
        },
        'Filter by Tag': {
            description: 'The applying of tags search filter',
        },
        deleteFromResults: {
            description: 'The deletion of a tag for a page via the overview',
        },
    },
    Domain: {
        'Filter by Domain': {
            description: 'The applying of domains search filter',
        },
    },
    Collections: {
        create: {
            description: 'The creation of a new page collection',
        },
        addToPageFromPopup: {
            description: 'The creation of a new page entry in a list',
        },
    },
    Search: {
        'Paginate search': {
            description: 'The invoking of pagination for a given search',
        },
        'Popup search': {
            description: 'The invoking of search via the popup menu',
        },
        'Successful search': {
            description: 'A search that returns results via the overview',
        },
        'Unsuccessful search': {
            description: 'A search that returns no results via the overview',
        },
        'Successful omnibar search': {
            description: 'A search that returns results via the address bar',
        },
        'Unsuccessful omnibar search': {
            description: 'A search that returns no results via the address bar',
        },
    },
    'Search integration': {
        Disabled: {
            description:
                'The disabling of Memex search results integrated in third-party search engines',
        },
    },
    Blacklist: {
        'Add blacklist entry': {
            description:
                'The blacklisting of a regex entry via the blacklist options page',
        },
        'Remove blacklist entry': {
            description:
                'The unblacklisting of a regex entry via the blacklist options page',
        },
        'Delete matching pages': {
            description:
                'The deletion of all matching pages to a newly blacklisted regex entry via the blacklist options page',
        },
    },
    Imports: {
        'Cancel import': {
            description: 'The cancelling of an in-progress import',
        },
        'Start import': {
            description: 'The starting of an import process',
        },
        'Pause import': {
            description: 'The pausing of an in-progress import process',
        },
        'Resume import': {
            description: 'The resumption of a paused import process',
        },
        'Finish import': {
            description: 'The finishing of an import process',
        },
    },
}
