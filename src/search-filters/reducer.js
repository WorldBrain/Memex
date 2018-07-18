import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showTagFilter: false,
    showDomainFilter: false,
    showFilterTypes: false,
}

const hideDomainFilter = state => ({
    ...state,
    showDomainFilter: false,
})

const showDomainFilter = state => ({
    ...state,
    showDomainFilter: true,
})

const hideTagFilter = state => ({
    ...state,
    showTagFilter: false,
})

const showTagFilter = state => ({
    ...state,
    showTagFilter: true,
})

const hideFilterTypes = state => ({
    ...state,
    showFilterTypes: false,
})

const showFilterTypes = state => ({
    ...state,
    showFilterTypes: true,
})

const toggleFilterTypes = state => ({
    ...state,
    showFilterTypes: !state.showFilterTypes,
})

export default createReducer(
    {
        [actions.hideDomainFilter]: hideDomainFilter,
        [actions.showDomainFilter]: showDomainFilter,
        [actions.hideTagFilter]: hideTagFilter,
        [actions.showTagFilter]: showTagFilter,
        [actions.showFilterTypes]: showFilterTypes,
        [actions.hideFilterTypes]: hideFilterTypes,
        [actions.toggleFilterTypes]: toggleFilterTypes,
    },
    defaultState,
)
