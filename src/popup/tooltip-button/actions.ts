import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction, runInTab } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { RibbonInteractionsInterface } from 'src/sidebar-overlay/ribbon/types'
import { TooltipInteractionInterface } from 'src/content-tooltip/types'
import analytics from 'src/analytics'

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
        type: wasEnabled
            ? EVENT_NAMES.DISABLE_TOOLTIP_POPUP
            : EVENT_NAMES.ENABLE_TOOLTIP_POPUP,
    })

    if (wasEnabled) {
        analytics.trackEvent({
            category: 'InPageTooltip',
            action: 'disableTooltipViaPopup',
        })
    }

    dispatch(setTooltipFlag(!wasEnabled))
    await setTooltipState(!wasEnabled)

    const isLoggable = popup.isLoggable(state)
    if (!isLoggable) {
        return
    }

    const tabId = popup.tabId(state)
    if (wasEnabled) {
        await runInTab<TooltipInteractionInterface>(tabId).removeTooltip()
        await runInTab<RibbonInteractionsInterface>(tabId).updateRibbon()
    } else {
        await runInTab<TooltipInteractionInterface>(tabId).insertTooltip()
        await runInTab<TooltipInteractionInterface>(tabId).showContentTooltip()
        await runInTab<RibbonInteractionsInterface>(tabId).updateRibbon()
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
        await runInTab<TooltipInteractionInterface>(tabId).insertTooltip({
            override: true,
        })
    }

    await runInTab<TooltipInteractionInterface>(tabId).showContentTooltip()
}
