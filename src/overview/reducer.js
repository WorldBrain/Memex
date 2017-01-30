import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchResult: {rows: []},
    query: '',
}

function setQuery(state, {query}) {
    return {...state, query}
}

function setSearchResult(state, {searchResult}) {
    return {...state, searchResult}
}

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setSearchResult]: setSearchResult,
}, defaultState)
