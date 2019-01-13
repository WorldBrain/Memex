import { createSelector } from 'reselect'

import State from './types'
// NOTE: Any parent reducer will need to define state for the sidebar in a
// property called `sidebar`.
export const sidebar: (state) => State = state => state.sidebar

export const annotationsManager = createSelector(
    sidebar,
    state => state.annotationsManager,
)

export const isOpen = createSelector(sidebar, state => state.isOpen)

export const isLoading = createSelector(sidebar, state => state.isLoading)

export const page = createSelector(sidebar, state => state.page)

export const pageUrl = createSelector(page, state => state.url)

export const pageTitle = createSelector(page, state => state.title)

export const annotations = createSelector(sidebar, state => state.annotations)

export const commentBox = createSelector(sidebar, state => state.commentBox)

export const showCongratsMessage = createSelector(
    sidebar,
    state => state.showCongratsMessage,
)
