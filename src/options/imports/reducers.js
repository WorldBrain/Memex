import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    loadingStatus: 'stopped',
    indexRebuildingStatus: 'stopped',
    downloadData: [],
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
