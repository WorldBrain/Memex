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

reducer.on(acts.addTag, (state, payload) => {
    // Create a new suggested tag if it doesn't already exist, otherwise just
    // move it the front.
    const index = state.initTagSuggestions.indexOf(payload)
    const initTagSuggestions =
        index === -1
            ? [payload, ...state.initTagSuggestions]
            : [
                  payload,
                  ...state.initTagSuggestions.slice(0, index),
                  ...state.initTagSuggestions.slice(index + 1),
              ]
    return {
        ...state,
        tags: [payload, ...state.tags],
        initTagSuggestions,
    }
})

reducer.on(acts.deleteTag, (state, payload) => {
    const tagIndex = state.tags.indexOf(payload)
    const suggestionIndex = state.initTagSuggestions.indexOf(payload)

    // Remove the tag from the list of tags.
    const tags = [
        ...state.tags.slice(0, tagIndex),
        ...state.tags.slice(tagIndex + 1),
    ]

    // Move the suggested tag to the back of the list of suggested tags.
    const initTagSuggestions = [
        ...state.initTagSuggestions.slice(0, suggestionIndex),
        ...state.initTagSuggestions.slice(suggestionIndex + 1),
        state.initTagSuggestions[suggestionIndex],
    ]

    return {
        ...state,
        tags,
        initTagSuggestions,
    }
})

export default reducer
