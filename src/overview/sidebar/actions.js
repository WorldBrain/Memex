import { createAction } from 'redux-act'
import { fetchAnnotations } from 'src/annotations/background/annotations'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setAnnotations = createAction('overview-sidebar/setAnnotations')

export const fetchAnnotationAct = doc => async (dispatch, getState) => {
    dispatch(setShowSidebar(true))
    const annotations = await fetchAnnotations(doc)
    dispatch(setAnnotations(annotations))
}
