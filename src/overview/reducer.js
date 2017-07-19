import fromPairs from 'lodash/fp/fromPairs'
import update from 'lodash/fp/update'
import remove from 'lodash/fp/remove'
import { createReducer } from 'redux-act'

import * as actions from './actions'


const defaultState = {
    // The current search result list.
    searchResult: {rows: []},
    // The current input values.
    currentQueryParams: {
        query: '',
        startDate: undefined,
        endDate: undefined,
    },
    // The input values used in the most recent (possibly still pending) search action.
    activeQueryParams: undefined,
    waitingForResults: false,
    deleteConfirmProps: {
        isShown: false,
        visitId: '',
    },
}

function setQuery(state, query) {
    return {...state, currentQueryParams: {...state.currentQueryParams, query}}
}

function setStartDate(state, date) {
    return {...state, currentQueryParams: {...state.currentQueryParams, startDate: date}}
}

function setEndDate(state, date) {
    return {...state, currentQueryParams: {...state.currentQueryParams, endDate: date}}
}

function startNewSearch(state) {
    return {
        ...state,
        // Remove the currently displayed results
        searchResult: defaultState.searchResult,
        waitingForResults: true,
        activeQueryParams: {...state.currentQueryParams},
    }
}

function startExpandSearch(state) {
    return {
        ...state,
        waitingForResults: true,
        activeQueryParams: {...state.currentQueryParams},
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
    const searchResult = newResult
        ? {...newResult, rows: concatResultRows(state.searchResult.rows, newResult.rows)}
        : state.searchResult // search failed or was cancelled; don't change the results.

    return {
        ...state,
        searchResult,
        waitingForResults: false,
    }
}

function hideVisit(state, visitId) {
    return update('searchResult.rows',
        rows => remove(row => row.id === visitId)(rows)
    )(state)
}

const showDeleteConfirm = (state, visitId) => ({
    ...state,
    deleteConfirmProps: {
        ...state.deleteConfirmProps,
        isShown: true,
        visitId,
    },
})

const hideDeleteConfirm = state => ({
    ...state,
    deleteConfirmProps: { ...state.deleteConfirmProps, isShown: false },
})

export default createReducer({
    [actions.setQuery]: setQuery,
    [actions.setStartDate]: setStartDate,
    [actions.setEndDate]: setEndDate,
    [actions.showDeleteConfirm]: showDeleteConfirm,
    [actions.hideDeleteConfirm]: hideDeleteConfirm,
    [actions.newSearch.pending]: startNewSearch,
    [actions.newSearch.finished]: finishNewSearch,
    [actions.expandSearch.pending]: startExpandSearch,
    [actions.expandSearch.finished]: finishExpandSearch,
    [actions.hideVisit]: hideVisit,
}, defaultState)


export function concatResultRows(leftSide, rightSide) {
    // Because includeContext may have been used, we do an overcomplicated little dance to remove
    // any overlapping bits of results, while ensuring only the contextual results are removed.

    // Clone the arrays as we will mutate them.
    leftSide = [...leftSide]
    rightSide = [...rightSide]
    // Make a mapping {docId: rowIndex}
    const rightSideIndex = fromPairs(rightSide.map((row, i) => [row.id, i]))
    // Walk back from the end of the left array...
    for (let i = leftSide.length-1; i >= 0; i--) {
        const id = leftSide[i].id
        // ...while its docs are also present in the right array...
        if (!(id in rightSideIndex)) break
        // ...and remove each duplicate from the side where it was merely a piece of context.
        if (leftSide[i].isContextualResult) {
            leftSide.splice(i, 1)
        } else {
            rightSide.splice(rightSideIndex[id], 1)
            // (note that the index is still correct for items left of the removed item)
        }
    }
    return leftSide.concat(rightSide)
}
