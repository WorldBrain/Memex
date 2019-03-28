import { createAction } from 'redux-act'

import { Anchor } from 'src/direct-linking/content_script/interactions'
import { Thunk } from '../types'
import { createAnnotation } from '../sidebar/actions'
import * as selectors from './selectors'

export const setShowCommentBox = createAction<boolean>('setShowCommentBox')

export const setAnchor = createAction<Anchor>('setAnchor')

export const setCommentText = createAction<string>('setCommentText')

export const setTags = createAction<string[]>('setTags')

export const setInitTagSuggestions = createAction<string[]>(
    'setInitTagSuggestions',
)

export const addTag = createAction<string>('addTag')

export const deleteTag = createAction<string>('deleteTag')

export const setIsCommentBookmarked = createAction<boolean>(
    'bookmark/setIsCommentBookmarked',
)

export const setIsCommentSaved = createAction<boolean>(
    'bookmark/setIsCommentSaved',
)

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
    dispatch(setIsCommentBookmarked(false))
    setTimeout(() => {
        dispatch(setIsCommentSaved(false))
    }, 3000)
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
    bookmarked: boolean,
) => Thunk = (anchor, commentText, tags, bookmarked) => dispatch => {
    if (commentText.length !== 0 || anchor !== null) {
        const body = anchor !== null ? anchor.quote : ''

        dispatch(createAnnotation(anchor, body, commentText, tags, bookmarked))
        dispatch(setIsCommentSaved(true))
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

export const toggleBookmark: () => Thunk = () => (dispatch, getState) => {
    const isBookmarked = selectors.isBookmarked(getState())
    dispatch(setIsCommentBookmarked(!isBookmarked))
}
