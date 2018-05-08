import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    showSidebar: false,
}

const setShowSidebar = (state, showSidebar) => ({
    ...state,
    showSidebar: showSidebar,
})

export default createReducer(
    {
        [actions.setShowSidebar]: setShowSidebar,
    },
    defaultState,
)
