import { createAction } from 'redux-act'
import { createAnnotation } from '../redux/actions'
import { DEFAULT_ROWS } from '../constants'

export const setCommentInput = createAction('setCommentInput')

export const setTextareaRows = createAction('setTextareaRows')

export const setHidden = createAction('setHidden')

export const setTagInput = createAction('setTagInput')

export const setAnchor = createAction('setAnchor')

export const setHighlightTruncation = createAction('setHighlightTruncation')

export const setFocusCommentBox = createAction('setFocusCommentBox')

export const toggleHighlightTruncation = createAction(
    'toggleHighlightTruncation',
)

export const emptyTags = createAction('setTags')

export const addTag = createAction('addTag')

export const deleteTag = createAction('deleteTag')

const resetCommentBox = () => dispatch => {
    dispatch(setCommentInput(''))
    dispatch(setTextareaRows(DEFAULT_ROWS))
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
