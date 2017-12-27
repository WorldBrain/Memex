import { createReducer } from 'redux-act'
import * as actions from './actions'

const defState = {
    shouldTrack: true,
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
