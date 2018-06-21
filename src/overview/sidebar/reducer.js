import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showSidebar: false,
    mouseOnSidebar: false,
    pageUrl: '',
}

const setShowSidebar = (state, showSidebar) => ({
    ...state,
    showSidebar: showSidebar,
})

const closeSidebar = state => ({
    ...state,
    showSidebar: false,
})

const setPageUrl = (state, pageUrl) => ({
    ...state,
    pageUrl: pageUrl,
})

const toggleMouseOnSidebar = state => ({
    ...state,
    mouseOnSidebar: !state.mouseOnSidebar,
})

export default createReducer(
    {
        [actions.setShowSidebar]: setShowSidebar,
        [actions.closeSidebar]: closeSidebar,
        [actions.setPageUrl]: setPageUrl,
        [actions.toggleMouseOnSidebar]: toggleMouseOnSidebar,
    },
    defaultState,
)
