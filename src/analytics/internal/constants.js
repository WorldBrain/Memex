export const API_HOST =
    process.env.NODE_ENV === 'production'
        ? 'https://203bqy2f93.execute-api.eu-central-1.amazonaws.com/production'
        : 'https://a8495szyaa.execute-api.eu-central-1.amazonaws.com/staging'

// This is used to change the event type into integer to optimize the space

/**
 * Add new event type
 * Add the type of event in EVENT_TYPES array
 * Properties: * i
 *      id*: id will be the incremented number
 *      notifTyep: If there is any activity based notification for this type then add notifType and add the same id in the NOTIF_TYPE_EVENT_IDS array
 *
 * NOTIF_TYPE_EVENT_IDS
 *      if the notifType already exists the add the id directly otherwise make a new key and insert in the array
 */

export const EVENT_TYPES = {
    successfulSearch: {
        id: 1,
        notifType: 'successfulSearch',
    },
    paginateSearch: {
        id: 2,
        notifType: 'successfulSearch',
    },
    unsuccessfulSearch: {
        id: 3,
        notifType: 'unsuccessfulSearch',
    },
    datepickerByDropdownStartDate: {
        id: 4,
        notifType: 'datepicker',
    },
    datepickerClearStartDate: {
        id: 5,
        notifType: 'datepicker',
    },
    datepickerByDropdownEndDate: {
        id: 6,
        notifType: 'datepicker',
    },
    datepickerClearEndDate: {
        id: 7,
        notifType: 'datepicker',
    },
    bookmarkFilter: {
        id: 8,
        notifType: 'bookmarkFilter',
    },
    tagFilter: {
        id: 9,
        notifType: 'tagFilter',
    },
    domainFilter: {
        id: 10,
        notifType: 'domainFilter',
    },
    addTag: {
        id: 12,
        notifType: 'tagging',
    },
    deleteTag: {
        id: 13,
        notifType: 'tagging',
    },
    deleteResult: {
        id: 14,
    },
    createResultBookmark: {
        id: 15,
        notifType: 'bookmark',
    },
    removeResultBookmark: {
        id: 16,
        notifType: 'bookmark',
    },
    createBrowserBookmark: {
        id: 17,
        notifType: 'bookmark',
    },
    removeBrowserBookmark: {
        id: 18,
        notifType: 'bookmark',
    },
    createPopupBookmark: {
        id: 19,
        notifType: 'bookmark',
    },
    removePopupBookmark: {
        id: 20,
        notifType: 'bookmark',
    },
    addPopupTag: {
        id: 21,
        notifType: 'tagging',
    },
    deletePopupTag: {
        id: 22,
        notifType: 'tagging',
    },
    blacklistSite: {
        id: 23,
        notifType: 'blacklist',
    },
    blacklistDomain: {
        id: 24,
        notifType: 'blacklist',
    },
    removeBlacklistEntry: {
        id: 25,
        notifType: 'blacklist',
    },
    changeTrackingPrefOptOut: {
        id: 26,
    },
    changeTrackingPrefOptIn: {
        id: 27,
    },
    startImport: {
        id: 28,
    },
    pauseImport: {
        id: 29,
    },
    resumeImport: {
        id: 30,
    },
    cancelImport: {
        id: 31,
    },
    finishImport: {
        id: 32,
    },
    searchPopup: {
        id: 33,
        notifType: 'addressBarSearch',
    },
    successfulOmnibarSearch: {
        id: 34,
        notifType: 'addressBarSearch',
    },
    unsuccessfulOmnibarSearch: {
        id: 35,
        notifType: 'addressBarSearch',
    },
    datepickerByNlpStartDate: {
        id: 36,
        notifType: 'datepickerNlp',
    },
    datepickerByNlpEndDate: {
        id: 37,
        notifType: 'datepickerNlp',
    },
    nlpSearch: {
        id: 38,
        notifType: 'nlpSearch',
    },
    onboardingCancelImport: {
        id: 39,
    },
    onboardingFinishImport: {
        id: 40,
    },
    addBlacklistEntry: {
        id: 41,
        notifType: 'blacklist',
    },
    readNotificationSearchEngine: {
        id: 42,
    },
    readNotificationOverview: {
        id: 43,
    },
    readNotificationPagination: {
        id: 44,
    },
    openInboxOveview: {
        id: 45,
    },
    clickStorageChangeNotifButton: {
        id: 46,
    },
    clickOpenNewLinkButton: {
        id: 47,
    },
    closeInboxOveview: {
        id: 48,
    },
    clickOnSystemNotification: {
        id: 49,
    },
    toggleStorageSearchEngine: {
        id: 50,
    },
    clickOpenNewLinkButtonSearch: {
        id: 51,
    },
    resumeIndexing: {
        id: 52,
    },
    pauseIndexing: {
        id: 53,
    },
    closeCommentSidebar: {
        id: 54,
    },
    openCommentSidebar: {
        id: 55,
    },
    createAnnotation: {
        id: 56,
    },
    removeRibbon: {
        id: 57,
    },
    openSidebarPage: {
        id: 58,
    },
    closeSidebarPage: {
        id: 59,
    },
    createAnnotationPage: {
        id: 60,
    },
    disableSidebarPage: {
        id: 61,
    },
    enableTooltipPopup: {
        id: 62,
    },
    disableTooltipPopup: {
        id: 63,
    },
    deleteAnnotation: {
        id: 64,
    },
    createCollection: {
        id: 65,
    },
    insertPageToCollection: {
        id: 66,
    },
    removeCollection: {
        id: 67,
    },
    removePageFromCollection: {
        id: 68,
    },
    openURLFeature: {
        id: 69,
    },
    startOnboarding: {
        id: 70,
    },
    finishOnboarding: {
        id: 71,
    },
    clickReplyButton: {
        id: 72,
    },
    clickShareButton: {
        id: 73,
    },
    learnMoreCrowdFunding: {
        id: 74,
    },
}

export const NOTIF_TYPE_EVENT_IDS = {
    successfulSearch: [1, 2],
    unsuccessfulSearch: [3],
    datepicker: [4, 5, 6, 7],
    bookmarkFilter: [8],
    tagFilter: [9],
    domainFilter: [10],
    tagging: [12, 13, 21, 22],
    bookmark: [14, 15, 16, 17, 18, 19, 20],
    blacklist: [23, 24, 25, 41],
    addressBarSearch: [33, 34, 35],
    datepickerNlp: [36, 37],
    nlpSearch: [38],
}
