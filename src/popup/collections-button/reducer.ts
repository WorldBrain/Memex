import { createReducer } from 'redux-act'

import * as acts from './actions'
import { PageList } from '../../custom-lists/background/types'

export interface State {
    /** Denotes whether or not the popup should show the collections picker. */
    showCollectionsPicker: boolean
    /** Holds the collections associated with the page. */
    collections: string[]
    /** Holds the initial list suggestions to display for user list search. */
    initCollSuggestions: string[]
    /** Denotes whether or not the popup should show the tags picker for multiedit. */
    allTabs: boolean
}

export const defState: State = {
    showCollectionsPicker: false,
    collections: [],
    initCollSuggestions: [],
    allTabs: false,
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

reducer.on(acts.setAllTabs, (state, payload) => ({
    ...state,
    allTabs: payload,
}))

reducer.on(acts.setInitColls, (state, payload) => ({
    ...state,
    initCollSuggestions: payload,
}))

reducer.on(acts.addCollection, (state, payload) => {
    // Create a new suggested collection if it doesn't already exist, otherwise
    // just move it the front.
    const index = state.initCollSuggestions.indexOf(payload)
    const initCollSuggestions =
        index === -1
            ? [payload, ...state.initCollSuggestions]
            : [
                  payload,
                  ...state.initCollSuggestions.slice(0, index),
                  ...state.initCollSuggestions.slice(index + 1),
              ]
    return {
        ...state,
        collections: [payload, ...state.collections],
        initCollSuggestions,
    }
})

reducer.on(acts.deleteCollection, (state, payload) => {
    const collectionIndex = state.collections.indexOf(payload)
    const suggestionIndex = state.initCollSuggestions.indexOf(payload)

    // Remote the collection from the list of collections.
    const collections = [
        ...state.collections.slice(0, collectionIndex),
        ...state.collections.slice(collectionIndex + 1),
    ]

    // Move the suggested collection to the back of the list of suggested collections.
    const initCollSuggestions = [
        ...state.initCollSuggestions.slice(0, suggestionIndex),
        ...state.initCollSuggestions.slice(suggestionIndex + 1),
        state.initCollSuggestions[suggestionIndex],
    ]

    return {
        ...state,
        collections,
        initCollSuggestions,
    }
})

export default reducer
