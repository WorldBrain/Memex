import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { EVENT_NAMES } from '../../analytics/internal/constants'

const processEventRPC = remoteFunction('processEvent')

export const setTooltipFlag = createAction<boolean>('tooltip/setTooltipFlag')

export const init: () => Thunk = () => async dispatch => {
    const sidebar = await getTooltipState()
    dispatch(setTooltipFlag(sidebar))
}

export const toggleTooltipFlag: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const wasEnabled = selectors.isTooltipEnabled(state)

    processEventRPC({
        type: wasEnabled ? EVENT_NAMES.DISABLE_TOOLTIP_POPUP : EVENT_NAMES.ENABLE_TOOLTIP_POPUP,
    })

    await setTooltipState(!wasEnabled)
    dispatch(setTooltipFlag(!wasEnabled))

    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    const tabId = popup.tabId(state)
    if (wasEnabled) {
        await remoteFunction('removeTooltip', { tabId })()
        await remoteFunction('updateRibbon', { tabId })()
    } else {
        await remoteFunction('insertTooltip', { tabId })()
        await remoteFunction('showContentTooltip', { tabId })()
        await remoteFunction('updateRibbon', { tabId })()
    }
}

export const showTooltip: () => Thunk = () => async (dispatch, getState) => {
    const state = getState()
    const tabId = popup.tabId(state)
    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    const isEnabled = await getTooltipState()
    if (!isEnabled) {
        await remoteFunction('insertTooltip', { tabId })({ override: true })
    }

    await remoteFunction('showContentTooltip', { tabId })()
}
