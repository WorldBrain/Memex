import { createAction } from 'redux-act'

import * as selectors from './selectors'
import { Anchor } from '../../direct-linking/content_script/interactions'
import { Thunk } from '../types'
import { createAnnotation } from '../sidebar/actions'

export const setShowCommentBox = createAction<boolean>('setShowCommentBox')

export const setAnchor = createAction<Anchor>('setAnchor')

export const setCommentText = createAction<string>('setCommentText')

export const setTags = createAction<string[]>('setTags')

export const setInitTagSuggestions = createAction<string[]>(
    'setInitTagSuggestions',
)

export const addTag = createAction<string>('addTag')

export const deleteTag = createAction<string>('deleteTag')

/**
 * Resets the state of the comment box in the Redux store.
 */
export const resetCommentBox: () => Thunk = () => dispatch => {
    dispatch(setShowCommentBox(false))
    dispatch(setAnchor(null))
    dispatch(setCommentText(''))
    dispatch(setTags([]))
    dispatch(setInitTagSuggestions([]))
}

/**
 * Whenever dispatched, takes in the current state of the comment from the
 * Redux store, does some input cleaning/validation, and saves the comment
 * to the storage. Also, resets the comment box afterwards.
 */
export const saveComment: () => Thunk = () => (dispatch, getState) => {
    const state = getState()
    const anchor = selectors.anchor(state)
    const commentText = selectors.commentText(state)
    const tags = selectors.tags(state)

    const strippedComment = commentText.trim()
    if (strippedComment.length !== 0 || anchor !== null) {
        const body = anchor !== null ? anchor.quote : ''

        dispatch(createAnnotation(anchor, body, strippedComment, tags))
        dispatch(resetCommentBox())
    }
}

/**
 * Cancels the current comment,
 * and resets the state of the comment box in the Redux store.
 */
export const cancelComment: () => Thunk = () => dispatch => {
    dispatch(resetCommentBox())
}
