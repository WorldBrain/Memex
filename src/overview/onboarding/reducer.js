import { createReducer } from 'redux-act'

import * as actions from './actions'

const defState = {
    isVisible: false,
    progress: 0,
    isImportsDone: false,
}

export default createReducer(
    {
        [actions.setVisible]: (state, isVisible) => ({ ...state, isVisible }),
        [actions.incProgress]: (state, inc = 1) => ({
            ...state,
            progress: state.progress + inc,
        }),
        [actions.setImportsDone]: (state, isImportsDone) => ({
            ...state,
            isImportsDone,
        }),
    },
    defState,
)
