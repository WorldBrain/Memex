import { createReducer } from 'redux-act'

import * as actions from './actions'
import State from './types'
import { Anchor } from '../../direct-linking/content_script/interactions'

export const defaultState: State = {
    showCommentBox: false,
    anchor: null,
    commentText: '',
    tags: [],
    initTagSuggestions: [],
}

const setShowCommentBox = (state: State, showCommentBox: boolean) => ({
    ...state,
    showCommentBox,
})

const setAnchor = (state: State, anchor: Anchor) => ({
    ...state,
    anchor,
})

const setCommentText = (state: State, commentText: string) => ({
    ...state,
    commentText,
})

const setTags = (state: State, tags: string[]) => ({
    ...state,
    tags,
})

const setInitTagSuggestions = (state: State, initTagSuggestions: string[]) => ({
    ...state,
    initTagSuggestions,
})

const addTag = (state: State, newTag: string) => {
    // Create a new suggested tag if it doesn't already exist, otherwise just
    // move it the front.
    const index = state.initTagSuggestions.indexOf(newTag)
    const initTagSuggestions =
        index === -1
            ? [newTag, ...state.initTagSuggestions]
            : [
                  newTag,
                  ...state.initTagSuggestions.slice(0, index),
                  ...state.initTagSuggestions.slice(index + 1),
              ]

    return {
        ...state,
        tags: [newTag, ...state.tags],
        initTagSuggestions,
    }
}

const deleteTag = (state: State, tag: string) => {
    const tagIndex = state.tags.indexOf(tag)
    const suggestionIndex = state.initTagSuggestions.indexOf(tag)

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
}

export default createReducer<State>(on => {
    on(actions.setShowCommentBox, setShowCommentBox)
    on(actions.setAnchor, setAnchor)
    on(actions.setCommentText, setCommentText)
    on(actions.setTags, setTags)
    on(actions.setInitTagSuggestions, setInitTagSuggestions)
    on(actions.addTag, addTag)
    on(actions.deleteTag, deleteTag)
}, defaultState)
