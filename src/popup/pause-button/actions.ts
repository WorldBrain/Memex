import { createAction } from 'redux-act'

import { getPauseState } from '../../activity-logger'
import analytics from '../../analytics'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'

const togglePauseRPC = remoteFunction('toggleLoggingPause')

export const setPaused = createAction<boolean>('pause/setPaused')
export const setTimeout = createAction<number>('pause/setTimeout')
export const resetTimeout = createAction('pause/resetTimeout')

export const init: () => Thunk = () => async (dispatch) => {
    const isPaused = await getPauseState()
    dispatch(setPaused(isPaused))
}

export const togglePaused: () => Thunk = () => (dispatch, getState) => {
    const state = getState()
    const isPaused = selectors.isPaused(state)
    const pauseTime = selectors.pauseTime(state)

    analytics.trackEvent({
        category: 'Settings',
        action: isPaused ? 'resumeIndexingViaPopup' : 'pauseIndexingViaPopup',
        value: isPaused ? undefined : pauseTime,
    })

    // Tell background script to pause
    togglePauseRPC(pauseTime)

    dispatch(setPaused(!isPaused))
    dispatch(resetTimeout())
}
