import { createReducer } from 'redux-act'
import { combineReducers } from 'redux'

import * as actions from './actions'
import State, { Annotation, Page } from './types'
import {
    reducer as commentBoxReducer,
    defaultState as defCommentBoxState,
} from './comment-box'
import AnnotationsManager from './annotations-manager'

export const defaultState: State = {
    annotationsManager: null,
    isOpen: false,
    isLoading: false,
    page: {
        url: null,
        title: null,
    },
    annotations: [],
    activeAnnotationUrl: null,
    hoverAnnotationUrl: null,
    commentBox: defCommentBoxState,
    showCongratsMessage: false,
}

const setAnnotationsManager = (
    state: AnnotationsManager,
    annotationsManager: AnnotationsManager,
) => annotationsManager

const setSidebarOpen = (state: boolean, isOpen: boolean) => isOpen

const setIsLoading = (state: boolean, isLoading: boolean) => isLoading

const setPage = (state: Page, page: Page) => page

const setAnnotations = (state: Annotation[], annotations: Annotation[]) =>
    annotations

const setActiveAnnotationUrl = (state: string, activeAnnotationUrl: string) =>
    activeAnnotationUrl

const setHoverAnnotationUrl = (state: string, hoverAnnotationUrl: string) =>
    hoverAnnotationUrl

const setShowCongratsMessage = (state: boolean, showCongratsMessage: boolean) =>
    showCongratsMessage

const annotationsManagerReducer = createReducer<AnnotationsManager>(on => {
    on(actions.setAnnotationsManager, setAnnotationsManager)
}, defaultState.annotationsManager)

const isOpenReducer = createReducer<boolean>(on => {
    on(actions.setSidebarOpen, setSidebarOpen)
}, defaultState.isOpen)

const isLoadingReducer = createReducer<boolean>(on => {
    on(actions.setIsLoading, setIsLoading)
}, defaultState.isLoading)

const pageReducer = createReducer<Page>(on => {
    on(actions.setPage, setPage)
}, defaultState.page)

const annotationsReducer = createReducer<Annotation[]>(on => {
    on(actions.setAnnotations, setAnnotations)
}, defaultState.annotations)

const activeAnnotationUrlReducer = createReducer<string>(on => {
    on(actions.setActiveAnnotationUrl, setActiveAnnotationUrl)
}, defaultState.activeAnnotationUrl)

const hoverAnnotationUrlReducer = createReducer<string>(on => {
    on(actions.setHoverAnnotationUrl, setHoverAnnotationUrl)
}, defaultState.hoverAnnotationUrl)

const showCongratsMessageReducer = createReducer<boolean>(on => {
    on(actions.setShowCongratsMessage, setShowCongratsMessage)
}, defaultState.showCongratsMessage)

const reducer = combineReducers<State>({
    annotationsManager: annotationsManagerReducer,
    isOpen: isOpenReducer,
    isLoading: isLoadingReducer,
    page: pageReducer,
    annotations: annotationsReducer,
    activeAnnotationUrl: activeAnnotationUrlReducer,
    hoverAnnotationUrl: hoverAnnotationUrlReducer,
    commentBox: commentBoxReducer,
    showCongratsMessage: showCongratsMessageReducer,
})

export default reducer
