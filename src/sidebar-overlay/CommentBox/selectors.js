import { createSelector } from 'reselect'

const commentBox = state => state.commentBox

export const commentInput = createSelector(
    commentBox,
    state => state.commentInput,
)

export const textareaRows = createSelector(
    commentBox,
    state => state.textareaRows,
)

export const isHidden = createSelector(commentBox, state => state.isHidden)

export const tagInput = createSelector(commentBox, state => state.tagInput)

export const anchor = createSelector(commentBox, state => state.anchor)

export const displayHighlightTruncated = createSelector(
    commentBox,
    state => state.displayHighlightTruncated,
)

export const tags = createSelector(commentBox, state => state.tags)

export const focusCommentBox = createSelector(
    commentBox,
    state => state.focusCommentBox,
)
