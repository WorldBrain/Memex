import { createSelector } from 'reselect'

import * as sidebarSelectors from '../selectors'

const commentBox = sidebarSelectors.commentBox

export const showCommentBox = createSelector(
    commentBox,
    state => state.showCommentBox,
)

export const anchor = createSelector(commentBox, state => state.anchor)

export const commentText = createSelector(
    commentBox,
    state => state.commentText,
)

export const tags = createSelector(commentBox, state => state.tags)

export const initTagSuggestions = createSelector(
    commentBox,
    state => state.initTagSuggestions,
)
