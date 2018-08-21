import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the blacklist URL vs domain choice should be shown. */
    showDomainChoice: boolean
    /** Denotes whether or not the current page is blacklisted. */
    isBlacklisted: boolean
    /** Denotes whether or not the popup should show the blacklist delete confirm. */
    showDeleteConfirm: boolean
    /** Denotes whether or not the blacklist delete should do domain or just this page. */
    domainDelete: boolean
}

export const defState: State = {
    showDomainChoice: false,
    isBlacklisted: false,
    showDeleteConfirm: false,
    domainDelete: false,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setShowBlacklistChoice, (state, payload) => ({
    ...state,
    showDomainChoice: payload,
}))

reducer.on(acts.setIsBlacklisted, (state, payload) => ({
    ...state,
    isBlacklisted: payload,
}))

reducer.on(acts.setShowBlacklistDelete, (state, payload) => ({
    ...state,
    showDeleteConfirm: payload,
}))

reducer.on(acts.setDomainDelete, (state, payload) => ({
    ...state,
    domainDelete: payload,
}))

export default reducer
