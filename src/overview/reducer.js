import update from 'lodash/fp/update'
import remove from 'lodash/fp/remove'
import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    searchResult: {rows: []},
    query: '',
    currentPage: 0, // Current page in overview results list
    waitingForResults: 0, // Main search loading state
    waitingForMoreResults: 0, // Inf scroll loading state
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

function showLoadingIndicator(state) {
    // We have to keep a counter, rather than a boolean, as it can currently
    // happen that multiple subsequent searches are running simultaneously. The
    // animation will thus hide again when all of them have completed.
    return {...state, waitingForResults: state.waitingForResults + 1}
}

function hideLoadingIndicator(state) {
    return {...state, waitingForResults: state.waitingForResults - 1}
}

function hideVisit(state, {visitId}) {
    return update('searchResult.rows',
        rows => remove(row => row.id === visitId)(rows)
    )(state)
}

const nextPage = state => ({
    ...state,
    currentPage: state.currentPage + 1,
})

const resetPage = state => ({
    ...state,
    currentPage: defaultState.currentPage,
})

const makeMoreLoadingReducer = inc => state => ({
    ...state,
    waitingForMoreResults: state.waitingForMoreResults + inc,
})

const appendSearchResult = (state, {searchResult: {rows: newRows}}) => ({
    ...state,
    searchResult: {
        rows: [
            ...state.searchResult.rows,
            ...newRows,
        ],
    },
})

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setStartDate]: setStartDate,
    [actions.setEndDate]: setEndDate,
    [actions.setSearchResult]: setSearchResult,
    [actions.appendSearchResult]: appendSearchResult,
    [actions.showLoadingIndicator]: showLoadingIndicator,
    [actions.hideLoadingIndicator]: hideLoadingIndicator,
    [actions.showMoreLoading]: makeMoreLoadingReducer(1),
    [actions.hideMoreLoading]: makeMoreLoadingReducer(-1),
    [actions.hideVisit]: hideVisit,
    [actions.nextPage]: nextPage,
    [actions.resetPage]: resetPage,
}, defaultState)
