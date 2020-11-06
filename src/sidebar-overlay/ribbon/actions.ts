import { createAction } from 'redux-act'

import { Thunk } from '../types'
import {
    getTooltipState,
    getHighlightsState,
} from 'src/in-page-ui/tooltip/utils'

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

/**
 * Hydrates the initial state of the ribbon.
 */
export const initState: () => Thunk = () => async (dispatch) => {
    dispatch(setHighlightsEnabled(await getHighlightsState()))
    dispatch(setTooltipEnabled(await getTooltipState()))
}
