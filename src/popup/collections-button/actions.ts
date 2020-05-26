import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'
import * as onboarding from 'src/overview/onboarding/popup-helper'
import analytics from 'src/analytics'
import { PageList } from 'src/custom-lists/background/types'

export const setShowCollectionsPicker = createAction<boolean>(
    'collections/showCollectionsPicker',
)

export const setCollections = createAction<string[]>(
    'collections/setCollections',
)
export const setInitColls = createAction<string[]>('collections/setInitColls')

export const toggleShowTagsPicker: () => Thunk = () => (dispatch, getState) =>
    dispatch(
        setShowCollectionsPicker(!selectors.showCollectionsPicker(getState())),
    )

export const addCollection = createAction<string>('collections/addCollection')
export const deleteCollection = createAction<string>(
    'collections/deleteCollection',
)

export const addCollectionToPage = (collection: string) => async (dispatch) => {
    analytics.trackEvent({
        category: 'Collections',
        action: 'addPageViaPopup',
    })
    dispatch(addCollection(collection))
    await onboarding.checkForTaggingStage()
}
export const setAllTabs = createAction<boolean>('collections/setAllTabs')

export const _addCollectionToPageLegacy = (collection: PageList) =>
    addCollectionToPage(collection.name)
export const _deleteCollectionLegacy = (collection: PageList) =>
    deleteCollection(collection.name)
