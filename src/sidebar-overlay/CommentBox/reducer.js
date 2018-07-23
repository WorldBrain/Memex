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
    },
    defaultState,
)
