import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications, bookmarks } from 'src/util/remote-functions-background'

export const setIsBookmarked = createAction<boolean>('bookmark/setIsBookmarked')

export const toggleBookmark: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const url = popup.url(state)
    const tabId = popup.tabId(state)
    const hasBookmark = selectors.isBookmarked(state)

    try {
        // N.B. bookmark state set before and after save to prevent race conditions
        // where the bookmark is loaded and set elsewhere (initial sidebar injection store setup)
        // hints at a bigger refactoring of state needed.
            dispatch(setIsBookmarked(true))
            await bookmarks.addPageBookmark({ url, tabId })
            dispatch(setIsBookmarked(true))
    } catch (err) {
        dispatch(setIsBookmarked(hasBookmark))
        handleDBQuotaErrors(
            error =>
                notifications.create({
                    requireInteraction: false,
                    title: 'Memex error: starring page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
}
