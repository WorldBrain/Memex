import { createReducer } from 'redux-act'

import * as actions from './actions'
import { STATUS } from './constants'

const defaultStats = {
    saved: 0,
    sizeEngaged: 0,
    notDownloaded: 0,
    sizeRequired: 0,
    timeEstim: 0,
}

const defaultState = {
    downloadData: [],
    historyStats: defaultStats,
    bookmarksStats: defaultStats,
    loadingStatus: STATUS.STOPPED,
    indexRebuildingStatus: STATUS.STOPPED,
    downloadDataFilter: 'all',
}

const addDownloadDetails = (state, payload) => ({
    ...state,
    downloadData: [
        ...state.downloadData,
        payload,
    ],
})

// Sets whatever key to the specified val
const genericReducer = (key, val) => state => ({ ...state, [key]: val })
// Sets whatever key to payload
const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

// Simple reducers constructed for state keys
const setImportState = val => genericReducer('loadingStatus', val)
const setIndexState = val => genericReducer('indexRebuildingStatus', val)

export default createReducer({
    [actions.startImport]: setImportState(STATUS.RUNNING),
    [actions.stopImport]: setImportState(STATUS.STOPPED),
    [actions.pauseImport]: setImportState(STATUS.PAUSED),
    [actions.resumeImport]: setImportState(STATUS.RUNNING),
    [actions.startIndexRebuild]: setIndexState(STATUS.RUNNING),
    [actions.stopIndexRebuild]: setIndexState(STATUS.STOPPED),
    [actions.addDownloadDetails]: addDownloadDetails,
    [actions.filterDownloadDetails]: payloadReducer('downloadDataFilter'),
    [actions.initImportState]: payloadReducer('loadingStatus'),
    [actions.initHistoryStats]: payloadReducer('historyStats'),
    [actions.initBookmarksStats]: payloadReducer('bookmarksStats'),
    [actions.initDownloadData]: payloadReducer('downloadData'),
}, defaultState)
