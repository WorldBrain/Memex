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
    commentBox: defCommentBoxState,
}

const setAnnotationsManager = (
    state: AnnotationsManager,
    annotationsManager: AnnotationsManager,
) => annotationsManager

const setSidebarOpen = (state: boolean, isOpen: boolean) => isOpen

const setIsLoading = (state: boolean, isLoading: boolean) => isLoading

const setPage = (state: Page, page: Page) => page

const setPageUrl = (state: Page, url: string) => ({
    ...state,
    url,
})

const setPageTitle = (state: Page, title: string) => ({
    ...state,
    title,
})

const setAnnotations = (state: Annotation[], annotations: Annotation[]) =>
    annotations

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
    on(actions.setPageUrl, setPageUrl)
    on(actions.setPageTitle, setPageTitle)
}, defaultState.page)

const annotationsReducer = createReducer<Annotation[]>(on => {
    on(actions.setAnnotations, setAnnotations)
}, defaultState.annotations)

const reducer = combineReducers<State>({
    annotationsManager: annotationsManagerReducer,
    isOpen: isOpenReducer,
    isLoading: isLoadingReducer,
    page: pageReducer,
    annotations: annotationsReducer,
    commentBox: commentBoxReducer,
})

export default reducer
