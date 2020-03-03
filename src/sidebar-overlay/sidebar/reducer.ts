import { createReducer } from 'redux-act'
import { combineReducers } from 'redux'

import * as actions from './actions'
import State, { Page } from './types'
import {
    defaultState as defCommentBoxState,
    default as commentBoxReducer,
} from '../comment-box/reducer'
import AnnotationsManager from '../../annotations/annotations-manager'
import {
    appendAnnotations as appendAnnotationsAction,
    setAnnotations as setAnnotationsAction,
} from 'src/annotations/actions'
import { Annotation } from 'src/annotations/types'

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
    currentResultPage: 0,
    resultsExhausted: false,
    searchType: 'notes',
    pageType: 'page',
    isSocialPost: false,
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
    on(setAnnotationsAction, setAnnotations)
    on(appendAnnotationsAction, (state, payload) => [...payload, ...state])
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

const currentResultPage = createReducer(on => {
    on(actions.resetResultsPage, page => defaultState.currentResultPage)
    on(actions.nextResultsPage, page => page + 1)
}, defaultState.currentResultPage)

const resultsExhausted = createReducer(on => {
    on(actions.setResultsExhausted, (state, payload) => payload)
}, defaultState.resultsExhausted)

const pageTypeReducer = createReducer(on => {
    on(actions.setPageType, (state, payload) => payload)
}, defaultState.pageType)

const searchTypeReducer = createReducer(on => {
    on(actions.setSearchType, (state, payload) => payload)
}, defaultState.searchType)

const isSocialPostReducer = createReducer(on => {
    on(actions.setIsSocialPost, (state, payload) => payload)
}, defaultState.isSocialPost)

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
    currentResultPage,
    resultsExhausted,
    searchType: searchTypeReducer,
    pageType: pageTypeReducer,
    isSocialPost: isSocialPostReducer,
})

export default reducer
