import { createReducer } from 'redux-act'

import State from './types'
import * as actions from './actions'

const defaultState: State = {
    isPageFullScreen: false,
    isExpanded: false,
    isRibbonEnabled: true,
    isTooltipEnabled: true,
    showCommentBox: false,
    showSearchBox: false,
    showTagsPicker: false,
    showCollectionsPicker: false,
    searchValue: '',
}

const boolReducer = (stateKey: string) => (state: State, payload: boolean) => ({
    ...state,
    [stateKey]: payload,
})

const setIsPageFullScreen = boolReducer('isPageFullScreen')
const setIsExpanded = boolReducer('isExpanded')
const setRibbonEnabled = boolReducer('isRibbonEnabled')
const setTooltipEnabled = boolReducer('isTooltipEnabled')
const setShowCommentBox = boolReducer('showCommentBox')
const setShowSearchBox = boolReducer('showSearchBox')
const setShowTagsPicker = boolReducer('showTagsPicker')
const setShowCollectionsPicker = boolReducer('showCollectionsPicker')
const setSearchValue = (state: State, searchValue: string) => ({
    ...state,
    searchValue,
})

const reducer = createReducer<State>(on => {
    on(actions.setIsPageFullScreen, setIsPageFullScreen)
    on(actions.setIsExpanded, setIsExpanded)
    on(actions.setRibbonEnabled, setRibbonEnabled)
    on(actions.setTooltipEnabled, setTooltipEnabled)
    on(actions.setShowCommentBox, setShowCommentBox)
    on(actions.setShowSearchBox, setShowSearchBox)
    on(actions.setShowTagsPicker, setShowTagsPicker)
    on(actions.setShowCollsPicker, setShowCollectionsPicker)
    on(actions.setSearchValue, setSearchValue)
}, defaultState)

export default reducer
