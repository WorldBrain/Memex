import { createSelector } from 'reselect'

const commentBox = state => state.commentBox

export const setCommentInput = createSelector(
    commentBox,
    state => state.setCommentInput,
)

export const setTextareaRows = createSelector(
    commentBox,
    state => state.setTextareaRows,
)

export const setHidden = createSelector(commentBox, state => state.setHidden)

export const setTagInput = createSelector(
    commentBox,
    state => state.setTagInput,
)

export const toggleHighlightTruncation = createSelector(
    commentBox,
    state => state.toggleHighlightTruncation,
)
