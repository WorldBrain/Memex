import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('setAnnotations')

export const setActiveAnnotation = createAction('setActiveAnnotation')

export const setHoveredAnnotation = createAction('setActiveAnnotation')

export const setAnchor = createAction('setAnchor')

export const setPageInfo = createAction('setPageInfo')

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    dispatch(setAnnotations([]))
    const pageUrl = getState().page.url
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}

export const createAnnotation = (comment, body, tags) => async (
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
    dispatch(fetchAnnotationAct())
}

export const editAnnotation = (url, comment) => async dispatch => {
    await remoteFunction('editAnnotation')(url, comment)
    dispatch(fetchAnnotationAct())
}

export const deleteAnnotation = url => async dispatch => {
    await remoteFunction('deleteAnnotation')(url)
    dispatch(fetchAnnotationAct())
}
