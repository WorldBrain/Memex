import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchResults: [],
    query: '',
}

function setQuery(state, {query}) {
    return {...state, query}
}

function setResults(state, {searchResults}) {
    return {...state, searchResults}
}

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setResults]: setResults,
}, defaultState)
