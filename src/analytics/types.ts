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
    ActivityPings: 'daily' | 'weekly' | 'monthly'
    Annotations: 'createWithTags' | 'createWithoutTags'
    Bookmarks: 'createForPage' | 'deleteForPage'
    Pages:
        | 'deleteViaRegexBlacklist'
        | 'deleteViaSiteBlacklist'
        | 'deleteViaOverview'
    Global: 'installExtension' | 'uninstallExtension' | 'visitExternalLink'
    Tags:
        | 'createForPageViaPopup'
        | 'createForAnnotation'
        | 'createForPageViaOverview'
        | 'deleteForPageViaOverview'
    Sync: 'startInitSync' | 'finishInitSync'
    Collections: 'create' | 'addPageViaPopup'
    InPageTooltip: 'highlightText' | 'annotateText' | 'showTooltip'
    Sidebar: 'disableTemporarily' | 'disablePermanently' | 'showSidebar'
    Search:
        | 'successViaOmnibar'
        | 'failViaOmnibar'
        | 'successViaOverview'
        | 'paginateSearch'
        | 'failViaOverview'
        | 'searchViaPopup'
    SearchFilters:
        | 'addTagFilterViaQuery'
        | 'addDomainFilterViaQuery'
        | 'addStartDateFilterViaQuery'
        | 'addStartDateFilterViaPicker'
        | 'clearStartDateFilter'
        | 'addEndDateFilterViaQuery'
        | 'addEndDateFilterViaPicker'
        | 'clearEndDateFilter'
        | 'addInvalidDateFilterQuery'
    SearchEngineIntegration: 'disableSearchIntegration'
    Blacklist:
        | 'createEntryViaSettings'
        | 'deleteEntryViaSettings'
        | 'createDomainEntryViaPopup'
        | 'createSiteEntryViaPopup'
    Imports: 'cancel' | 'pause' | 'resume' | 'finish' | 'start'
    Settings:
        | 'toggleTracking'
        | 'pauseIndexingViaPopup'
        | 'resumeIndexingViaPopup'
}

export interface AnalyticsEventInfo {
    description: string
}
