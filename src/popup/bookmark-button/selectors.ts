import { createSelector } from 'reselect'

import { RootState } from '../types'
import * as popup from '../selectors'

const bookmarkBtn = (state: RootState) => state.bookmarkBtn

export const isBookmarked = createSelector(
    bookmarkBtn,
    (state) => state.isBookmarked,
)

export const isDisabled = createSelector(
    popup.isLoggable,
    (isLoggable) => !isLoggable,
)
