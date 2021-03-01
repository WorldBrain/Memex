import { createAction } from 'redux-act'

import {
    getTooltipState,
    setTooltipState,
} from '../../in-page-ui/tooltip/utils'
import { remoteFunction, runInTabViaBg } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import analytics from 'src/analytics'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'

const processEventRPC = remoteFunction('processEvent')

export const setTooltipFlag = createAction<boolean>('tooltip/setTooltipFlag')

export const init: () => Thunk = () => async (dispatch) => {
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
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).removeTooltip()
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).updateRibbon()
    } else {
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).insertTooltip()
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).showContentTooltip()
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).updateRibbon()
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
        await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).insertTooltip()
    }

    await runInTabViaBg<InPageUIContentScriptRemoteInterface>(
        tabId,
    ).showContentTooltip()
}
