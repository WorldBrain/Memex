import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchResult: {rows: []},
    query: '',
    waitingForResults: 0,
    startDate: '', 
    endDate: ''
}

function setQuery(state, {query}) {
    return {...state, query}
}

function setSearchResult(state, {searchResult}) {
    return {...state, searchResult}
}

function showLoadingIndicator(state) {
    // We have to keep a counter, rather than a boolean, as it can currently
    // happen that multiple subsequent searches are running simultaneously. The
    // animation will thus hide again when all of them have completed.
    return {...state, waitingForResults: state.waitingForResults+1}
}

function hideLoadingIndicator(state) {
    return {...state, waitingForResults: state.waitingForResults-1}
}

function handleStartChange(state, {startDate}) {
    return {...state, startDate}
}

function handleEndChange(state, {endDate}) { 
    return {...state, endDate}
}

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setSearchResult]: setSearchResult,
    [actions.showLoadingIndicator]: showLoadingIndicator,
    [actions.hideLoadingIndicator]: hideLoadingIndicator,
    [actions.handleStartChange]:handleStartChange,
    [actions.handleEndChange]:handleEndChange,
}, defaultState)
