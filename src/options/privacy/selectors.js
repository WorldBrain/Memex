import { createSelector } from 'reselect'

const privacy = state => state.privacy

export const shouldTrack = createSelector(privacy, state => state.shouldTrack)
