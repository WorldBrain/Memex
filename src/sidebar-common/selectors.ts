import { createSelector } from 'reselect'

// NOTE: Any parent reducer will need to define state for the sidebar in a
// property called `sidebar`.
export const sidebar = state => state.sidebar

export const isOpen = createSelector(sidebar, state => state.isOpen)

export const isLoading = createSelector(sidebar, state => state.isLoading)

export const page = createSelector(sidebar, state => state.page)

export const annotations = createSelector(sidebar, state => state.annotations)

export const commentBox = createSelector(sidebar, state => state.commentBox)
