import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import { remove } from 'lodash/array'

import {
    selectors as commentSelectors,
    actions as commentActions,
} from '../CommentBox'
import * as selectors from './selectors'

const getAllAnnotationsRPC = remoteFunction('getAllAnnotations')
const getAnnotationTagsRPC = remoteFunction('getAnnotationTags')
const addAnnotationTagRPC = remoteFunction('addAnnotationTag')
const createAnnotationRPC = remoteFunction('createAnnotation')
const editAnnotationRPC = remoteFunction('editAnnotation')
const deleteAnnotationRPC = remoteFunction('deleteAnnotation')
const processEventRPC = remoteFunction('processEvent')

export const setAnnotations = createAction('setAnnotations')

export const setTags = createAction('setTags')

export const setActiveAnnotation = createAction('setActiveAnnotation')

export const setHoveredAnnotation = createAction('setHoveredAnnotation')

export const setAnnotationCount = createAction('setAnnotationCount')

export const setIsLoading = createAction('setIsLoading')

export const setPageInfo = createAction('setPageInfo')

const fetchAllTags = async annotations => {
    const tags = {}
    await Promise.all(
        annotations.map(async ({ url }) => {
            const annotationTags = await getAnnotationTagsRPC(url)
            tags[url] = annotationTags
        }),
    )
    return tags
}

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    dispatch(setAnnotations([]))
    dispatch(setIsLoading(true))
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await getAllAnnotationsRPC(url)
    const tags = await fetchAllTags(annotations)

    dispatch(setTags(tags))
    dispatch(setAnnotations(annotations))
    dispatch(setIsLoading(false))
}

export const setAnnotationAndTags = annotations => async dispatch => {
    const tags = await fetchAllTags(annotations)
    dispatch(setTags(tags))
    dispatch(setAnnotations(annotations))
    dispatch(setIsLoading(false))
}

export const findAnnotationCount = () => async (dispatch, getState) => {
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await getAllAnnotationsRPC(url)
    dispatch(setAnnotationCount(annotations.length))
}

export const createAnnotation = (comment, body, tags, env) => async (
    dispatch,
    getState,
) => {
    processEventRPC({ type: 'createAnnotation' })

    const state = getState()
    const { url, title } = selectors.page(state)
    const anchor = commentSelectors.anchor(state)
    // Write annotation to database
    const uniqueUrl = await createAnnotationRPC({
        url,
        title,
        body,
        comment,
        selector: anchor,
    })

    // Write tags to database
    tags.forEach(async tag => {
        await addAnnotationTagRPC({ tag, url: uniqueUrl })
    })

    dispatch(commentActions.setAnchor(null))
    dispatch(setActiveAnnotation(uniqueUrl))
    if (env === 'overview') dispatch(fetchAnnotationAct())
}

export const editAnnotation = (url, comment) => async (dispatch, getState) => {
    await editAnnotationRPC(url, comment)
    const state = getState()
    const annotations = [...selectors.annotations(state)]
    annotations.forEach(annotation => {
        if (annotation.url === url) {
            annotation.comment = comment
            annotation.lastEdited = new Date().getTime()
        }
    })
    dispatch(setAnnotations(annotations))
}

export const deleteAnnotation = url => async (dispatch, getState) => {
    processEventRPC({ type: 'deleteAnnotation' })

    await deleteAnnotationRPC(url)
    const state = getState()
    const annotations = [...selectors.annotations(state)]
    const predicate = annotation => annotation.url === url
    remove(annotations, predicate)
    dispatch(setAnnotations(annotations))
}
