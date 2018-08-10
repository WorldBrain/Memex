import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'

export const setShowTagsPicker = createAction<boolean>('tags/showTagsPicker')
export const setTags = createAction<string[]>('tags/setTags')
export const setInitTagSuggests = createAction<string[]>(
    'tags/setInitTagSuggests',
)

export const toggleShowTagsPicker: () => Thunk = () => (dispatch, getState) =>
    dispatch(setShowTagsPicker(!selectors.showTagsPicker(getState())))
