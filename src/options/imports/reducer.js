import { createReducer } from 'redux-act'

import * as actions from './actions'
import {
    STATUS,
    FILTERS,
    IMPORT_TYPE as TYPE,
    DOWNLOAD_STATUS as DL_STAT,
    DEF_CONCURRENCY,
} from './constants'

const defaultStats = {
    [TYPE.HISTORY]: 0,
    [TYPE.BOOKMARK]: 0,
    [TYPE.OTHERS]: 0,
}

const defaultState = {
    processErrors: false,
    downloadData: [],
    completed: defaultStats, // Count of docs already in DB (estimates view)
    fail: defaultStats, // Fail counts for completed import items
    success: defaultStats, // Success counts for completed import items
    totals: defaultStats, // Static state to use to derive remaining counts from
    importStatus: STATUS.LOADING,
    loadingMsg: 'Calculating size of history & bookmarks',
    downloadDataFilter: FILTERS.ALL,
    concurrency: DEF_CONCURRENCY,
    isAdvEnabled: false,
    allowTypes: {
        [TYPE.HISTORY]: false,
        [TYPE.BOOKMARK]: false,
        [TYPE.OTHERS]: '',
    },
    showDownloadDetails: false,
    blobUrl: null,
    bookmarkImports: false,
    indexTitle: false,
}

/**
 * A sub-reducer that either the success or fail count of a given import type, depending on success flag.
 * @param {any} state The entire state of the parent reducer.
 * @param {string} type The import type to update the count of (bookmarks/history)
 * @param {isSuccess} boolean Denotes whether or not to update 'success' or 'fail' count.
 */
const updateCountReducer = (state, type, isSuccess) => {
    const stateKey = isSuccess ? 'success' : 'fail'
    return {
        [stateKey]: { ...state[stateKey], [type]: state[stateKey][type] + 1 },
    }
}

/**
 * Add given download details as a new row, as well as triggering an update of counts
 */
const addDownloadDetailsReducer = (
    state,
    { url, type, status = DL_STAT.FAIL, error },
) => ({
    ...state,
    ...updateCountReducer(state, type, status === DL_STAT.SUCC),
    // TODO: Removing for now due to UI perf issues
    // downloadData: [
    //     { url, type, status, error }, // Prepend new details row
    //     ...state.downloadData,
    // ],
})

const toggleAllowTypeReducer = (state, type) => ({
    ...state,
    allowTypes: {
        ...state.allowTypes,
        [type]: !state.allowTypes[type],
    },
})

const setAllowTypeReducer = (state, value) => ({
    ...state,
    allowTypes: {
        ...state.allowTypes,
        [TYPE.OTHERS]: state.allowTypes[TYPE.OTHERS].length === 0 ? value : '',
    },
})

const finishImportsReducer = ({ loading = false, finish = true }) => state => ({
    ...state,
    allowTypes: finish ? defaultState.allowTypes : state.allowTypes,
    importStatus: loading ? STATUS.LOADING : STATUS.IDLE,
    blobUrl: finish ? null : state.blobUrl,
    downloadData: [],
    success: defaultStats,
    fail: defaultStats,
})

const prepareImportReducer = state => {
    return {
        ...state,
        importStatus: STATUS.LOADING,
        loadingMsg: 'Calculating size of history & bookmarks',
    }
}

const cancelImportReducer = state => ({
    ...state,
    importStatus: STATUS.LOADING,
    blobUrl: null,
    loadingMsg: 'Import progress gets saved',
})

const initEstimateCounts = (state, { remaining, completed }) => ({
    ...state,
    totals: { ...state.totals, ...remaining },
    completed: { ...state.completed, ...completed },
})

// Sets whatever key to the specified val
const genericReducer = (key, val) => state => ({ ...state, [key]: val })
// Sets whatever key to payload
const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

// Simple reducers constructed for state keys
const setImportState = val => genericReducer('importStatus', val)

export default createReducer(
    {
        [actions.prepareImport]: prepareImportReducer,
        [actions.startImport]: setImportState(STATUS.RUNNING),
        [actions.stopImport]: setImportState(STATUS.STOPPED),
        [actions.finishImport]: finishImportsReducer({ loading: true }),
        [actions.readyImport]: finishImportsReducer({
            loading: false,
            finish: false,
        }),
        [actions.cancelImport]: cancelImportReducer,
        [actions.pauseImport]: setImportState(STATUS.PAUSED),
        [actions.resumeImport]: setImportState(STATUS.RUNNING),
        [actions.addImportItem]: addDownloadDetailsReducer,
        [actions.toggleAllowType]: toggleAllowTypeReducer,
        [actions.setAllowType]: setAllowTypeReducer,
        [actions.filterDownloadDetails]: payloadReducer('downloadDataFilter'),
        [actions.initImportState]: payloadReducer('importStatus'),
        [actions.initEstimateCounts]: initEstimateCounts,
        [actions.initTotalsCounts]: payloadReducer('totals'),
        [actions.initFailCounts]: payloadReducer('fail'),
        [actions.initSuccessCounts]: payloadReducer('success'),
        [actions.initDownloadData]: payloadReducer('downloadData'),

        // Adv settings mode reducers
        [actions.initAllowTypes]: (state, allowTypes) => ({
            ...state,
            allowTypes: {
                [TYPE.BOOKMARK]:
                    allowTypes[TYPE.BOOKMARK] ||
                    defaultState.allowTypes[TYPE.BOOKMARK],
                [TYPE.HISTORY]:
                    allowTypes[TYPE.HISTORY] ||
                    defaultState.allowTypes[TYPE.HISTORY],
                [TYPE.OTHERS]:
                    allowTypes[TYPE.OTHERS] ||
                    defaultState.allowTypes[TYPE.OTHERS],
            },
        }),
        [actions.setConcurrency]: (state, concurrency) => ({
            ...state,
            concurrency,
        }),
        [actions.showDownloadDetails]: state => ({
            ...state,
            showDownloadDetails: !state.showDownloadDetails,
        }),
        [actions.setProcessErrs]: (state, processErrors) => ({
            ...state,
            processErrors,
            importStatus: STATUS.LOADING,
            loadingMsg: 'Preparing Import.',
        }),
        [actions.setBlobUrl]: (state, blobUrl) => ({
            ...state,
            blobUrl,
        }),
        [actions.toggleBookmarkImports]: state => ({
            ...state,
            bookmarkImports: !state.bookmarkImports,
        }),
        [actions.toggleIndexTitle]: state => ({
            ...state,
            indexTitle: !state.indexTitle,
        }),
    },
    defaultState,
)
