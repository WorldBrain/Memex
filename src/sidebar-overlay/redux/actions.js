import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import { remove } from 'lodash/array'

export const setAnnotations = createAction('setAnnotations')

export const setActiveAnnotation = createAction('setActiveAnnotation')

export const setHoveredAnnotation = createAction('setHoveredAnnotation')

export const setAnnotationCount = createAction('setAnnotationCount')

export const setAnchor = createAction('setAnchor')

export const setPageInfo = createAction('setPageInfo')

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    dispatch(setAnnotations([]))
    const pageUrl = getState().page.url
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}

export const findAnnotationCount = () => async (dispatch, getState) => {
    const pageUrl = getState().page.url
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotationCount(annotations.length))
}

export const createAnnotation = (comment, body, tags, env) => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const { url, title } = state.page
    const selector = state.anchor

    // Write annotation to database
    const uniqueUrl = await remoteFunction('createAnnotation')({
        url,
        title,
        body,
        comment,
        selector,
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

    const annotations = [...getState().annotations]
    annotations.forEach(annotation => {
        if (annotation.url === url) annotation.comment = comment
    })
    dispatch(setAnnotations(annotations))
}

export const deleteAnnotation = url => async (dispatch, getState) => {
    await remoteFunction('deleteAnnotation')(url)

    const annotations = [...getState().annotations]
    const predicate = annotation => annotation.url === url
    remove(annotations, predicate)
    dispatch(setAnnotations(annotations))
}
