import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

export const fetchAnnotationAct = pageUrl => async (dispatch, getState) => {
    const annotations = await remoteFunction('getAllAnnotations')(pageUrl)
    dispatch(setAnnotations(annotations))
}
