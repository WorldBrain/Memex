import { createSelector } from 'reselect'

export const entireState = state => state.preferences

export const freezeDryBookmarks = createSelector(entireState, state => state.freezeDryBookmarks)
