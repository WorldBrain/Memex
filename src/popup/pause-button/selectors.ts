import { createSelector } from 'reselect'

import { RootState } from '../types'

const pauseBtn = (state: RootState) => state.pauseBtn

export const isPaused = createSelector(pauseBtn, state => state.isPaused)

export const pauseTime = createSelector(pauseBtn, state => state.time)
