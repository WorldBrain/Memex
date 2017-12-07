// Local storage keys used for analytics-related logic
export const STORAGE_KEYS = {
    // Used for timestamp of last daily install ping (tracks rough # of installs)
    DAILY_INSTALL: 'last-daily-install-ping-timestamp',

    // Used for timestamps of periodic activity pings (tracks # of in/active users for periods of time)
    MONTHLY_ACTIVITY: 'last-monthly-activity-ping-timestamp',
    WEEKLY_ACTIVITY: 'last-weekly-activity-ping-timestamp',
    DAILY_ACTIVITY: 'last-daily-activity-ping-timestamp',

    // Used for timestamp of last search (user needs 1 search in last week to be active)
    SEARCH: 'last-search-timestamp',
}

export const DAY_IN_MS = 1000 * 60 * 60 * 24

// Cron schedules for periodic analytics tasks
export const SCHEDULES = {
    // Generates a cron schedule to run some time past the hour, every hour
    EVERY_HOUR: () => `0 ${Math.floor(Math.random() * 60)} * * * *`,
}
