import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    annotations: any[]
    tags: object
    annotationCount: number
    isLoading: boolean
    page: {
        url: string
        title: string
    }
    activeAnnotation: string
    hoveredAnnotation: string
    congratsMessage: boolean
}

const defaultState: State = {
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
    congratsMessage: false,
}

const setAnnotations = (state: State, annotations: any[]) => ({
    ...state,
    annotations,
})

const setTags = (state: State, tags: object) => ({
    ...state,
    tags,
})

const setAnnotationCount = (state: State, annotationCount: number) => ({
    ...state,
    annotationCount,
})

const setIsLoading = (state: State, isLoading: boolean) => ({
    ...state,
    isLoading,
})

const setPageInfo = (state: State, page: { url: string; title: string }) => ({
    ...state,
    page,
})

const setActiveAnnotation = (state: State, activeAnnotation: string) => ({
    ...state,
    activeAnnotation,
})

const setHoveredAnnotation = (state: State, hoveredAnnotation: string) => ({
    ...state,
    hoveredAnnotation,
})

const setCongratsMessage = (state: State, congratsMessage: boolean) => ({
    ...state,
    congratsMessage,
})

export default createReducer(on => {
    on(actions.setAnnotations, setAnnotations)
    on(actions.setTags, setTags)
    on(actions.setAnnotationCount, setAnnotationCount)
    on(actions.setIsLoading, setIsLoading)
    on(actions.setPageInfo, setPageInfo)
    on(actions.setActiveAnnotation, setActiveAnnotation)
    on(actions.setHoveredAnnotation, setHoveredAnnotation)
    on(actions.setCongratsMessage, setCongratsMessage)
}, defaultState)
