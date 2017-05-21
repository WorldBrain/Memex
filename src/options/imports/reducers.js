import { createReducer } from 'redux-act'

import * as actions from './actions'
import { STATUS, DOWNLOAD_TYPE as TYPE } from './constants'

const defaultStats = {
    [TYPE.HISTORY]: 0,
    [TYPE.BOOKMARK]: 0,
}

const defaultState = {
    downloadData: [],
    completed: defaultStats,    // Count of docs already in DB (estimates view)
    fail: defaultStats,         // Fail counts for completed import items
    success: defaultStats,      // Success counts for completed import items
    totals: defaultStats,       // Static state to use to derive remaining counts from
    importStatus: STATUS.INIT,
    downloadDataFilter: 'all',
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
 * For a given type of import, add a new completed download's details.
 * @param {string} type The import type to update the count of (bookmarks/history)
 */
const addDownloadDetails = type => (state, { url, status, err }) => ({
    ...state,
    ...updateCountReducer(state, type, status),
    downloadData: [
        ...state.downloadData,
        { url, status, err },     // Add new details row
    ],
})

const finishImportsReducer = state => ({
    ...state,
    importStatus: STATUS.IDLE,
    success: defaultStats,
    fail: defaultStats,
})

const initEstimateCounts = (state, { remaining, completed }) => ({ ...state, totals: remaining, completed })

// Sets whatever key to the specified val
const genericReducer = (key, val) => state => ({ ...state, [key]: val })
// Sets whatever key to payload
const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

// Simple reducers constructed for state keys
const setImportState = val => genericReducer('importStatus', val)
const setIndexState = val => genericReducer('indexRebuildingStatus', val)

export default createReducer({
    [actions.initImport]: setImportState(STATUS.INIT),
    [actions.startImport]: setImportState(STATUS.RUNNING),
    [actions.stopImport]: setImportState(STATUS.STOPPED),
    [actions.finishImport]: finishImportsReducer,
    [actions.pauseImport]: setImportState(STATUS.PAUSED),
    [actions.resumeImport]: setImportState(STATUS.RUNNING),
    [actions.finishBookmarkItem]: addDownloadDetails(TYPE.BOOKMARK),
    [actions.finishHistoryItem]: addDownloadDetails(TYPE.HISTORY),
    [actions.filterDownloadDetails]: payloadReducer('downloadDataFilter'),
    [actions.initImportState]: payloadReducer('importStatus'),
    [actions.initEstimateCounts]: initEstimateCounts,
    [actions.initTotalsCounts]: payloadReducer('totals'),
    [actions.initFailCounts]: payloadReducer('fail'),
    [actions.initSuccessCounts]: payloadReducer('success'),
    [actions.initDownloadData]: payloadReducer('downloadData'),
}, defaultState)
