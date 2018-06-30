import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    annotations: [],
    anchor: null,
    page: {
        url: null,
        title: null,
    },
}

const setAnnotations = (state, annotations) => ({
    ...state,
    annotations: annotations,
})

const setPageInfo = (state, page) => ({
    ...state,
    page: page,
})

const setAnchor = (state, anchor) => ({
    ...state,
    anchor: anchor,
})

export default createReducer(
    {
        [actions.setAnnotations]: setAnnotations,
        [actions.setPageInfo]: setPageInfo,
        [actions.setAnchor]: setAnchor,
    },
    defaultState,
)
