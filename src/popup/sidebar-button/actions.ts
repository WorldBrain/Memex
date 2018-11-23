import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

const processEventRPC = remoteFunction('processEvent')

export const setTooltipFlag = createAction<boolean>('tooltip/setTooltipFlag')

export const init: () => Thunk = () => async dispatch =>
    dispatch(setTooltipFlag(await getTooltipState()))

export const toggleTooltipFlag: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const isEnabled = selectors.isTooltipEnabled(state)
    const tabId = popup.tabId(state)
    const isLoggable = popup.isLoggable(state)

    processEventRPC({
        type: isEnabled ? 'disableTooltipPopup' : 'enableTooltipPopup',
    })

    await setTooltipState(!isEnabled)
    dispatch(setTooltipFlag(!isEnabled))

    if (!isLoggable) {
        return
    }

    if (isEnabled) {
        await remoteFunction('removeRibbon', { tabId })()
    } else {
        await remoteFunction('insertRibbon', { tabId })()
        await remoteFunction('toggleSidebarOverlay', { tabId })()
    }
}
