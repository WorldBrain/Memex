import update from 'lodash/fp/update'
import remove from 'lodash/fp/remove'
import { createReducer } from 'redux-act'

import * as actions from './actions'


const defaultState = {
    searchResult: {rows: []},
    query: '',
    waitingForResults: 0,
    startDate: undefined,
    endDate: undefined,
}

function setQuery(state, {query}) {
    return {...state, query}
}

function setStartDate(state, {startDate}) {
    return {...state, startDate}
}

function setEndDate(state, {endDate}) {
    return {...state, endDate}
}

function setSearchResult(state, {value: searchResult}) {
    return {...state, searchResult, waitingForResults: false}
}

function startSearch(state, {args: [{clearResults, loadingIndicator}]}) {
    const { searchResult } = clearResults ? defaultState : state
    const waitingForResults = loadingIndicator || state.waitingForResults
    return {
        ...state,
        searchResult,
        waitingForResults,
    }
}

function hideVisit(state, {visitId}) {
    return update('searchResult.rows',
        rows => remove(row => row.id === visitId)(rows)
    )(state)
}

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setStartDate]: setStartDate,
    [actions.setEndDate]: setEndDate,
    [actions.newSearch.complete]: setSearchResult,
    [actions.newSearch.pending]: startSearch,
    [actions.hideVisit]: hideVisit,
}, defaultState)
