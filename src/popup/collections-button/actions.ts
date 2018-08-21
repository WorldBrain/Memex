import { createAction } from 'redux-act'

import { Thunk } from '../types'
import * as selectors from './selectors'

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
