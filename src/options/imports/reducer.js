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
}

const defaultState = {
    processErrors: false,
    downloadData: [],
    completed: defaultStats, // Count of docs already in DB (estimates view)
    fail: defaultStats, // Fail counts for completed import items
    success: defaultStats, // Success counts for completed import items
    totals: defaultStats, // Static state to use to derive remaining counts from
    importStatus: STATUS.LOADING,
    loadingMsg:
        'Analysing your browsing history & bookmarks for importing. This can take a few moments.',
    downloadDataFilter: FILTERS.ALL,
    concurrency: DEF_CONCURRENCY,
    isAdvEnabled: false,
    allowTypes: {
        [TYPE.HISTORY]: false,
        [TYPE.BOOKMARK]: false,
    },
    showDownloadDetails: false,
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

const finishImportsReducer = ({ loading = false }) => state => ({
    ...state,
    importStatus: loading ? STATUS.LOADING : STATUS.IDLE,
    downloadData: [],
    success: defaultStats,
    fail: defaultStats,
})

const prepareImportReducer = state => ({
    ...state,
    importStatus: STATUS.LOADING,
    loadingMsg: 'Recalculating Download Size.',
})

const cancelImportReducer = state => ({
    ...state,
    importStatus: STATUS.LOADING,
    loadingMsg: 'Please wait as import progress gets recorded.',
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
        [actions.readyImport]: finishImportsReducer({ loading: false }),
        [actions.cancelImport]: cancelImportReducer,
        [actions.pauseImport]: setImportState(STATUS.PAUSED),
        [actions.resumeImport]: setImportState(STATUS.RUNNING),
        [actions.addImportItem]: addDownloadDetailsReducer,
        [actions.toggleAllowType]: toggleAllowTypeReducer,
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
            },
        }),
        [actions.setConcurrency]: (state, concurrency) => ({
            ...state,
            concurrency,
        }),
        [actions.toggleAdvMode]: state => ({
            ...state,
            isAdvEnabled: !state.isAdvEnabled,
        }),
        [actions.showDownloadDetails]: state => ({
            ...state,
            showDownloadDetails: !state.showDownloadDetails,
        }),
        [actions.setProcessErrs]: (state, processErrors) => ({
            ...state,
            processErrors,
            importStatus: STATUS.LOADING,
            loadingMsg: 'Preparing import.',
        }),
    },
    defaultState,
)
