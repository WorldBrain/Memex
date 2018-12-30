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

export const EVENT_NAMES = {
    SUCCESSFUL_SEARCH: 'succesfulSearch',
    PAGINATE_SEARCH: 'paginateSearch',
    UNSUCCESSFUL_SEARCH: 'unsuccessfulSearch',
    DATEPICKER: 'datepicker',
    DATEPICKER_DROPDOWN: 'datepickerByDropdown',
    DATEPICKER_DROPDOWN_START: 'datepickerByDropdownStartDate',
    DATEPICKER_CLEAR_START: 'datepickerClearStartDate',
    DATEPICKER_DROPDOWN_END: 'datepickerByDropdownEndDate',
    DATEPICKER_CLEAR_END: 'datepickerClearEndDate',
    BOOKMARK_FILTER: 'bookmarkFilter',
    TAG_FILTER: 'tagFilter',
    DOMAIN_FILTER: 'domainFilter',
    ADD_TAG: 'addTag',
    DELETE_TAG: 'deleteTag',
    DELETE_RESULT: 'deleteResult',
    CREATE_RESULT_BOOKMARK: 'createResultBookmark',
    REMOVE_RESULT_BOOKMARK: 'removeResultBookmark',
    CREATE_BROWSER_BOOKMARK: 'createBrowserBookmark',
    REMOVE_BROWSER_BOOKMARK: 'removeBrowserBookmark',
    CREATE_POPUP_BOOKMARK: 'createPopupBookmark',
    REMOVE_POPUP_BOOKMARK: 'removePopupBookmark',
    ADD_POPUP_TAG: 'addPopupTag',
    DELETE_POPUP_TAG: 'deletePopupTag',
    BLACKLIST_SITE: 'blacklistSite',
    BLACKLIST_DOMAIN: 'blacklistDomain',
    REMOVE_BLACKLIST_ENTRY: 'removeBlacklistEntry',
    CHANGE_TRACKING_PREF_OPTOUT: 'changeTrackingPrefOptOut',
    CHANGE_TRACKING_PREF_OPTIN: 'changeTrackingPrefOptIn',
    START_IMPORT: 'startImport',
    PAUSE_IMPORT: 'pauseImport',
    RESUME_IMPORT: 'resumeImport',
    CANCEL_IMPORT: 'cancelImport',
    FINISH_IMPORT: 'finishImport',
    SEARCH_POPUP: 'serachPopup',
    SUCCESSFUL_OMNIBAR_SEARCH: 'successfulOmnibarSearch',
    UNSUCCESSFUL_OMNIBAR_SEARCH: 'unsuccessfulOmnibarSearch',
    DATEPICKER_NLP_START_DATE: 'datepickerByNlpStartDate',
    DATEPICKER_NLP_END_DATE: 'datepickerByNlpEndDate',
    NLP_SEARCH: 'nlpSearch',
    ONBOARDING_CANCEL_IMPORT: 'onboardingCancelImport',
    ONBOARDING_FINISH_IMPORT: 'onboardingFinishImport',
    ADD_BLACKLIST_ENTRY: 'addBlacklistEntry',
    READ_NOTIFICATION_SEARCH_ENGINE: 'redNotificationSearchEngine',
    READ_NOTIFICATION_OVERVIEW: 'readNotificationOverview',
    READ_NOTIFICATION_PAGINATION: 'readNotificationPagination',
    OPEN_INBOX_OVERVIEW: 'openInboxOveview',
    CLICK_STORAGE_CHANGE_NOTIF_BUTTON: 'clickStorageChangeNotifButton',
    CLICK_OPEN_NEW_LINK_BUTTON: 'clickOpenNewLinkButton',
    CLOSE_INBOX_OVERVIEW: 'closeInboxOverview',
    CLICK_ON_SYSTEM_NOTIFICATION: 'clickOnSystemNotification',
    TOGGLE_STORAGE_SEARCH_ENGINE: 'toggleStorageSearchEngine',
    CLICK_OPEN_NEW_LINK_BUTTON_SEARCH: 'clickOpenNewLinkButtonSearch',
    RESUME_INDEXING: 'resumeIndexing',
    PAUSE_INDEXING: 'pauseIndexing',
    CLOSE_COMMENT_SIDEBAR: 'closeCommentSidebar',
    OPEN_COMMENT_SIDEBAR: 'openCommentSidebar',
    CREATE_ANNOTATION: 'createAnnotation',
    REMOVE_RIBBON: 'removeRibbon',
    OPEN_SIDEBAR_PAGE: 'openSidebarPage',
    CLOSE_SIDEBAR_PAGE: 'closeSidebarPage',
    CREATE_ANNOTATION_PAGE: 'createAnnotationPage',
    DISABLE_SIDEBAR_PAGE: 'disableSidebarPage',
    ENABLE_TOOLTIP_POPUP: 'enableTooltipPopup',
    DISABLE_TOOLTIP_POPUP: 'disableTooltipPopup',
    DELETE_ANNOTATION: 'deleteAnnotation',
    CREATE_COLLECTION: 'createCollection',
    INSERT_PAGE_COLLECTION: 'insertPageToCollection',
    REMOVE_COLLECTION: 'removeCollection',
    REMOVE_PAGE_COLLECTION: 'removePageFromCollection',
    OPEN_URL_FEATURE: 'openURLFeature',
    START_ONBOARDING: 'startOnboarding',
    FINISH_ONBOARDING: 'finishOnboarding',
    CLICK_REPLY_BUTTON: 'clickReplyButton',
    CLICK_SHARE_BUTTON: 'clickShareButton',
    LEARN_MORE_CROWD_FUNDING: 'learnMoreCrowdFunding',
    TAGGING: 'tagging',
    BOOKMARK: 'bookmark',
    BLACKLIST: 'blacklist',
    ADDRESS_BAR_SEARCH: 'addressBarSearch',
    DATEPICKER_NLP: 'datepickerNlp',
    START_ANNOTATION_ONBOARDING: 'startAnnotationOnboarding',
    ONBOARDING_HIGHLIGHT_MADE: 'onboardingHighlightMade',
    FINISH_ANNOTATION_ONBOARDING: 'finishAnnotationOnboarding',
    START_POWERSEARCH_ONBOARDING: 'startPowerSearchOnboarding',
    POWERSEARCH_BROWSE_PAGE: 'powerSearchBrowsePage',
    POWERSEARCH_GOTO_DASH: 'powerSearchGotoDash',
    FINISH_POWERSEARCH_ONBOARDING: 'finshPowerSearchOnboarding',
    OVERVIEW_TOOLTIP: 'overviewTooltip',
    SET_TOOLTIP: 'setTooltip',
    CLOSE_TOOLTIP: 'closeTooltip',
}

