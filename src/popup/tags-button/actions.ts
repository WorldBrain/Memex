import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'
import * as onboarding from 'src/overview/onboarding/popup-helper'
import analytics from 'src/analytics'

export const setShowTagsPicker = createAction<boolean>('tags/showTagsPicker')
export const setTags = createAction<string[]>('tags/setTags')
export const setInitTagSuggests = createAction<string[]>(
    'tags/setInitTagSuggests',
)

export const toggleShowTagsPicker: () => Thunk = () => (dispatch, getState) =>
    dispatch(setShowTagsPicker(!selectors.showTagsPicker(getState())))

export const addTag = createAction<string>('tags/addTag')
export const deleteTag = createAction<string>('tags/deleteTag')

export const addTagToPage = (tag: string) => async dispatch => {
    analytics.trackEvent({ category: 'Tag', action: 'pageFromPopup' })
    dispatch(addTag(tag))
    await onboarding.checkForTaggingStage()
}
export const setAllTabs = createAction<boolean>('tags/setAllTabs')
