import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

export const fetchAnnotationAct = pageUrl => async (dispatch, getState) => {
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}

export const saveComment = (pageUrl, comment) => async (dispatch, getState) => {
    const storedComment = await remoteFunction('createComment')(
        pageUrl,
        comment,
    )
    console.log(storedComment)
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}
