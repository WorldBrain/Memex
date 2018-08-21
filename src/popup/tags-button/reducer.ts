import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the popup should show the tags picker. */
    showTagsPicker: boolean
    /** Holds the tags associated with the page. */
    tags: string[]
    /** Holds the initial tag suggestions to display for user tag search. */
    initTagSuggestions: string[]
}

export const defState: State = {
    showTagsPicker: false,
    tags: [],
    initTagSuggestions: [],
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setShowTagsPicker, (state, payload) => ({
    ...state,
    showTagsPicker: payload,
}))

reducer.on(acts.setTags, (state, payload) => ({
    ...state,
    tags: payload,
}))

reducer.on(acts.setInitTagSuggests, (state, payload) => ({
    ...state,
    initTagSuggestions: payload,
}))

export default reducer
