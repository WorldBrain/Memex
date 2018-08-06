import { createReducer } from 'redux-act'
import * as actions from './actions'
import { DEFAULT_ROWS } from '../constants'

const defaultState = {
    commentInput: '',
    textareaRows: DEFAULT_ROWS,
    isHidden: false,
    tagInput: false,
    tags: [],
    displayHighlightTruncated: true,
    anchor: null,
    focusCommentBox: false,
}

const addTag = (state, newTag) => ({
    ...state,
    tags: [newTag, ...state.tags],
})

const deleteTag = (state, tag) => {
    const oldTags = [...state.tags]
    const tagIndex = oldTags.indexOf(tag)

    if (tagIndex === -1) return state

    return {
        ...state,
        tags: [...oldTags.slice(0, tagIndex), ...oldTags.slice(tagIndex + 1)],
    }
}

export default createReducer(
    {
        [actions.setCommentInput]: (state, commentInput) => ({
            ...state,
            commentInput,
        }),
        [actions.setTextareaRows]: (state, textareaRows) => ({
            ...state,
            textareaRows,
        }),
        [actions.setHidden]: (state, isHidden) => ({
            ...state,
            isHidden,
        }),
        [actions.setTagInput]: (state, tagInput) => ({
            ...state,
            tagInput,
        }),
        [actions.toggleHighlightTruncation]: state => ({
            ...state,
            displayHighlightTruncated: !state.displayHighlightTruncated,
        }),
        [actions.emptyTags]: state => ({
            ...state,
            tags: [],
        }),
        [actions.setAnchor]: (state, anchor) => ({
            ...state,
            anchor,
        }),
        [actions.setFocusCommentBox]: (state, value) => ({
            ...state,
            focusCommentBox: value,
        }),
        [actions.setHighlightTruncation]: (state, value) => ({
            ...state,
            displayHighlightTruncated: value,
        }),
        [actions.addTag]: addTag,
        [actions.deleteTag]: deleteTag,
    },
    defaultState,
)
