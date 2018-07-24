import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import { remove } from 'lodash/array'

import * as selectors from './selectors'
import { setAnchor } from '../CommentBox/actions'

export const setAnnotations = createAction('setAnnotations')

export const setActiveAnnotation = createAction('setActiveAnnotation')

export const setHoveredAnnotation = createAction('setHoveredAnnotation')

export const setAnnotationCount = createAction('setAnnotationCount')

export const setPageInfo = createAction('setPageInfo')

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    dispatch(setAnnotations([]))
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await remoteFunction('getAllAnnotations')(url)
    dispatch(setAnnotations(annotations))
}

export const findAnnotationCount = () => async (dispatch, getState) => {
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await remoteFunction('getAllAnnotations')(url)
    dispatch(setAnnotationCount(annotations.length))
}

export const createAnnotation = (comment, body, tags, env) => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const { url, title } = selectors.page(state)
    const anchor = selectors.anchor(state)

    // Write annotation to database
    const uniqueUrl = await remoteFunction('createAnnotation')({
        url,
        title,
        body,
        comment,
        selector: anchor,
    })

    // Write tags to database
    tags.forEach(async tag => {
        await remoteFunction('addAnnotationTag')({ tag, url: uniqueUrl })
    })

    dispatch(setAnchor(null))
    dispatch(setActiveAnnotation(uniqueUrl))
    if (env === 'overview') dispatch(fetchAnnotationAct())
}

export const editAnnotation = (url, comment) => async (dispatch, getState) => {
    await remoteFunction('editAnnotation')(url, comment)
    const state = getState()
    const annotations = [...selectors.annotation(state)]
    annotations.forEach(annotation => {
        if (annotation.url === url) annotation.comment = comment
    })
    dispatch(setAnnotations(annotations))
}

export const deleteAnnotation = url => async (dispatch, getState) => {
    await remoteFunction('deleteAnnotation')(url)
    const state = getState()
    const annotations = [...selectors.annotation(state)]
    const predicate = annotation => annotation.url === url
    remove(annotations, predicate)
    dispatch(setAnnotations(annotations))
}
