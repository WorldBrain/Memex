import { createAction } from 'redux-act'

import { getSidebarState, setSidebarState } from '../../sidebar-overlay/utils'
import { remoteFunction, runInTab } from 'src/util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { RibbonInteractionsInterface } from 'src/sidebar-overlay/ribbon/types'

export const setSidebarFlag = createAction<boolean>('tooltip/setSidebarFlag')

export const init: () => Thunk = () => async dispatch => {
    const sidebar = await getSidebarState()
    dispatch(setSidebarFlag(sidebar))
}

export const toggleSidebarFlag: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const wasEnabled = selectors.isSidebarEnabled(state)

    await setSidebarState(!wasEnabled)
    dispatch(setSidebarFlag(!wasEnabled))

    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    const tabId = popup.tabId(state)
    const ribbon = runInTab<RibbonInteractionsInterface>(tabId)

    if (wasEnabled) {
        await ribbon.removeRibbon()
    } else {
        await ribbon.insertRibbon()
    }
}

export const openSideBar: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    await remoteFunction('toggleSidebarOverlay')({ override: true })
}
