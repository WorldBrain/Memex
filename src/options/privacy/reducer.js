import { createReducer } from 'redux-act'

import * as actions from './actions'

const defState = {
    shouldTrack: false,
}

export default createReducer(
    {
        [actions.setTrackingFlag]: (state, shouldTrack) => ({
            ...state,
            shouldTrack,
        }),
    },
    defState,
)
