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
}
