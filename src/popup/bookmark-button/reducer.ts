import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the current page is bookmarked. */
    isBookmarked: boolean
}

export const defState: State = {
    isBookmarked: false,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setIsBookmarked, (state, payload) => ({
    ...state,
    isBookmarked: payload,
}))

export default reducer
