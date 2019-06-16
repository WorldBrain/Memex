import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications, bookmarks } from 'src/util/remote-functions'

export const setIsBookmarked = createAction<boolean>('bookmark/setIsBookmarked')

export const toggleBookmark: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const url = popup.url(state)
    const tabId = popup.tabId(state)
    const hasBookmark = selectors.isBookmarked(state)
    dispatch(setIsBookmarked(!hasBookmark))

    const bookmarkRPC = hasBookmark
        ? bookmarks.delBookmark
        : bookmarks.addBookmark
    try {
        await bookmarkRPC({ url, tabId })
    } catch (err) {
        dispatch(setIsBookmarked(hasBookmark))
        handleDBQuotaErrors(
            error =>
                notifications.createNotification({
                    requireInteraction: false,
                    title: 'Memex error: starring page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
}
