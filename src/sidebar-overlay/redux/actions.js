import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

const fetchAndDispatchAnnotations = async (dispatch, pageUrl, strip = true) => {
    const annotations = await remoteFunction('getAllAnnotations')(
        pageUrl,
        strip,
    )
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
    await fetchAndDispatchAnnotations(dispatch, pageUrl, false)
}

export const deleteAnnotation = (pageUrl, url) => async dispatch => {
    await remoteFunction('deleteAnnotation')(url)
    await fetchAndDispatchAnnotations(dispatch, pageUrl, false)
}
