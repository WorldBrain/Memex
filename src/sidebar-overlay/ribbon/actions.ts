import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'
import { setSidebarState } from '../utils'
import {
    getTooltipState,
    setTooltipState,
    getHighlightsState,
    setHighlightsState,
} from 'src/content-tooltip/utils'
import analytics from 'src/analytics'

export const setIsPageFullScreen = createAction<boolean>('setIsPageFullScreen')

export const setIsExpanded = createAction<boolean>('setIsExpanded')

export const setRibbonEnabled = createAction<boolean>('setRibbonEnabled')

export const setTooltipEnabled = createAction<boolean>('setTooltipEnabled')
export const setHighlightsEnabled = createAction<boolean>(
    'setHighlightsEnabled',
)

export const setShowCommentBox = createAction<boolean>('setShowCommentBox')
export const setShowSearchBox = createAction<boolean>('setShowSearchBox')
export const setShowTagsPicker = createAction<boolean>('setShowTagsPicker')
export const setShowCollsPicker = createAction<boolean>('setShowCollsPicker')
export const setSearchValue = createAction<string>('setSearchValue')

export const toggleFullScreen: () => Thunk = () => (dispatch, getState) => {
    const isPageFullScreen = selectors.isPageFullScreen(getState())
    dispatch(setIsPageFullScreen(!isPageFullScreen))
}

/**
 * Hydrates the initial state of the ribbon.
 */
export const initState: () => Thunk = () => async dispatch => {
    dispatch(setHighlightsEnabled(await getHighlightsState()))
    dispatch(setTooltipEnabled(await getTooltipState()))
}

export const toggleRibbon: () => Thunk = () => async (dispatch, getState) => {
    const isRibbonEnabled = selectors.isRibbonEnabled(getState())

    if (isRibbonEnabled) {
        analytics.trackEvent({
            category: 'Sidebar',
            action: 'disablePermanently',
        })
    }

    dispatch(setRibbonEnabled(!isRibbonEnabled))

    // TODO: Delete the following `setSidebarState` call and let the content
    // script manage it, along with the need to setting the `manualOverride`
    // flag to true.
    await setSidebarState(!isRibbonEnabled)
}

export const toggleTooltip: () => Thunk = () => async (dispatch, getState) => {
    const isTooltipEnabled = selectors.isTooltipEnabled(getState())

    if (isTooltipEnabled) {
        analytics.trackEvent({
            category: 'InPageTooltip',
            action: 'disableTooltipViaRibbon',
        })
    }

    dispatch(setTooltipEnabled(!isTooltipEnabled))
    await setTooltipState(!isTooltipEnabled)
}

export const toggleHighlights: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const areHighlightsEnabled = selectors.areHighlightsEnabled(getState())

    dispatch(setHighlightsEnabled(!areHighlightsEnabled))
    await setHighlightsState(!areHighlightsEnabled)
}
