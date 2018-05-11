import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showSidebar: false,
    annotation: {},
}

const setShowSidebar = (state, showSidebar) => ({
    ...state,
    showSidebar: showSidebar,
})

const closeSidebar = state => ({
    ...state,
    showSidebar: false,
})

const setAnnotation = (state, annotation) => ({
    ...state,
    annotation: annotation,
})

export default createReducer(
    {
        [actions.setShowSidebar]: setShowSidebar,
        [actions.closeSidebar]: closeSidebar,
        [actions.setAnnotation]: setAnnotation,
    },
    defaultState,
)
