import { createSelector } from 'reselect'

import { RootState } from '../types'

const collectionsBtn = (state: RootState) => state.collectionsBtn

export const showCollectionsPicker = createSelector(
    collectionsBtn,
    (state) => state.showCollectionsPicker,
)

export const collections = createSelector(
    collectionsBtn,
    (state) => state.collections,
)

export const initCollSuggestions = createSelector(
    collectionsBtn,
    (state) => state.initCollSuggestions,
)
export const allTabs = createSelector(collectionsBtn, (state) => state.allTabs)

export const _collectionsLegacy = createSelector(collections, (state) =>
    state.map((name) => ({ id: -1, name })),
)
export const _initCollSuggestionsLegacy = createSelector(
    initCollSuggestions,
    (state) => state.map((name) => ({ id: -1, name })),
)
