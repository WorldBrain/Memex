import { createReducer } from 'redux-act'

import * as actions from './actions'
import State from './types'
import { NUM_DEFAULT_ROWS } from './constants'

const defaultState: State = {
    commentInput: '',
    textareaRows: NUM_DEFAULT_ROWS,
    isHidden: false,
    tagInput: false,
    tags: [],
    displayHighlightTruncated: true,
    anchor: null,
    focusCommentBox: false,
}

const addTag = (state: State, newTag: any) => ({
    ...state,
    tags: [newTag, ...state.tags],
})

const deleteTag = (state: State, tag: any) => {
    const tagIndex = state.tags.indexOf(tag)
    if (tagIndex === -1) {
        return state
    }

    return {
        ...state,
        tags: [
            ...state.tags.slice(0, tagIndex),
            ...state.tags.slice(tagIndex + 1),
        ],
    }
}

const setCommentInput = (state: State, commentInput: string) => ({
    ...state,
    commentInput,
})

const setTextareaRows = (state: State, textareaRows: number) => ({
    ...state,
    textareaRows,
})

const setHidden = (state: State, isHidden: boolean) => ({
    ...state,
    isHidden,
})

const setTagInput = (state: State, tagInput: boolean) => ({
    ...state,
    tagInput,
})

const toggleHighlightTruncation = (state: State) => ({
    ...state,
    displayHighlightTruncated: !state.displayHighlightTruncated,
})

const emptyTags = (state: State) => ({
    ...state,
    tags: [],
})

const setAnchor = (state: State, anchor: any) => ({
    ...state,
    anchor,
})

const setFocusCommentBox = (state: State, focusCommentBox: boolean) => ({
    ...state,
    focusCommentBox,
})

const setHighlightTruncation = (
    state: State,
    displayHighlightTruncated: boolean,
) => ({
    ...state,
    displayHighlightTruncated,
})

export default createReducer<State>(on => {
    on(actions.addTag, addTag)
    on(actions.deleteTag, deleteTag)
    on(actions.setCommentInput, setCommentInput)
    on(actions.setTextareaRows, setTextareaRows)
    on(actions.setHidden, setHidden)
    on(actions.setTagInput, setTagInput)
    on(actions.toggleHighlightTruncation, toggleHighlightTruncation)
    on(actions.emptyTags, emptyTags)
    on(actions.setAnchor, setAnchor)
    on(actions.setFocusCommentBox, setFocusCommentBox)
    on(actions.setHighlightTruncation, setHighlightTruncation)
}, defaultState)
