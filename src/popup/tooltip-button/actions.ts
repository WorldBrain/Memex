import { createAction } from 'redux-act'

import { getTooltipState, setTooltipState } from '../../content-tooltip/utils'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'

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
}

export const showTooltip: () => Thunk = () => async () => {
    await remoteFunction('showContentTooltip')()
}
