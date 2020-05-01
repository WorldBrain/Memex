import { createSelector } from 'reselect'

import * as RootSelectors from '../selectors'
import { toggleShowTagsPicker } from 'src/overview/results/actions'

export const ribbon = RootSelectors.ribbon

export const isPageFullScreen = createSelector(
    ribbon,
    (state) => state.isPageFullScreen,
)

export const isExpanded = createSelector(ribbon, (state) => state.isExpanded)

export const isRibbonEnabled = createSelector(
    ribbon,
    (state) => state.isRibbonEnabled,
)

export const areHighlightsEnabled = createSelector(
    ribbon,
    (state) => state.areHighlightsEnabled,
)

export const isTooltipEnabled = createSelector(
    ribbon,
    (state) => state.isTooltipEnabled,
)

export const showCommentBox = createSelector(
    ribbon,
    (state) => state.showCommentBox,
)
export const showSearchBox = createSelector(
    ribbon,
    (state) => state.showSearchBox,
)
export const showTagsPicker = createSelector(
    ribbon,
    (state) => state.showTagsPicker,
)
export const showCollectionsPicker = createSelector(
    ribbon,
    (state) => state.showCollectionsPicker,
)
export const searchValue = createSelector(ribbon, (state) => state.searchValue)

export const isFilterOpen = createSelector(
    showCommentBox,
    showSearchBox,
    showTagsPicker,
    showCollectionsPicker,
    (a, b, c, d) => a || b || c || d,
)
