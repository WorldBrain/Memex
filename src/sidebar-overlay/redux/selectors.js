import { createSelector } from 'reselect'

export const sidebar = state => state.sidebar

export const annotations = createSelector(sidebar, state => state.annotations)

export const anchor = createSelector(sidebar, state => state.anchor)

export const page = createSelector(sidebar, state => state.page)

export const activeAnnotation = createSelector(
    sidebar,
    state => state.activeAnnotation,
)

export const hoveredAnnotation = createSelector(
    sidebar,
    state => state.hoveredAnnotation,
)

export const annotationCount = createSelector(
    sidebar,
    state => state.annotationCount,
)
