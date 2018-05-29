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
export const EGG_URL = '/options.html#/acknowledgements'
export const EGG_IMG = '/../../../../img/thanks.gif'
export const SHOWN_TAGS_LIMIT = 3
export const SHOWN_FILTER_LIMIT = 3

/**
 * Pattern to match entire string to match `domain.tld`-like format + optional subdomain
 * prefix, ccTLD postfix, `site:` prefix, and excluded `-` prefix.
 */
export const DOMAIN_TLD_PATTERN = /^-?(site:)?(\w+\.)?[\w-]{2,}\.\w{2,3}(\.\w{2})?$/

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

/**
 * Pattern to match hashtag prefix syntax for tags.
 */
export const HASH_TAG_PATTERN = /^-?#\w[\w+]*$/

export const SHOW_TOOL_TIP = 'is-overview-tooltips-shown'

export const TOOL_TIP = 'overview-tooltips'
