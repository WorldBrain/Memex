import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

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
        type: wasEnabled ? 'disableTooltipPopup' : 'enableTooltipPopup',
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
    } else {
        await remoteFunction('insertTooltip', { tabId })()
        await remoteFunction('showContentTooltip', { tabId })()
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
        await remoteFunction('insertTooltip', { tabId })()
    }

    await remoteFunction('showContentTooltip', { tabId })()
}
