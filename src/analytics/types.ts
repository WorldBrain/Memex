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
    segmentation?: {}
    duration?: number
    // @depreciated no longer works in Countly
    value?: {}
}

export interface AnalyticsTrackEventOptions {
    waitForCompletion?: boolean
}

export interface AnalyticsEvents {
    ActivityPings: 'daily' | 'weekly' | 'monthly'
    Annotations:
        | 'saveWithTags'
        | 'saveWithoutTags'
        | 'create'
        | 'createFromTooltip'
        | 'createFromShortcut'
        | 'createFromContextMenu'
        | 'createAnnotationGlobally'
    Highlights:
        | 'create'
        | 'createFromTooltip'
        | 'createFromShortcut'
        | 'createFromContextMenu'
        | 'createHighlightGlobally'
    Notes: 'createNoteGlobally'
    Bookmarks:
        | 'createBookmarkForPage'
        | 'deleteForPage'
        | 'createBookmarkViaPopup'
    Pages:
        | 'deleteViaRegexBlacklist'
        | 'deleteViaSiteBlacklist'
        | 'deleteViaOverview'
    Global:
        | 'installExtension'
        | 'uninstallExtension'
        | 'visitExternalLink'
        | 'openPopup'
    Tags:
        | 'createTagForPage'
        | 'createForPageViaPopup'
        | 'createForPageViaRibbon'
        | 'createForPageViaOverview'
        | 'deleteForPageViaOverview'
        | 'createForAnnotation'
    Sync:
        | 'startInitSync'
        | 'finishInitSync'
        | 'failInitSync'
        | 'clickPairNewDevice'
        | 'generateQRPairingCode'
    Collections:
        | 'addPageToList'
        | 'create'
        | 'addPageViaPopup'
        | 'addPageViaDragAndDrop'
    ContentSharing:
        | 'shareList'
        | 'shareListEntryBatch'
        | 'unshareListEntry'
        | 'shareAnnotation'
        | 'copyListLink'
        | 'copyNoteLink'
        | 'copyPageLink'
        | 'copyCollectionLink'
    InPageTooltip:
        | 'highlightText'
        | 'annotateText'
        | 'showTooltip'
        | 'closeTooltip'
        | 'disableTooltipViaRibbon'
        | 'disableTooltipViaPopup'
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
        | 'changeIndexingSetting'
        | 'enableKeyboardShortcuts'
        | 'disableKeyboardShortcuts'
    Readwise: 'setupReadwise' | 'removeReadwise'
    Inbox: 'filterByInbox' | 'removeFromInbox'
    TextExporter: 'copyToClipboard'
}

export interface AnalyticsEventInfo {
    description: string
}
