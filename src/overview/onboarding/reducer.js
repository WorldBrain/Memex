import { createReducer } from 'redux-act'

import * as actions from './actions'
import * as constants from './constants'

const defState = {
    isVisible: false,
    progress: 0,
    isImportsDone: false,
}

export default createReducer(
    {
        [actions.setVisible]: (state, isVisible) => ({ ...state, isVisible }),
        [actions.setProgress]: (state, progress) => ({ ...state, progress }),
        [actions.incProgress]: (state, inc = 1) => ({
            ...state,
            progress: state.progress + inc,
        }),
        [actions.setImportsDone]: (state, isImportsDone) => ({
            ...state,
            isImportsDone,
            progress: isImportsDone
                ? constants.NUM_IMPORT_ITEMS
                : state.progress,
        }),
    },
    defState,
)
