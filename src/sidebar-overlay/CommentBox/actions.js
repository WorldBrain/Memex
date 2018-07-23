import { createAction } from 'redux-act'

export const setCommentInput = createAction('setCommentInput')

export const setTextareaRows = createAction('setTextareaRows')

export const setHidden = createAction('setHidden')

export const setTagInput = createAction('setTagInput')

export const toggleHighlightTruncation = createAction(
    'toggleHighlightTruncation',
)
