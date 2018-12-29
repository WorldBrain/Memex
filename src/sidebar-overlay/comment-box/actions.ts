import { createAction } from 'redux-act'

import { Anchor } from '../../direct-linking/content_script/interactions'
import { Thunk } from '../types'

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
 * Cancels the current comment,
 * and resets the state of the comment box in the Redux store.
 */
export const cancelComment: () => Thunk = () => dispatch => {
    dispatch(setShowCommentBox(false))
    dispatch(setAnchor(undefined))
    dispatch(setCommentText(''))
    dispatch(setTags([]))
    dispatch(setInitTagSuggestions([]))
}
