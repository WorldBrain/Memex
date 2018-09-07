import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Contains the count of unread notifs to display on the popup button. */
    notifCount: number
}

export const defState: State = {
    notifCount: 0,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setNotifCount, (state, payload) => ({
    ...state,
    notifCount: payload,
}))

export default reducer
