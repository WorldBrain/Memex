import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not the popup should show the collections picker. */
    showCollectionsPicker: boolean
    /** Holds the collections associated with the page. */
    collections: string[]
    /** Holds the initial list suggestions to display for user list search. */
    initCollSuggestions: string[]
}

export const defState: State = {
    showCollectionsPicker: false,
    collections: [],
    initCollSuggestions: [],
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.setShowCollectionsPicker, (state, payload) => ({
    ...state,
    showCollectionsPicker: payload,
}))

reducer.on(acts.setCollections, (state, payload) => ({
    ...state,
    collections: payload,
}))

reducer.on(acts.setInitColls, (state, payload) => ({
    ...state,
    initCollSuggestions: payload,
}))

export default reducer
