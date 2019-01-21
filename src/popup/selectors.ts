import { createSelector } from 'reselect'

import { RootState } from './types'
import {
    isLoggable as checkLoggability,
    isPDF as checkPDF,
} from '../activity-logger'

const popup = (state: RootState) => state.popup

export const tabId = createSelector(popup, state => state.tabId)
export const url = createSelector(popup, state => state.url)
export const searchValue = createSelector(popup, state => state.searchValue)

export const isLoggable = createSelector(url, state =>
    checkLoggability({ url: state }),
)

export const isPDF = createSelector(url, state => checkPDF({ url: state }))
