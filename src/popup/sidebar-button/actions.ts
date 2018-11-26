import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { getSidebarState } from '../../sidebar-overlay/utils'

export const init: () => Thunk = () => async dispatch => null

export const openSideBar: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const tabId = popup.tabId(state)
    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    const isEnabled = await getSidebarState()
    if (!isEnabled) {
        await remoteFunction('insertRibbon', { tabId })()
    }

    await remoteFunction('toggleSidebarOverlay', { tabId })()
}
