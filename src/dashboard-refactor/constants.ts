export const sizeConstants = {
    header: {
        heightPx: 45,
    },
    searchBar: {
        heightPx: 50,
        widthPx: 800,
    },
    listsSidebar: {
        widthPx: 200,
    },
    syncStatusMenu: {
        widthPx: 150,
    },
    searchResults: {
        widthPx: 800,
    },
}

/**
 * Pattern to match string of FilterKey type in search query string
 */
export const SEARCH_QUERY_FILTER_KEY_PATTERN = /(from|to|(-?)[dtc]):/
export const SEARCH_QUERY_FILTER_KEY_PATTERN_G = /(from|to|(-?)[dtc]):/g

/**
 * Pattern to match filter key at end of string
 */
export const SEARCH_QUERY_END_FILTER_KEY_PATTERN = /(from|to|(-?)[dtc]):$/

/**
 * Pattern to test whether a string contains a valid contiguous search filter string
 * at end of string. Such a string starts with a string of type FilterKey and contains
 * comma separated strings (strings with a space are within double commas). A search
 * filter string ends with a space.
 */
export const VALID_FILTER_STRING_PATTERN = /(,|:)("(.+?)"|[^" ]+?) ?$/

/**
 * Pattern to match against individual terms to determine whether or not they are excluded
 * (prefixed with hyphen: -). Also supports site exclusion, which may be prefixed with
 * `site:` syntax.
 */
export const EXCLUDE_PATTERN = /^-(site:)?(?=\w+)/

/**
 * Pattern used to remove excluded syntax, and leading "site:" syntax from a term.
 * This is used after the type of term is determined (excluded, site/normal term, etc.).
 */
export const TERM_CLEAN_PATTERN = /^-?(site:)?-?(?=\w+)/

export const DATE_PICKER_DATE_FORMAT = 'DD-MM-YYYY'

export const PAGE_SIZE = 10

export const SEARCH_INPUT_SPLIT_PATTERN = /-?#\"([-.\w]+ ?)+\"|\S+/g

/**
 * Used to clean the hashtag syntax off any tag filtered via the search bar filter syntax.
 * eg: #tag #"tag tag" -#tag
 */
export const TAG_CLEAN_PATTERN = /[#"]/g

const KEY_PREFIX = '@Dashboard-'

export const STORAGE_KEYS = {
    listSidebarLocked: KEY_PREFIX + 'list_sidebar_locked',
    onboardingMsgSeen: KEY_PREFIX + 'onboarding_msg_seen',
    mobileAdSeen: KEY_PREFIX + 'mobile_ad_seen',
    useOldDash: KEY_PREFIX + 'use_old_dashboard',
}

/**
 * Used for page search, where results aren't grouped by day. Internally, to keep a consistent results
 * data structure for both page and notes search, page search results are still grouped by day though
 * always under a single key. This is that key.
 */
export const PAGE_SEARCH_DUMMY_DAY = -1

export const NON_UNIQ_LIST_NAME_ERR_MSG = 'List name already taken.'

export const FILTER_PICKERS_LIMIT = 20
