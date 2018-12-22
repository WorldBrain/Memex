import { createReducer } from 'redux-act'

import State from './types'

const defaultState: State = {
    isMouseHoveringOver: false,
    isRibbonEnabled: true,
    isTooltipEnabled: true,
}

const reducer = createReducer<State>({}, defaultState)

export default reducer
