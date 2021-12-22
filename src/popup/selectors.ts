import { createSelector } from 'reselect'

import { RootState } from './types'
import { isLoggable as checkLoggability } from '../activity-logger'

const popup = (state: RootState) => state.popup

export const tabId = createSelector(popup, (state) => state.tabId)
export const url = createSelector(popup, (state) => state.url)
export const searchValue = createSelector(popup, (state) => state.searchValue)
export const initLogicRun = createSelector(popup, (state) => state.initLogicRun)

export const isLoggable = createSelector(url, (state) => {
    return checkLoggability({ url: state })
})
