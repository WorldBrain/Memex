/* tslint:disable:no-shadowed-variable */
import { createSelector } from 'reselect'

import State from './types'
// NOTE: Any parent reducer will need to define state for the sidebar in a
// property called `sidebar`.
export const sidebar: (state) => State = (state) => state.sidebar

export const isOpen = createSelector(sidebar, (state) => state.isOpen)

export const isLoading = createSelector(sidebar, (state) => state.isLoading)

export const page = createSelector(sidebar, (state) => state.page)

export const pageUrl = createSelector(page, (state) => state.url)

export const pageTitle = createSelector(page, (state) => state.title)

export const annotations = createSelector(sidebar, (state) => state.annotations)

export const activeAnnotationUrl = createSelector(
    sidebar,
    (state) => state.activeAnnotationUrl,
)

export const hoverAnnotationUrl = createSelector(
    sidebar,
    (state) => state.hoverAnnotationUrl,
)

export const showCongratsMessage = createSelector(
    sidebar,
    (state) => state.showCongratsMessage,
)

export const currentPage = createSelector(
    sidebar,
    (state) => state.currentResultPage,
)
export const resultsExhausted = createSelector(
    sidebar,
    (state) => state.resultsExhausted,
)

export const needsPagWaypoint = createSelector(
    resultsExhausted,
    isLoading,
    (isExhausted, isLoading) => !isLoading && !isExhausted,
)

export const shouldAppendLoader = createSelector(
    currentPage,
    (page) => page > 0,
)

export const searchType = createSelector(sidebar, (state) => state.searchType)

export const pageType = createSelector(sidebar, (state) => state.pageType)

export const isSocialPost = createSelector(
    sidebar,
    (state) => state.isSocialPost,
)
