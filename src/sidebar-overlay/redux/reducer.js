import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    annotations: [],
    // When a user creates an annotation via tooltip, the anchor gets saved in state
    anchor: null,
    // Information about the page to pass to the storage
    page: {
        url: null,
        title: null,
    },
    // PK (url) of the active annotation
    activeAnnotation: '',
    // PK (url) of the annotation which the user's mouse is over
    hoveredAnnotation: '',
}

const setAnnotations = (state, annotations) => ({
    ...state,
    annotations: annotations,
})

const setPageInfo = (state, page) => ({
    ...state,
    page: page,
})

const setAnchor = (state, anchor) => ({
    ...state,
    anchor: anchor,
})

const setActiveAnnotation = (state, activeUrl) => ({
    ...state,
    activeAnnotation: activeUrl,
})

const setHoveredAnnotation = (state, hoveredUrl) => ({
    ...state,
    activeAnnotation: hoveredUrl,
})

export default createReducer(
    {
        [actions.setAnnotations]: setAnnotations,
        [actions.setPageInfo]: setPageInfo,
        [actions.setAnchor]: setAnchor,
        [actions.setActiveAnnotation]: setActiveAnnotation,
        [actions.setHoveredAnnotation]: setHoveredAnnotation,
    },
    defaultState,
)
