import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    loadingHistoryStatus: null,
    searchIndexRebuildingStatus: null
}

const startLoadingHistory = state => ({
    ...state,
    loadingHistoryStatus: 'pending'
})

const stopLoadingHistory = (state, payload) => ({
    ...state,
    loadingHistoryStatus: payload.status
})

const resumeLoadingHistory = (state, payload) => ({
    ...state,
    loadingHistoryStatus: 'pending'
})

const startSearchIndexRebuild = state => ({
    ...state,
    searchIndexRebuildingStatus: 'pending'
})

const stopSearchIndexRebuild = (state, payload) => ({
    ...state,
    searchIndexRebuildingStatus: payload.status
})

export default createReducer({
    [actions.startLoadingHistory]: startLoadingHistory,
    [actions.stopLoadingHistory]: stopLoadingHistory,
    [actions.resumeLoadingHistory]: resumeLoadingHistory,
    [actions.startSearchIndexRebuild]: startSearchIndexRebuild,
    [actions.stopSearchIndexRebuild]: stopSearchIndexRebuild
}, defaultState)
