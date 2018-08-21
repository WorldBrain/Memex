import { createSelector } from 'reselect'

import { RootState } from '../types'

const collectionsBtn = (state: RootState) => state.collectionsBtn

export const showCollectionsPicker = createSelector(
    collectionsBtn,
    state => state.showCollectionsPicker,
)

export const collections = createSelector(
    collectionsBtn,
    state => state.collections,
)
export const initCollSuggestions = createSelector(
    collectionsBtn,
    state => state.initCollSuggestions,
)
