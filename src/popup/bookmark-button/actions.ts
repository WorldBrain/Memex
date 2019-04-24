import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

const createBookmarkRPC = remoteFunction('addBookmark')
const deleteBookmarkRPC = remoteFunction('delBookmark')
const createNotifRPC = remoteFunction('createNotification')

export const setIsBookmarked = createAction<boolean>('bookmark/setIsBookmarked')

export const toggleBookmark: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const url = popup.url(state)
    const tabId = popup.tabId(state)
    const hasBookmark = selectors.isBookmarked(state)
    dispatch(setIsBookmarked(!hasBookmark))

    const bookmarkRPC = hasBookmark ? deleteBookmarkRPC : createBookmarkRPC
    try {
        await bookmarkRPC({ url, tabId })
    } catch (err) {
        dispatch(setIsBookmarked(hasBookmark))
        createNotifRPC({
            requireInteraction: false,
            title: 'Memex error: starring page',
            message: err.message,
        })
    }
}
