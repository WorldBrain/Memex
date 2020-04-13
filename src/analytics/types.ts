export interface Analytics {
    trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ): Promise<any>
}

export interface AnalyticsEvent<
    Category extends keyof AnalyticsEvents = keyof AnalyticsEvents
> {
    action: AnalyticsEvents[Category] // ('Add Entry', etc.).
    category: Category // ('Search', 'Blacklist', etc.).
    name?: string // (user input - other custom info)
    value?: any
}

export interface AnalyticsTrackEventOptions {
    waitForCompletion?: boolean
}

export interface AnalyticsEvents {
    'Activity Pings': 'daily' | 'weekly' | 'monthly'
    Annotations: 'createWithTags' | 'createWithoutTags'
    Privacy: 'Change tracking pref'
    Overview:
        | 'Create result bookmark'
        | 'Remove result bookmark'
        | 'Delete result'
    'Overview start date':
        | 'Successful NLP query'
        | 'Unsuccessful NLP query'
        | 'Date selection'
        | 'Date clear'
    'Overview end date':
        | 'Successful NLP query'
        | 'Unsuccessful NLP query'
        | 'Date selection'
        | 'Date clear'
    Popup:
        | 'Blacklist domain'
        | 'Blacklist site'
        | 'Delete blacklisted pages'
        | 'Resume indexing'
        | 'Pause indexing'
    Global: 'Page Visit' | 'Install' | 'External Link'
    Tag:
        | 'pageFromPopup'
        | 'addToExistingAnnotation'
        | 'deleteFromResults'
        | 'Filter by Tag'
        | 'createForPageFromOverview'
    Sync: 'initSyncStarted' | 'initSyncFinished'
    Domain: 'Filter by Domain'
    Collections: 'create' | 'addToPageFromPopup'
    InPageTooltip: 'highlightText' | 'annotateText' | 'showTooltip'
    InPageSidebar: 'tempDisable' | 'permaDisable' | 'showSidebar'
    Search:
        | 'Successful omnibar search'
        | 'Unsuccessful omnibar search'
        | 'Successful search'
        | 'Paginate search'
        | 'Unsuccessful search'
        | 'Popup search'
    'Search integration': 'Disabled'
    Blacklist:
        | 'Add blacklist entry'
        | 'Remove blacklist entry'
        | 'Delete matching pages'
    Imports:
        | 'Cancel import'
        | 'Pause import'
        | 'Resume import'
        | 'Finish import'
        | 'Start import'
}

export interface AnalyticsEventInfo {
    description: string
}
