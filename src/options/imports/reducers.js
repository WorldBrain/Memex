import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultProgress = {
    progress: 0,
    total: 0,
    successful: 0,
    failed: 0,
}

const defaultStats = {
    saved: 0,
    sizeEngaged: 0,
    notDownloaded: 0,
    sizeRequired: 0,
    timeEstim: 0,
}

const defaultState = {
    loadingStatus: 'stopped',
    indexRebuildingStatus: 'stopped',
    downloadData: [],
    historyProgress: defaultProgress,
    bookmarksProgress: defaultProgress,
    historyStats: defaultStats,
    bookmarksStats: defaultStats,
    downloadDataFilter: 'all',
}

const startImport = state => ({
    ...state,
    loadingStatus: 'pending',
})

const resumeImport = startImport

const stopImport = state => ({
    ...state,
    loadingStatus: 'stopped',
})

const pauseImport = state => ({
    ...state,
    loadingStatus: 'paused',
})

const startIndexRebuild = state => ({
    ...state,
    indexRebuildingStatus: 'pending',
})

const stopIndexRebuild = (state, payload) => ({
    ...state,
    indexRebuildingStatus: 'stopped',
})

const filterDownloadDetails = (state, payload) => ({
    ...state,
    downloadDataFilter: payload,
})

export default createReducer({
    [actions.startImport]: startImport,
    [actions.stopImport]: stopImport,
    [actions.pauseImport]: pauseImport,
    [actions.resumeImport]: resumeImport,
    [actions.startIndexRebuild]: startIndexRebuild,
    [actions.stopIndexRebuild]: stopIndexRebuild,
    [actions.filterDownloadDetails]: filterDownloadDetails,
}, defaultState)
