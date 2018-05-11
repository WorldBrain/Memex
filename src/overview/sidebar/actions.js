import { createAction } from 'redux-act'
import { fetchAnnotation } from 'src/annotations/background/annotations'

export const setShowSidebar = createAction('overview-sidebar/setShowSidebar')

export const closeSidebar = createAction('overview-sidebar/closeSidebar')

export const setAnnotation = createAction('overview-sidebar/fetchAnnotation')

export const fetchAnnotation = doc => async (dispatch, getState) => {
    dispatch(setShowSidebar(true))
    const annotation = await fetchAnnotation(doc)
    dispatch(setAnnotation(annotation))
}
