import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { getSidebarState, setSidebarState } from '../../sidebar-overlay/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

const processEventRPC = remoteFunction('processEvent')

export const setSidebarFlag = createAction<boolean>('tooltip/setSidebarFlag')
export const setTooltipFlag = createAction<boolean>('tooltip/setTooltipFlag')

export const init: () => Thunk = () => async dispatch => {
    const [sidebar, tooltip] = await Promise.all([
        getSidebarState(),
        getTooltipState(),
    ])
    dispatch(setSidebarFlag(sidebar))
    dispatch(setTooltipFlag(tooltip))
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
    if (wasEnabled) {
        await remoteFunction('removeRibbon', { tabId })()
    } else {
        await remoteFunction('insertRibbon', { tabId })()
        await remoteFunction('toggleSidebarOverlay', { tabId })()
    }
}

export const toggleTooltipFlag: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const wasEnabled = selectors.isTooltipEnabled(state)

    processEventRPC({
        type: wasEnabled ? 'disableTooltipPopup' : 'enableTooltipPopup',
    })

    await setTooltipState(!wasEnabled)
    dispatch(setTooltipFlag(!wasEnabled))
}
