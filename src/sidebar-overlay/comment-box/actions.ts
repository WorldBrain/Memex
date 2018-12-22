import { createAction } from 'redux-act'
import { Thunk } from '../types'

import { createAnnotation } from '../redux/actions'
import { NUM_DEFAULT_ROWS } from './constants'

export const setCommentInput = createAction<string>('setCommentInput')

export const setTextareaRows = createAction<number>('setTextareaRows')

export const setHidden = createAction<boolean>('setHidden')

export const setTagInput = createAction<boolean>('setTagInput')

export const setAnchor = createAction<any>('setAnchor')

export const setHighlightTruncation = createAction<boolean>(
    'setHighlightTruncation',
)

export const setFocusCommentBox = createAction<boolean>('setFocusCommentBox')

export const toggleHighlightTruncation = createAction<void>(
    'toggleHighlightTruncation',
)

export const emptyTags = createAction('emptyTags')

export const addTag = createAction<any>('addTag')

export const deleteTag = createAction<any>('deleteTag')

const resetCommentBox: () => Thunk = () => dispatch => {
    dispatch(setCommentInput(''))
    dispatch(setTextareaRows(NUM_DEFAULT_ROWS))
    dispatch(setHidden(true))
    dispatch(setTagInput(false))
    dispatch(emptyTags())
}

export const saveAnnotation = (comment, body, tags, env) => dispatch => {
    dispatch(createAnnotation(comment, body, tags, env))
    dispatch(resetCommentBox())
}

export const cancelAnnotation = () => dispatch => {
    dispatch(setAnchor(null))
    dispatch(resetCommentBox())
}

export const receiveAnchor = anchor => dispatch => {
    dispatch(setHighlightTruncation(true))
    dispatch(setAnchor(anchor))
}
