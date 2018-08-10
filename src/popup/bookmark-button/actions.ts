import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import { updateLastActive } from '../../analytics'
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

    if (!isBookmarked) {
        await createBookmarkRPC({ url, tabId })
    } else {
        await deleteBookmarkRPC({ url })
    }

    dispatch(setIsBookmarked(!isBookmarked))

    updateLastActive()
}
