import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

const fetchAndDispatchAnnotations = async (dispatch, pageUrl) => {
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}

export const fetchAnnotationAct = pageUrl => async dispatch => {
    await fetchAndDispatchAnnotations(dispatch, pageUrl)
}

export const saveComment = (pageUrl, comment) => async dispatch => {
    await remoteFunction('createComment')(pageUrl, comment)
    await fetchAndDispatchAnnotations(dispatch, pageUrl)
}

export const editAnnotation = (pageUrl, url, comment) => async dispatch => {
    await remoteFunction('editAnnotation')(url, comment)
    await fetchAndDispatchAnnotations(dispatch, pageUrl)
}

export const deleteAnnotation = (pageUrl, url) => async dispatch => {
    await remoteFunction('deleteAnnotation')(url)
    await fetchAndDispatchAnnotations(dispatch, pageUrl)
}
