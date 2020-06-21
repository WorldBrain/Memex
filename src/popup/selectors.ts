import { createSelector } from 'reselect'

import { RootState } from './types'
import { isLoggable as checkLoggability } from '../activity-logger'
import { isUrlToPdf } from 'src/pdf-viewer/util'

const popup = (state: RootState) => state.popup

export const tabId = createSelector(popup, (state) => state.tabId)
export const url = createSelector(popup, (state) => state.url)
export const searchValue = createSelector(popup, (state) => state.searchValue)
export const pdfFingerprint = createSelector(
    popup,
    (state) => state.pdfFingerprint,
)

export const isLoggable = createSelector(url, (state) =>
    checkLoggability({ url: state }),
)

export const renderAnnotPdfBtn = createSelector(url, (state) =>
    isUrlToPdf(state),
)
