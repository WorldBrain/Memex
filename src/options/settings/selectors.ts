import { createSelector } from 'reselect'

import { State } from './reducer'

export const settings = (state: any): State => state.settings

export const bookmarks = createSelector(settings, state => state.bookmarks)
export const memexLinks = createSelector(settings, state => state.memexLinks)
export const stubs = createSelector(settings, state => state.stubs)
export const visits = createSelector(settings, state => state.visits)
export const visitDelay = createSelector(settings, state => state.visitDelay)
