import { createSelector } from 'reselect'

const pdfs = (state) => state.pdfs

export const shouldOpen = createSelector(pdfs, (state) => state.shouldOpen)
