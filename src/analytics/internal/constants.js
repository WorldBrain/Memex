export const API_HOST =
    process.env.NODE_ENV === 'production'
        ? 'https://2s1jj0js02.execute-api.eu-central-1.amazonaws.com/production'
        : 'https://a8495szyaa.execute-api.eu-central-1.amazonaws.com/staging'

// This is used to change the event type into integer to optimize the space
export const MapEventTypeToInt = {
    successful_search: {
        id: 1,
        notifType: 'successful_search',
    },
    paginate_search: {
        id: 2,
        notifType: 'successful_search',
    },
    unsuccessful_search: {
        id: 3,
        notifType: 'unsuccessful_search',
    },
    datepicker_by_dropdown_start_date: {
        id: 4,
        notifType: 'datepicker',
    },
    datepicker_clear_start_date: {
        id: 5,
        notifType: 'datepicker',
    },
    datepicker_by_dropdown_end_date: {
        id: 6,
        notifType: 'datepicker',
    },
    datepicker_clear_end_date: {
        id: 7,
        notifType: 'datepicker',
    },
    bookmark_filter: {
        id: 8,
        notifType: 'bookmark_filter',
    },
    tag_filter: {
        id: 9,
        notifType: 'tag_filter',
    },
    domain_filter: {
        id: 10,
        notifType: 'domain_filter',
    },
    add_tag: {
        id: 12,
        notifType: 'tagging',
    },
    delete_tag: {
        id: 13,
        notifType: 'tagging',
    },
    delete_result: {
        id: 14,
    },
    create_result_bookmark: {
        id: 15,
        notifType: 'bookmark',
    },
    remove_result_bookmark: {
        id: 16,
        notifType: 'bookmark',
    },
    create_browser_bookmark: {
        id: 17,
        notifType: 'bookmark',
    },
    remove_browser_bookmark: {
        id: 18,
        notifType: 'bookmark',
    },
    create_popup_bookmark: {
        id: 19,
        notifType: 'bookmark',
    },
    remove_popup_bookmark: {
        id: 20,
        notifType: 'bookmark',
    },
    add_popup_tag: {
        id: 21,
        notifType: 'tagging',
    },
    delete_popup_tag: {
        id: 22,
        notifType: 'tagging',
    },
    blacklist_site: {
        id: 23,
        notifType: 'blacklist',
    },
    blacklist_domain: {
        id: 24,
        notifType: 'blacklist',
    },
    remove_blacklist_entry: {
        id: 25,
        notifType: 'blacklist',
    },
    'change_tracking_pref_opt-out': {
        id: 26,
    },
    'change_tracking_pref_opt-in': {
        id: 27,
    },
    start_import: {
        id: 28,
    },
    pause_import: {
        id: 29,
    },
    resume_import: {
        id: 30,
    },
    cancel_import: {
        id: 31,
    },
    finish_import: {
        id: 32,
    },
    search_popup: {
        id: 33,
        notifType: 'address_bar_search',
    },
    successful_omnibar_search: {
        id: 34,
        notifType: 'address_bar_search',
    },
    unsuccessful_omnibar_search: {
        id: 35,
        notifType: 'address_bar_search',
    },
    datepicker_by_nlp_start_date: {
        id: 36,
        notifType: 'datepicker_nlp',
    },
    datepicker_by_nlp_end_date: {
        id: 37,
        notifType: 'datepicker_nlp',
    },
    nlp_search: {
        id: 38,
        notifType: 'nlp_search',
    },
    onboarding_cancel_import: {
        id: 39,
    },
    onboarding_finish_import: {
        id: 40,
    },
    add_blacklist_entry: {
        id: 41,
        notifType: 'blacklist',
    },
}

export const MapNotifTypeToIntArray = {
    successful_search: [1, 2],
    unsuccessful_search: [3],
    datepicker: [4, 5, 6, 7],
    bookmark_filter: [8],
    tag_filter: [9],
    domain_filter: [10],
    tagging: [12, 13, 21, 22],
    bookmark: [14, 15, 16, 17, 18, 19, 20],
    blacklist: [23, 24, 25, 41],
    address_bar_search: [33, 34, 35],
    datepicker_nlp: [36, 37],
    nlp_search: [38],
}
