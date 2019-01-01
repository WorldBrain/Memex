import { createSelector } from 'reselect'

import * as RootSelectors from '../ribbon-sidebar-controller/selectors'

export const sidebar = RootSelectors.sidebar

export const isOpen = createSelector(sidebar, state => state.isOpen)

export const isLoading = createSelector(sidebar, state => state.isLoading)

export const page = createSelector(sidebar, state => state.page)

export const annotations = createSelector(sidebar, state => state.annotations)

export const commentBox = createSelector(sidebar, state => state.commentBox)
