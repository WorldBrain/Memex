import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('setAnnotations')

export const setPageInfo = createAction('setPageInfo')

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    const pageUrl = getState().page.url
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}

export const createAnnotation = (comment, body) => async (
    dispatch,
    getState,
) => {
    const { url, title } = getState().page
    await remoteFunction('createAnnotation')({ url, title, body, comment })
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
