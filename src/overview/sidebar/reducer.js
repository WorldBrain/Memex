import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showSidebar: false,
    annotations: [],
    mouseOnSidebar: false,
}

const setShowSidebar = (state, showSidebar) => ({
    ...state,
    showSidebar: showSidebar,
})

const closeSidebar = state => ({
    ...state,
    showSidebar: false,
})

const setAnnotations = (state, annotations) => ({
    ...state,
    annotations: annotations,
})

const toggleMouseOnSidebar = state => ({
    ...state,
    mouseOnSidebar: !state.mouseOnSidebar,
})

export default createReducer(
    {
        [actions.setShowSidebar]: setShowSidebar,
        [actions.closeSidebar]: closeSidebar,
        [actions.setAnnotations]: setAnnotations,
        [actions.toggleMouseOnSidebar]: toggleMouseOnSidebar,
    },
    defaultState,
)
