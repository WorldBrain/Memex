import { createAction } from 'redux-act'
import { fetchAnnotations } from 'src/annotations/background/annotations'

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

export const fetchAnnotationAct = doc => async (dispatch, getState) => {
    const annotations = await fetchAnnotations(doc)
    dispatch(setAnnotations(annotations))
}
