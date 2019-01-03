import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    // Status of onboarding stages
    annotationStage: string
    powerSearchStage: string
    taggingStage: string

    // Decides whether or not to show the Right Onboarding box
    showOnboardingBox: boolean

    // Decides whether or not to show the Congrats message
    // Set to true after all stages are done
    congratsMessage: boolean
}

const defState = {
    annotationStage: '',
    powerSearchStage: '',
    taggingStage: '',
    showOnboardingBox: false,
    congratsMessage: false,
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

reducer.on(actions.setTaggingStage, (state, payload) => ({
    ...state,
    taggingStage: payload,
}))

reducer.on(actions.setShowOnboardingBox, (state, payload) => ({
    ...state,
    showOnboardingBox: payload,
}))

reducer.on(actions.setCongratsMessage, (state, payload) => ({
    ...state,
    congratsMessage: payload,
}))

export default reducer
