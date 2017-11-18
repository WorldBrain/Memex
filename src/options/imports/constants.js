/** Filter/projection values for download details table UI filters. */
export const FILTERS = {
    ALL: 'all',
    FAIL: 'fail',
    SUCC: 'success',
}

/** User-facing strings for download statuses. */
export const DOWNLOAD_STATUS = {
    SKIP: 'Skipped',
    FAIL: 'Failed',
    SUCC: 'Success',
}

/** States for importer. */
export const STATUS = {
    LOADING: 'loading',
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
}

/** Different types of imports. */
export const IMPORT_TYPE = {
    BOOKMARK: 'b',
    HISTORY: 'h',
    OLD: 'o', // Old extension page
}

/** Keys used for local storage. */
export const STORAGE_KEYS = {
    HISTORY_STATS: 'history_stats',
    BOOKMARK_STATS: 'bookmark_stats',
    ALLOW_TYPES: 'allow_types',
    DOWNLOAD_DATA: 'import_progress',
    IMPORT_STATE: 'import_state',
    TOTALS_STATE: 'import_totals_state',
    SUCCESS_STATE: 'import_success_progress_state',
    FAIL_STATE: 'import_fail_progress_state',
    IMPORT_CACHE: 'import-estimate-counts',
    IMPORT_CACHE_TIME: 'import-cache-time-calculated',
}

export const IMPORT_CONN_NAME = 'imports-bg-ui-runtime-connection'

/** Commands used for BG <-> UI bi-directional communication */
export const CMDS = {
    INIT: `${IMPORT_CONN_NAME}/INIT`,
    START: `${IMPORT_CONN_NAME}/START`,
    PAUSE: `${IMPORT_CONN_NAME}/PAUSE`,
    RESUME: `${IMPORT_CONN_NAME}/RESUME`,
    FINISH: `${IMPORT_CONN_NAME}/FINISH`,
    CANCEL: `${IMPORT_CONN_NAME}/CANCEL`,
    NEXT: `${IMPORT_CONN_NAME}/NEXT`,
    COMPLETE: `${IMPORT_CONN_NAME}/COMPLETE`,
    SET_CONCURRENCY: `${IMPORT_CONN_NAME}/SET_CONCURRENCY`,
}

/** Estimated time to download a doc (seconds) */
export const DOC_TIME_EST = 1.8

export const DEF_CONCURRENCY = 2

export const OLD_EXT_KEYS = {
    NUM_DONE: 'old-ext-converted-count',
    INDEX: 'index',
    BOOKMARKS: 'bookmarks',
    HIST: 'history',
    BLACKLIST: 'blacklist',
}

export const DEF_ALLOW = {
    [IMPORT_TYPE.HISTORY]: true,
    [IMPORT_TYPE.BOOKMARK]: true,
    [IMPORT_TYPE.OLD]: true,
}
