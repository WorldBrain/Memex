import { createReducer } from 'redux-act'
import { combineReducers } from 'redux'

import * as actions from './actions'
import State, { Annotation, Page } from './types'
import {
    reducer as commentBoxReducer,
    defaultState as defCommentBoxState,
} from '../comment-box'

export const defaultState: State = {
    isOpen: false,
    page: {
        url: null,
        title: null,
    },
    annotations: [],
    commentBox: defCommentBoxState,
}

const setSidebarOpen = (state: boolean, isOpen: boolean) => isOpen

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

const isOpenReducer = createReducer<boolean>(on => {
    on(actions.setSidebarOpen, setSidebarOpen)
}, defaultState.isOpen)

const pageReducer = createReducer<Page>(on => {
    on(actions.setPage, setPage)
    on(actions.setPageUrl, setPageUrl)
    on(actions.setPageTitle, setPageTitle)
}, defaultState.page)

const annotationsReducer = createReducer<Annotation[]>(on => {
    on(actions.setAnnotations, setAnnotations)
}, defaultState.annotations)

const reducer = combineReducers<State>({
    isOpen: isOpenReducer,
    commentBox: commentBoxReducer,
    page: pageReducer,
    annotations: annotationsReducer,
})

export default reducer
