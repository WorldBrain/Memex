export const PAGE_SIZE = 10

export const RESULT_TYPES = {
    UNKNOWN: 'unknown',
    BOOKMARK: 'bookmark',
    VISIT: 'visit',
}

export const SEARCH_CONN_NAME = 'search-bg-ui-runtime-connection'

/** Commands used for BG <-> UI bi-directional communication actions */
export const CMDS = {
    SEARCH: `${SEARCH_CONN_NAME}/SEARCH`,
    RESULTS: `${SEARCH_CONN_NAME}/RESULTS`,
    ERROR: `${SEARCH_CONN_NAME}/ERROR`,
}

export const DATE_PICKER_DATE_FORMAT = 'DD-MM-YYYY'

export const SEARCH_COUNT_KEY = 'number-of-searches'

export const EGG_TITLE = 'Cheers to the awesome crew that made Memex possible'
export const EGG_URL = '/options/options.html#/acknowledgements'
export const EGG_IMG = '/../../../../img/thanks.gif'
export const SHOWN_TAGS_LIMIT = 3
export const SHOWN_FILTER_LIMIT = 3

/* Pattern to match entire string to `domain.tld`-like format + optional subdomain prefix and ccTLD postfix */
export const DOMAIN_TLD_PATTERN = /^(site:)?-?(\w+\.)?[\w-]{2,}\.\w{2,3}(\.\w{2})?$/
export const EXCLUDE_PATTERN = /^(site:)?-(?=\w+)/
export const TERM_CLEAN_PATTERN = /^(site:)?-?(?=\w+)/

/* Pattern to match hashtags - spaces can be represented via '+' */
export const HASH_TAG_PATTERN = /^-?#\w[\w+]*$/

export const SHOW_TOOL_TIP = 'is-overview-tooltips-shown'

export const TOOL_TIP = 'overview-tooltips'
