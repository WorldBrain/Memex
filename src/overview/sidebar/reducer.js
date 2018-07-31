import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showSidebar: false,
    mouseOnSidebar: false,
    page: {
        url: '',
        title: '',
    },
}

const setShowSidebar = (state, showSidebar) => ({
    ...state,
    showSidebar: showSidebar,
})

const closeSidebar = state => ({
    ...state,
    showSidebar: false,
})

const setPageInfo = (state, page) => ({
    ...state,
    page: page,
})

const toggleMouseOnSidebar = state => ({
    ...state,
    mouseOnSidebar: !state.mouseOnSidebar,
})

export default createReducer(
    {
        [actions.setShowSidebar]: setShowSidebar,
        [actions.closeSidebar]: closeSidebar,
        [actions.setPageInfo]: setPageInfo,
        [actions.toggleMouseOnSidebar]: toggleMouseOnSidebar,
    },
    defaultState,
)
