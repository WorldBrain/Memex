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

export const EGG_TITLE = 'easter'
export const EGG_URL = 'http://easter.com'
export const EGG_IMG = 'http://easter.com/egg.png'
