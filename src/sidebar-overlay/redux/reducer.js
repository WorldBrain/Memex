import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    annotations: [],
}

const setAnnotations = (state, annotations) => ({
    ...state,
    annotations: annotations,
})

export default createReducer(
    {
        [actions.setAnnotations]: setAnnotations,
    },
    defaultState,
)
