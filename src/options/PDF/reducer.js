import { createReducer } from 'redux-act'

import * as actions from './actions'

const defState = {
    shouldOpen: false,
}

export default createReducer(
    {
        [actions.setOpeningFlag]: (state, shouldOpen) => ({
            ...state,
            shouldOpen,
        }),
    },
    defState,
)
