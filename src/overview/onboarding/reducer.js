import { createReducer } from 'redux-act'

import * as actions from './actions'

const defState = {
    isVisible: false,
}

export default createReducer(
    {
        [actions.setVisible]: (state, isVisible) => ({ ...state, isVisible }),
    },
    defState,
)
