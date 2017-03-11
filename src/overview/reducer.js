import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchResult: {rows: []},
    query: '',
    waitingForResults: 0,
}

function setQuery(state, {query}) {
    return {...state, query}
}

function setSearchResult(state, {searchResult}) {
    return {...state, searchResult}
}

function showLoadIndicator(state) {
	return {...state, waitingForResults: state.waitingForResults+1}
}

function hideLoadIndicator(state) {
    return {...state, waitingForResults: state.waitingForResults-1}
}

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setSearchResult]: setSearchResult,
    [actions.showLoadIndicator]: showLoadIndicator,
    [actions.hideLoadIndicator]: hideLoadIndicator,
}, defaultState)
