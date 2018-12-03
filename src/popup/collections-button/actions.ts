import { createAction } from 'redux-act'

import { Thunk } from '../types'
import { PageList } from '../../custom-lists/background/types'
import * as selectors from './selectors'

export const setShowCollectionsPicker = createAction<boolean>(
    'collections/showCollectionsPicker',
)

export const setCollections = createAction<PageList[]>(
    'collections/setCollections',
)
export const setInitColls = createAction<PageList[]>('collections/setInitColls')

export const toggleShowTagsPicker: () => Thunk = () => (dispatch, getState) =>
    dispatch(
        setShowCollectionsPicker(!selectors.showCollectionsPicker(getState())),
    )

export const addCollection = createAction<PageList>('collections/addCollection')
export const deleteCollection = createAction<PageList>(
    'collections/deleteCollection',
)
