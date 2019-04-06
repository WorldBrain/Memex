import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    openSidebar: false,
    sidebarLocked: false,
    /** this state is used to remove scrolling from the overview results when
    moused over them.
    */
    mouseOverSidebar: false,
}

const openSidebar = state => ({
    ...state,
    openSidebar: true,
})

const closeSidebar = state => ({
    ...state,
    openSidebar: false,
})

const setSidebarState = (state, isOpen) => ({
    ...state,
    openSidebar: isOpen,
})

const setSidebarLocked = (state, payload) => ({
    ...state,
    sidebarLocked: payload,
})

const setMouseOver = state => ({
    ...state,
    mouseOverSidebar: true,
})

const resetMouseOver = state => ({
    ...state,
    mouseOverSidebar: false,
})

export default createReducer(
    {
        [actions.openSidebar]: openSidebar,
        [actions.closeSidebar]: closeSidebar,
        [actions.setSidebarState]: setSidebarState,
        [actions.setMouseOver]: setMouseOver,
        [actions.resetMouseOver]: resetMouseOver,
        [actions.setSidebarLocked]: setSidebarLocked,
    },
    defaultState,
)
