import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

const createBookmarkRPC = remoteFunction('addBookmark')
const deleteBookmarkRPC = remoteFunction('delBookmark')

export const setIsBookmarked = createAction<boolean>('bookmark/setIsBookmarked')

export const toggleBookmark: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const url = popup.url(state)
    const tabId = popup.tabId(state)
    const isBookmarked = selectors.isBookmarked(state)
    dispatch(setIsBookmarked(!isBookmarked))

    try {
        if (!isBookmarked) {
            await createBookmarkRPC({ url, tabId })
        } else {
            await deleteBookmarkRPC({ url })
        }
    } catch (err) {
        dispatch(setIsBookmarked(isBookmarked))
        remoteFunction('createNotification')({
            requireInteraction: false,
            title: 'Starring page error',
            message: err.message,
        })
    }
}
