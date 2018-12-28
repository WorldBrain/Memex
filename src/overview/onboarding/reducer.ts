import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    // Status of onboarding stages
    annotationStage: string
    powerSearchStage: string
}

const defState = {
    annotationStage: '',
    powerSearchStage: '',
}

const reducer = createReducer<State>({}, defState)

reducer.on(actions.setAnnotationStage, (state, payload) => ({
    ...state,
    annotationStage: payload,
}))

reducer.on(actions.setPowerSearchStage, (state, payload) => ({
    ...state,
    powerSearchStage: payload,
}))

export default reducer
