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

export const IMPORT_TYPE_DISPLAY = {
    [IMPORT_TYPE.BOOKMARK]: 'bookmarks',
    [IMPORT_TYPE.HISTORY]: 'history',
    [IMPORT_TYPE.OLD]: 'old ext',
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
}

export const IMPORT_CONN_NAME = 'imports-bg-ui-runtime-connection'

export const CMD_PRE = 'imports/'

/** Commands used for BG <-> UI bi-directional communication */
export const CMDS = {
    INIT: `${CMD_PRE}INIT`,
    START: `${CMD_PRE}START`,
    PAUSE: `${CMD_PRE}PAUSE`,
    RESUME: `${CMD_PRE}RESUME`,
    FINISH: `${CMD_PRE}FINISH`,
    CANCEL: `${CMD_PRE}CANCEL`,
    NEXT: `${CMD_PRE}NEXT`,
    COMPLETE: `${CMD_PRE}COMPLETE`,
    SET_CONCURRENCY: `${CMD_PRE}SET_CONCURRENCY`,
    SET_PROCESS_ERRS: `${CMD_PRE}SET_PROCESS_ERRS`,
}

/** Estimated time to download a doc (seconds) */
export const DOC_TIME_EST = 3

export const DEF_CONCURRENCY = 15

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