export const EVENT_TYPES = {
    [EVENT_NAMES.SUCCESSFUL_SEARCH]: {
        id: 1,
        notifType: EVENT_NAMES.SUCCESSFUL_SEARCH,
    },
    [EVENT_NAMES.PAGINATE_SEARCH]: {
        id: 2,
        notifType: EVENT_NAMES.SUCCESSFUL_SEARCH,
    },
    [EVENT_NAMES.UNSUCCESSFUL_SEARCH]: {
        id: 3,
        notifType: EVENT_NAMES.UNSUCCESSFUL_SEARCH,
    },
    [EVENT_NAMES.DATEPICKER_DROPDOWN_START]: {
        id: 4,
        notifType: EVENT_NAMES.DATEPICKER,
    },
    [EVENT_NAMES.DATEPICKER_CLEAR_START]: {
        id: 5,
        notifType: EVENT_NAMES.DATEPICKER,
    },
    [EVENT_NAMES.DATEPICKER_DROPDOWN_END]: {
        id: 6,
        notifType: EVENT_NAMES.DATEPICKER,
    },
    [EVENT_NAMES.DATEPICKER_CLEAR_END]: {
        id: 7,
        notifType: EVENT_NAMES.DATEPICKER,
    },
    [EVENT_NAMES.BOOKMARK_FILTER]: {
        id: 8,
        notifType: EVENT_NAMES.BOOKMARK_FILTER,
    },
    [EVENT_NAMES.TAG_FILTER]: {
        id: 9,
        notifType: EVENT_NAMES.TAG_FILTER,
    },
    [EVENT_NAMES.DOMAIN_FILTER]: {
        id: 10,
        notifType: EVENT_NAMES.DOMAIN_FILTER,
    },
    [EVENT_NAMES.ADD_TAG]: {
        id: 12,
        notifType: EVENT_NAMES.TAGGING,
    },
    [EVENT_NAMES.DELETE_TAG]: {
        id: 13,
        notifType: EVENT_NAMES.TAGGING,
    },
    [EVENT_NAMES.DELETE_RESULT]: {
        id: 14,
    },
    [EVENT_NAMES.CREATE_RESULT_BOOKMARK]: {
        id: 15,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.REMOVE_RESULT_BOOKMARK]: {
        id: 16,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.CREATE_BROWSER_BOOKMARK]: {
        id: 17,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.REMOVE_BROWSER_BOOKMARK]: {
        id: 18,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.CREATE_POPUP_BOOKMARK]: {
        id: 19,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.REMOVE_POPUP_BOOKMARK]: {
        id: 20,
        notifType: EVENT_NAMES.BOOKMARK,
    },
    [EVENT_NAMES.ADD_POPUP_TAG]: {
        id: 21,
        notifType: EVENT_NAMES.TAGGING,
    },
    [EVENT_NAMES.DELETE_POPUP_TAG]: {
        id: 22,
        notifType: EVENT_NAMES.TAGGING,
    },
    [EVENT_NAMES.BLACKLIST_SITE]: {
        id: 23,
        notifType: EVENT_NAMES.BLACKLIST,
    },
    [EVENT_NAMES.BLACKLIST_DOMAIN]: {
        id: 24,
        notifType: EVENT_NAMES.BLACKLIST,
    },
    [EVENT_NAMES.REMOVE_BLACKLIST_ENTRY]: {
        id: 25,
        notifType: EVENT_NAMES.BLACKLIST,
    },
    [EVENT_NAMES.CHANGE_TRACKING_PREF_OPTOUT]: {
        id: 26,
    },
    [EVENT_NAMES.CHANGE_TRACKING_PREF_OPTIN]: {
        id: 27,
    },
    [EVENT_NAMES.START_IMPORT]: {
        id: 28,
    },
    [EVENT_NAMES.PAUSE_IMPORT]: {
        id: 29,
    },
    [EVENT_NAMES.RESUME_IMPORT]: {
        id: 30,
    },
    [EVENT_NAMES.CANCEL_IMPORT]: {
        id: 31,
    },
    [EVENT_NAMES.FINISH_IMPORT]: {
        id: 32,
    },
    [EVENT_NAMES.SEARCH_POPUP]: {
        id: 33,
        notifType: EVENT_NAMES.ADDRESS_BAR_SEARCH,
    },
    [EVENT_NAMES.SUCCESSFUL_OMNIBAR_SEARCH]: {
        id: 34,
        notifType: EVENT_NAMES.ADDRESS_BAR_SEARCH,
    },
    [EVENT_NAMES.UNSUCCESSFUL_OMNIBAR_SEARCH]: {
        id: 35,
        notifType: EVENT_NAMES.ADDRESS_BAR_SEARCH,
    },
    [EVENT_NAMES.DATEPICKER_NLP_START_DATE]: {
        id: 36,
        notifType: EVENT_NAMES.DATEPICKER_NLP,
    },
    [EVENT_NAMES.DATEPICKER_NLP_END_DATE]: {
        id: 37,
        notifType: EVENT_NAMES.DATEPICKER_NLP,
    },
    [EVENT_NAMES.NLP_SEARCH]: {
        id: 38,
        notifType: EVENT_NAMES.NLP_SEARCH,
    },
    [EVENT_NAMES.ONBOARDING_CANCEL_IMPORT]: {
        id: 39,
    },
    [EVENT_NAMES.ONBOARDING_FINISH_IMPORT]: {
        id: 40,
    },
    [EVENT_NAMES.ADD_BLACKLIST_ENTRY]: {
        id: 41,
        notifType: EVENT_NAMES.BLACKLIST,
    },
    [EVENT_NAMES.READ_NOTIFICATION_SEARCH_ENGINE]: {
        id: 42,
    },
    [EVENT_NAMES.READ_NOTIFICATION_OVERVIEW]: {
        id: 43,
    },
    [EVENT_NAMES.READ_NOTIFICATION_PAGINATION]: {
        id: 44,
    },
    [EVENT_NAMES.OPEN_INBOX_OVERVIEW]: {
        id: 45,
    },
    [EVENT_NAMES.CLICK_STORAGE_CHANGE_NOTIF_BUTTON]: {
        id: 46,
    },
    [EVENT_NAMES.CLICK_OPEN_NEW_LINK_BUTTON]: {
        id: 47,
    },
    [EVENT_NAMES.CLOSE_INBOX_OVERVIEW]: {
        id: 48,
    },
    [EVENT_NAMES.CLICK_ON_SYSTEM_NOTIFICATION]: {
        id: 49,
    },
    [EVENT_NAMES.TOGGLE_STORAGE_SEARCH_ENGINE]: {
        id: 50,
    },
    [EVENT_NAMES.CLICK_OPEN_NEW_LINK_BUTTON_SEARCH]: {
        id: 51,
    },
    [EVENT_NAMES.RESUME_INDEXING]: {
        id: 52,
    },
    [EVENT_NAMES.PAUSE_INDEXING]: {
        id: 53,
    },
    [EVENT_NAMES.CLOSE_COMMENT_SIDEBAR]: {
        id: 54,
    },
    [EVENT_NAMES.OPEN_COMMENT_SIDEBAR]: {
        id: 55,
    },
    [EVENT_NAMES.CREATE_ANNOTATION]: {
        id: 56,
    },
    [EVENT_NAMES.REMOVE_RIBBON]: {
        id: 57,
    },
    [EVENT_NAMES.OPEN_SIDEBAR_PAGE]: {
        id: 58,
    },
    [EVENT_NAMES.CLOSE_SIDEBAR_PAGE]: {
        id: 59,
    },
    [EVENT_NAMES.CREATE_ANNOTATION_PAGE]: {
        id: 60,
    },
    [EVENT_NAMES.DISABLE_SIDEBAR_PAGE]: {
        id: 61,
    },
    [EVENT_NAMES.ENABLE_TOOLTIP_POPUP]: {
        id: 62,
    },
    [EVENT_NAMES.DISABLE_TOOLTIP_POPUP]: {
        id: 63,
    },
    [EVENT_NAMES.DELETE_ANNOTATION]: {
        id: 64,
    },
    [EVENT_NAMES.CREATE_COLLECTION]: {
        id: 65,
    },
    [EVENT_NAMES.INSERT_PAGE_COLLECTION]: {
        id: 66,
    },
    [EVENT_NAMES.REMOVE_COLLECTION]: {
        id: 67,
    },
    [EVENT_NAMES.REMOVE_PAGE_COLLECTION]: {
        id: 68,
    },
    [EVENT_NAMES.OPEN_URL_FEATURE]: {
        id: 69,
    },
    [EVENT_NAMES.START_ONBOARDING]: {
        id: 70,
    },
    [EVENT_NAMES.FINISH_ONBOARDING]: {
        id: 71,
    },
    [EVENT_NAMES.CLICK_REPLY_BUTTON]: {
        id: 72,
    },
    [EVENT_NAMES.CLICK_SHARE_BUTTON]: {
        id: 73,
    },
    [EVENT_NAMES.LEARN_MORE_CROWD_FUNDING]: {
        id: 74,
    },
    [EVENT_NAMES.START_ANNOTATION_ONBOARDING]: {
        id: 75,
    },
    [EVENT_NAMES.FINISH_ANNOTATION_ONBOARDING]: {
        id: 76,
    },
    [EVENT_NAMES.START_POWERSEARCH_ONBOARDING]: {
        id: 77,
    },
    [EVENT_NAMES.FINISH_POWERSEARCH_ONBOARDING]: {
        id: 78,
    },
    [EVENT_NAMES.ONBOARDING_HIGHLIGHT_MADE]: {
        id: 79,
    },
    [EVENT_NAMES.POWERSEARCH_BROWSE_PAGE]: {
        id: 80,
    },
    [EVENT_NAMES.POWERSEARCH_GOTO_DASH]: {
        id: 81,
    },
    [EVENT_NAMES.SET_TOOLTIP]: {
        id: 82,
        notifType: EVENT_NAMES.OVERVIEW_TOOLTIP,
    },
    [EVENT_NAMES.CLOSE_TOOLTIP]: {
        id: 83,
        notifType: EVENT_NAMES.OVERVIEW_TOOLTIP,
    },
}

export const NOTIF_TYPE_EVENT_IDS = {
    [EVENT_NAMES.SUCCESSFUL_SEARCH]: [1, 2],
    [EVENT_NAMES.UNSUCCESSFUL_SEARCH]: [3],
    [EVENT_NAMES.DATEPICKER]: [4, 5, 6, 7],
    [EVENT_NAMES.BOOKMARK_FILTER]: [8],
    [EVENT_NAMES.TAG_FILTER]: [9],
    [EVENT_NAMES.DOMAIN_FILTER]: [10],
    [EVENT_NAMES.TAGGING]: [12, 13, 21, 22],
    [EVENT_NAMES.BOOKMARK]: [14, 15, 16, 17, 18, 19, 20],
    [EVENT_NAMES.BLACKLIST]: [23, 24, 25, 41],
    [EVENT_NAMES.ADDRESS_BAR_SEARCH]: [33, 34, 35],
    [EVENT_NAMES.DATEPICKER_NLP]: [36, 37],
    [EVENT_NAMES.NLP_SEARCH]: [38],
    [EVENT_NAMES.OVERVIEW_TOOLTIP]: [82, 83],
}
