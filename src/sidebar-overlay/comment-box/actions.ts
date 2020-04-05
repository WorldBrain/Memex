import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'
import { Anchor } from 'src/highlighting/types'
import { createAnnotation } from 'src/annotations/actions'
import { setPageType, setSearchType } from 'src/sidebar-overlay/sidebar/actions'
import { setIsExpanded } from '../ribbon/actions'

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
    dispatch(setSearchType('notes'))
    dispatch(setPageType('page'))
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
    isSocialPost?: boolean,
) => Thunk = (anchor, comment, tags, bookmarked, isSocialPost) => dispatch => {
    if (comment.length > 0 || anchor !== null) {
        const body = anchor !== null ? anchor.quote : ''

        dispatch(
            createAnnotation(
                anchor,
                body,
                comment,
                tags,
                bookmarked,
                isSocialPost,
                { skipRender: true },
            ),
        )
        dispatch(setIsCommentSaved(true))
        dispatch(setShowCommentBox(false))
        dispatch(resetCommentBox())

        setTimeout(() => dispatch(setIsExpanded(false)), 1000)
    }
}

/**
 * Cancels the current comment,
 * and resets the state of the comment box in the Redux store.
 */
export const cancelComment: () => Thunk = () => dispatch => {
    dispatch(setShowCommentBox(false))
    dispatch(resetCommentBox())
}

export const toggleBookmark: () => Thunk = () => (dispatch, getState) => {
    const isBookmarked = selectors.isBookmarked(getState())
    dispatch(setIsCommentBookmarked(!isBookmarked))
}
