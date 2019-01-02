import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    // Status of onboarding stages
    annotationStage: string
    powerSearchStage: string

    // Decides whether or not to show the Right Onboarding box
    showOnboardingBox: boolean
}

const defState = {
    annotationStage: '',
    powerSearchStage: '',
    showOnboardingBox: false,
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

reducer.on(actions.setShowOnboardingBox, (state, payload) => ({
    ...state,
    showOnboardingBox: payload,
}))

export default reducer
