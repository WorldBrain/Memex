export const FILTERS = {
    ALL: 'all',
    FAIL: 'fail',
    SUCC: 'success',
}

export const STATUS = {
    INIT: 'initing',
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    STOPPED: 'stopped',
}

export const DOWNLOAD_TYPE = {
    BOOKMARK: 'bookmark',
    HISTORY: 'history',
}

export const STORAGE_KEYS = {
    HISTORY_STATS: 'history_stats',
    BOOKMARK_STATS: 'bookmark_stats',
    DOWNLOAD_DATA: 'import_progress',
    IMPORT_STATE: 'import_state',
    TOTALS_STATE: 'import_totals_state',
    SUCCESS_STATE: 'import_success_progress_state',
    FAIL_STATE: 'import_fail_progress_state',
}

/** Estimated size of a doc (MB) */
export const DOC_SIZE_EST = 0.2
/** Estimated time to download a doc (minutes) */
export const DOC_TIME_EST = 0.2

