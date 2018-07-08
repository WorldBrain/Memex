import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showTagFilter: false,
    showDomainFilter: false,
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

export default createReducer(
    {
        [actions.hideDomainFilter]: hideDomainFilter,
        [actions.showDomainFilter]: showDomainFilter,
        [actions.hideTagFilter]: hideTagFilter,
        [actions.showTagFilter]: showTagFilter,
    },
    defaultState,
)
