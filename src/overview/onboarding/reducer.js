import { createReducer } from 'redux-act'

import * as actions from './actions'

const defState = {
    // Stages for the user driven onboarding stages
    onboardingStages: {
        annotationStage: null,
        powerSearchStage: null,
    },
}

export default createReducer(
    {
        [actions.setOnboardingStages]: (state, onboardingStages) => ({
            ...state,
            onboardingStages,
        }),
    },
    defState,
)
