import { createAction } from 'redux-act'

import { Anchor } from 'src/direct-linking/content_script/interactions'
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

export const openCommentBoxWithHighlight: (
    anchor: Anchor,
) => Thunk = anchor => dispatch => {
    dispatch(setAnchor(anchor))
    dispatch(setShowCommentBox(true))
}

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
export const saveComment: (
    anchor: Anchor,
    commentText: string,
    tags: string[],
) => Thunk = (anchor, commentText, tags) => dispatch => {
    if (commentText.length !== 0 || anchor !== null) {
        const body = anchor !== null ? anchor.quote : ''

        dispatch(createAnnotation(anchor, body, commentText, tags))
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
