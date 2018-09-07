import { createSelector } from 'reselect'

import { RootState } from '../types'

const notifsBtn = (state: RootState) => state.notifsBtn

export const notifCount = createSelector(notifsBtn, state => state.notifCount)
