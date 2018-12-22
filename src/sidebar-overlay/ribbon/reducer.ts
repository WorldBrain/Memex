import { createReducer } from 'redux-act'

import State from './types'
import * as actions from './actions'

const defaultState: State = {
    isExpanded: false,
    isRibbonEnabled: true,
    isTooltipEnabled: true,
}

const expandRibbon = (state: State) => ({
    ...state,
    isExpanded: true,
})

const shrinkRibbon = (state: State) => ({
    ...state,
    isExpanded: false,
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
    on(actions.expandRibbon, expandRibbon)
    on(actions.shrinkRibbon, shrinkRibbon)
    on(actions.setRibbonEnabled, setRibbonEnabled)
    on(actions.setTooltipEnabled, setTooltipEnabled)
}, defaultState)

export default reducer
