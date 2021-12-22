import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Holds the tab ID which the popup is currently shown in. */
    tabId: number
    /** Holds the URL of the page which the popup is currently shown in. */
    url: string
    /** Holds the current state of the search input. */
    searchValue: string
    initLogicRun: boolean
}

export const defState: State = {
    initLogicRun: false,
    tabId: null,
    url: '',
    searchValue: '',
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setTabId, (state, payload) => ({
    ...state,
    tabId: payload,
}))

reducer.on(acts.setUrl, (state, payload) => ({
    ...state,
    url: payload,
}))

reducer.on(acts.setSearchVal, (state, payload) => ({
    ...state,
    searchValue: payload,
}))

reducer.on(acts.setInitState, (state, payload) => ({
    ...state,
    initLogicRun: payload,
}))

export default reducer
