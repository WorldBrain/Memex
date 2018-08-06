import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    annotations: [],
    tags: {},
    annotationCount: 0,
    isLoading: true,
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

const setTags = (state, tags) => ({
    ...state,
    tags: tags,
})

const setAnnotationCount = (state, value) => ({
    ...state,
    annotationCount: value,
})

const setIsLoading = (state, value) => ({
    ...state,
    isLoading: value,
})

const setPageInfo = (state, page) => ({
    ...state,
    page: page,
})

const setActiveAnnotation = (state, activeUrl) => ({
    ...state,
    activeAnnotation: activeUrl,
})

const setHoveredAnnotation = (state, hoveredUrl) => ({
    ...state,
    setHoveredAnnotation: hoveredUrl,
})

export default createReducer(
    {
        [actions.setAnnotations]: setAnnotations,
        [actions.setTags]: setTags,
        [actions.setPageInfo]: setPageInfo,
        [actions.setActiveAnnotation]: setActiveAnnotation,
        [actions.setHoveredAnnotation]: setHoveredAnnotation,
        [actions.setAnnotationCount]: setAnnotationCount,
        [actions.setIsLoading]: setIsLoading,
    },
    defaultState,
)
