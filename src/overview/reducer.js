import uniqBy from 'lodash/fp/uniqBy'
import update from 'lodash/fp/update'
import remove from 'lodash/fp/remove'
import { createReducer } from 'redux-act'

import * as actions from './actions'


const defaultState = {
    searchResult: {rows: []},
    query: '',
    waitingForResults: false,
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

function startNewSearch(state) {
    return {
        ...state,
        // Remove the currently displayed results
        searchResult: defaultState.searchResult,
        waitingForResults: true,
    }
}

function startExpandSearch(state) {
    return {
        ...state,
        waitingForResults: true,
    }
}

function finishNewSearch(state, {value, error, cancelled}) {
    const searchResult = value || state.searchResult
    return {
        ...state,
        searchResult,
        waitingForResults: false,
    }
}

function finishExpandSearch(state, {value: newResult, error, cancelled}) {
    // We prepend old rows to the new result, not vice versa, to keep other info
    // (esp. searchedUntil) from the new result.
    const prependRows = moreRows => update('rows',
        // uniqBy may currently be needed to dedupe when includeContext is used.
        rows => uniqBy('id')(moreRows.concat(rows))
    )

    const searchResult = newResult
        ? prependRows(state.searchResult.rows)(newResult)
        : state.searchResult

    return {
        ...state,
        searchResult,
        waitingForResults: false,
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
    [actions.newSearch.pending]: startNewSearch,
    [actions.newSearch.finished]: finishNewSearch,
    [actions.expandSearch.pending]: startExpandSearch,
    [actions.expandSearch.finished]: finishExpandSearch,
    [actions.hideVisit]: hideVisit,
}, defaultState)
