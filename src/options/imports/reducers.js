import { createReducer } from 'redux-act'

import * as actions from './actions'
import {
    STATUS,
    FILTERS,
    IMPORT_TYPE as TYPE,
    DOWNLOAD_STATUS as DL_STAT,
    DEF_CONCURRENCY,
} from './constants'

const defStatsState = val => ({
    [TYPE.HISTORY]: val,
    [TYPE.BOOKMARK]: val,
    [TYPE.OLD]: val,
})

const defaultState = {
    showOldExt: false,
    downloadData: [],
    remaining: defStatsState({}), // Remaining item lists (estimates view + import item progress)
    completedCounts: defStatsState(0), // Count of docs already in DB (estimates view)
    fail: defStatsState(0), // Fail counts for completed import items
    success: defStatsState(0), // Success counts for completed import items
    totals: defStatsState(0), // Mostly-static counts from the start of an import to show
    importStatus: STATUS.LOADING,
    loadingMsg: 'Analyzing & preparing your browsing history & bookmarks',
    downloadDataFilter: FILTERS.ALL,
    concurrency: DEF_CONCURRENCY,
    isAdvEnabled: false,
    isFileUploading: false,
    allowTypes: defStatsState(false),
    showDownloadDetails: false,
}

const reduceCompletedCounts = (state, { type, hasBookmark, status }) => {
    if (status !== DL_STAT.SUCC) {
        return state
    }

    const newState = { ...state }

    newState[type]++
    // Only for old ext imports
    if (type === TYPE.OLD && hasBookmark) {
        newState[TYPE.BOOKMARK]++
    }

    return newState
}

const reduceRemainingLists = (state, { key, status }) => {
    if (status !== DL_STAT.SUCC) {
        return state
    }

    const newState = {}

    for (const type in state) {
        const { [key]: finishedItem, ...remainingItems } = state[type]
        newState[type] = remainingItems
    }

    return newState
}

/**
 * Add given download details as a new row, as well as triggering an update of counts
 */
const addDownloadDetailsReducer = (
    state,
    { url, type, status = DL_STAT.FAIL, error, hasBookmark, key },
) => {
    const countState = status === DL_STAT.SUCC ? 'success' : 'fail'

    return {
        ...state,
        completedCounts: reduceCompletedCounts(state.completedCounts, {
            type,
            hasBookmark,
            status,
        }),
        remaining: reduceRemainingLists(state.remaining, { key, status }),
        [countState]: {
            ...state[countState],
            [type]: state[countState][type] + 1,
        },
        downloadData: [
            ...state.downloadData,
            { url, type, status, error }, // Add new details row
        ],
    }
}

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
    downloadData: defaultState.downloadData,
    success: defaultState.success,
    fail: defaultState.fail,
})

const prepareImportReducer = state => ({
    ...state,
    importStatus: STATUS.LOADING,
    loadingMsg: 'Making last import preparations and we are good to go!',
})

const cancelImportReducer = state => ({
    ...state,
    importStatus: STATUS.LOADING,
    loadingMsg: 'Finishing off URLs that have already been started.',
})

const initCache = (state, cache) => ({
    ...state,
    ...cache,
})

const reduceTotalsCountsFromRemaining = remaining => {
    const newTotalsState = {}
    for (const key in remaining) {
        newTotalsState[key] = Object.keys(remaining[key]).length
    }
    return newTotalsState
}

const startImport = state => ({
    ...state,
    importStatus: STATUS.RUNNING,
    totals: reduceTotalsCountsFromRemaining(state.remaining),
})

// Sets whatever key to the specified val
const genericReducer = (key, val) => state => ({ ...state, [key]: val })
// Sets whatever key to payload
const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

// Simple reducers constructed for state keys
const setImportState = val => genericReducer('importStatus', val)

export default createReducer(
    {
        [actions.initAllowTypes]: payloadReducer('allowTypes'),
        [actions.prepareImport]: prepareImportReducer,
        [actions.startImport]: startImport,
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
        [actions.initFailCounts]: payloadReducer('fail'),
        [actions.initSuccessCounts]: payloadReducer('success'),
        [actions.initDownloadData]: payloadReducer('downloadData'),
        [actions.initCache]: initCache,
        [actions.setShowOldExt]: payloadReducer('showOldExt'),

        // Adv settings mode reducers
        [actions.setConcurrency]: (state, concurrency) => ({
            ...state,
            concurrency,
        }),
        [actions.setFileUploading]: (state, isFileUploading) => ({
            ...state,
            isFileUploading,
        }),
        [actions.toggleAdvMode]: state => ({
            ...state,
            isAdvEnabled: !state.isAdvEnabled,
        }),
        [actions.showDownloadDetails]: state => ({
            ...state,
            showDownloadDetails: !state.showDownloadDetails,
        }),
    },
    defaultState,
)
