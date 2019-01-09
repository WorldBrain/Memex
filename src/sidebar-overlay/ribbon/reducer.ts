import { createReducer } from 'redux-act'

import State from './types'
import * as actions from './actions'

const defaultState: State = {
    isPageFullScreen: false,
    isExpanded: false,
    isRibbonEnabled: true,
    isTooltipEnabled: true,
}

const setIsPageFullScreen = (state: State, isPageFullScreen: boolean) => ({
    ...state,
    isPageFullScreen,
})

const setIsExpanded = (state: State, isExpanded: boolean) => ({
    ...state,
    isExpanded,
})

const setRibbonEnabled = (state: State, isRibbonEnabled: boolean) => ({
    ...state,
    isRibbonEnabled,
})

const setTooltipEnabled = (state: State, isTooltipEnabled: boolean) => ({
    ...state,
    isTooltipEnabled,
})

const reducer = createReducer<State>(on => {
    on(actions.setIsPageFullScreen, setIsPageFullScreen)
    on(actions.setIsExpanded, setIsExpanded)
    on(actions.setRibbonEnabled, setRibbonEnabled)
    on(actions.setTooltipEnabled, setTooltipEnabled)
}, defaultState)

export default reducer
