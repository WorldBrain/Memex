import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    loadingStatus: 'stopped',
    indexRebuildingStatus: 'stopped',
}

const startImport = state => ({
    ...state,
    loadingStatus: 'pending',
})

const resumeImport = startImport

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

export default createReducer({
    [actions.startImport]: startImport,
    [actions.pauseImport]: pauseImport,
    [actions.resumeImport]: resumeImport,
    [actions.startIndexRebuild]: startIndexRebuild,
    [actions.stopIndexRebuild]: stopIndexRebuild,
}, defaultState)
