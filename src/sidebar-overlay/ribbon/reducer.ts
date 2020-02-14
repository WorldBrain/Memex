import { createReducer } from 'redux-act'

import State from './types'
import * as actions from './actions'

const defaultState: State = {
    isPageFullScreen: false,
    isExpanded: false,
    isRibbonEnabled: true,
    areHighlightsEnabled: true,
    isTooltipEnabled: true,
    showCommentBox: false,
    showSearchBox: false,
    showTagsPicker: false,
    showCollectionsPicker: false,
    searchValue: '',
}

const boolReducer = (stateKey: string, reset = false) => (
    state: State,
    payload: boolean,
) => {
    const resettableStates: Partial<State> = reset
        ? {
              showCommentBox: defaultState.showCommentBox,
              showTagsPicker: defaultState.showTagsPicker,
              showSearchBox: defaultState.showSearchBox,
              showCollectionsPicker: defaultState.showCollectionsPicker,
          }
        : {}

    return {
        ...state,
        ...resettableStates,
        [stateKey]: payload,
    }
}

const setIsPageFullScreen = boolReducer('isPageFullScreen')
const setIsExpanded = boolReducer('isExpanded')
const setRibbonEnabled = boolReducer('isRibbonEnabled')
const setHighlightsEnabled = boolReducer('areHighlightsEnabled')
const setTooltipEnabled = boolReducer('isTooltipEnabled')
const setShowCommentBox = boolReducer('showCommentBox', true)
const setShowSearchBox = boolReducer('showSearchBox', true)
const setShowTagsPicker = boolReducer('showTagsPicker', true)
const setShowCollectionsPicker = boolReducer('showCollectionsPicker', true)
const setSearchValue = (state: State, searchValue: string) => ({
    ...state,
    searchValue,
})

const reducer = createReducer<State>(on => {
    on(actions.setIsPageFullScreen, setIsPageFullScreen)
    on(actions.setIsExpanded, setIsExpanded)
    on(actions.setRibbonEnabled, setRibbonEnabled)
    on(actions.setTooltipEnabled, setTooltipEnabled)
    on(actions.setHighlightsEnabled, setHighlightsEnabled)
    on(actions.setShowCommentBox, setShowCommentBox)
    on(actions.setShowSearchBox, setShowSearchBox)
    on(actions.setShowTagsPicker, setShowTagsPicker)
    on(actions.setShowCollsPicker, setShowCollectionsPicker)
    on(actions.setSearchValue, setSearchValue)
}, defaultState)

export default reducer
