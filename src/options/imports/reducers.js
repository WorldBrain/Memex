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

const startImport = state => ({
    ...state,
    loadingStatus: STATUS.RUNNING,
})

const resumeImport = startImport

const stopImport = state => ({
    ...state,
    loadingStatus: STATUS.STOPPED,
})

const pauseImport = state => ({
    ...state,
    loadingStatus: STATUS.PAUSED,
})

const startIndexRebuild = state => ({
    ...state,
    indexRebuildingStatus: STATUS.RUNNING,
})

const stopIndexRebuild = state => ({
    ...state,
    indexRebuildingStatus: STATUS.STOPPED,
})

const addDownloadDetails = (state, payload) => ({
    ...state,
    downloadData: [
        ...state.downloadData,
        payload,
    ],
})

const filterDownloadDetails = (state, payload) => ({
    ...state,
    downloadDataFilter: payload,
})

const setHistoryStats = (state, payload) => ({
    ...state,
    historyStats: payload,
})

const setBookmarksStats = (state, payload) => ({
    ...state,
    bookmarksStats: payload,
})

export default createReducer({
    [actions.startImport]: startImport,
    [actions.stopImport]: stopImport,
    [actions.pauseImport]: pauseImport,
    [actions.resumeImport]: resumeImport,
    [actions.startIndexRebuild]: startIndexRebuild,
    [actions.stopIndexRebuild]: stopIndexRebuild,
    [actions.addDownloadDetails]: addDownloadDetails,
    [actions.filterDownloadDetails]: filterDownloadDetails,
    [actions.setHistoryStats]: setHistoryStats,
    [actions.setBookmarksStats]: setBookmarksStats,
}, defaultState)
