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

function setSearchResult(state, {searchResult}) {
    return {...state, searchResult}
}

function appendSearchResult(state, {searchResult}) {
    const newResult = update('rows',
        rows => state.searchResult.rows.concat(rows)
    )(searchResult)
    return {...state, searchResult: newResult}
}

function showLoadingIndicator(state, {clearResults}) {
    const { searchResult } = clearResults ? defaultState : state
    // We have to keep a counter, rather than a boolean, as it can currently
    // happen that multiple subsequent searches are running simultaneously. The
    // animation will thus hide again when all of them have completed.
    return {
        ...state,
        searchResult,
        waitingForResults: state.waitingForResults + 1,
    }
}

function hideLoadingIndicator(state) {
    return {...state, waitingForResults: state.waitingForResults - 1}
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
    [actions.setSearchResult]: setSearchResult,
    [actions.appendSearchResult]: appendSearchResult,
    [actions.showLoadingIndicator]: showLoadingIndicator,
    [actions.hideLoadingIndicator]: hideLoadingIndicator,
    [actions.hideVisit]: hideVisit,
}, defaultState)
