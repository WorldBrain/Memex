import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    annotations: [],
    highlightedText: '',
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

const setHighlightedText = (state, text) => ({
    ...state,
    highlightedText: text,
})

export default createReducer(
    {
        [actions.setAnnotations]: setAnnotations,
        [actions.setPageInfo]: setPageInfo,
        [actions.setHighlightedText]: setHighlightedText,
    },
    defaultState,
)
