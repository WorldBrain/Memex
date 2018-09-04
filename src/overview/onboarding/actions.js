import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
// import { IMPORT_TYPE as TYPE, CMDS } from 'src/options/imports/constants'
// import { IMPORT_CONN_NAME } from './constants'
import * as selectors from './selectors'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from '../../options/privacy/constants'

export const setShouldTrack = createAction('onboarding/setShouldTrack')
export const setVisible = createAction('onboarding/setVisible')
export const incProgress = createAction('onboarding/incProgress')
export const setProgress = createAction('onboarding/setProgress')
export const setImportsDone = createAction('onboarding/setImportsDone')
export const setImportsStarted = createAction('onboarding/setImportsStarted')

const processEvent = remoteFunction('processEvent')

const persistShouldTrack = flag =>
    browser.storage.local.set({ [SHOULD_TRACK]: flag })

export const init = () => (dispatch, getState) => {
    processEvent({
        type: 'startOnboarding',
    })

    if (selectors.isVisible(getState())) {
        browser.storage.local
            .get(SHOULD_TRACK)
            .then(
                storage =>
                    storage[SHOULD_TRACK] == null
                        ? persistShouldTrack(selectors.shouldTrack(getState()))
                        : dispatch(setShouldTrack(!!storage[SHOULD_TRACK])),
            )
            .catch()

        // return new ImportsConnHandler(IMPORT_CONN_NAME, dispatch, getState)
    }
}

export const setVisibleMiddle = val => dispatch => {
    processEvent({
        type: val ? 'startOnbarding' : 'finishOnboarding',
    })

    dispatch(setVisible(val))
}

export const toggleShouldTrack = () => async (dispatch, getState) => {
    const toggled = !selectors.shouldTrack(getState())

    const trackEvent = force => {
        const trackEvent = analytics.trackEvent(
            {
                category: 'Privacy',
                action: 'Change tracking pref',
                name: toggled ? 'opt-in' : 'opt-out',
            },
            force,
        )

        const processEventToStore = processEvent({
            type: toggled
                ? 'changeTrackingPrefOptIn'
                : 'changeTrackingPrefOptOut',
            force,
        })

        return Promise.all([trackEvent, processEventToStore])
    }

    if (toggled) {
        await persistShouldTrack(toggled)
        dispatch(setShouldTrack(toggled))
        await trackEvent(false)
    } else {
        // It is up becuase of better user interface, just toggle and then make changes in localStorage
        dispatch(setShouldTrack(toggled))
        await trackEvent(true)
        await persistShouldTrack(toggled)
    }
}

/**
 * Background script connection state handler, which sets up the connection and dispatches
 * specific redux actions for specific commands sent from the background script along the connection.
 *
 * @class ImportsConnHandler
 */
// class ImportsConnHandler {
//     static ONBOARDING_ALLOW_TYPES = {
//         [TYPE.HISTORY]: true,
//         [TYPE.BOOKMARK]: false,
//     }

//     _cancelled = false

//     constructor(connName, dispatch, getState) {
//         this._port = browser.runtime.connect({ name: connName })
//         this._dispatch = dispatch
//         this._getState = getState

//         this._port.onMessage.addListener(this.handleCmds)
//     }

//     start() {
//         const state = this._getState()

//         if (!selectors.isImportsDone(state)) {
//             this._port.postMessage({
//                 cmd: CMDS.START,
//                 payload: ImportsConnHandler.ONBOARDING_ALLOW_TYPES,
//             })
//         }

//         this._dispatch(setImportsStarted(true))
//     }

//     cancel() {
//         this._cancelled = true
//         analytics.trackEvent({
//             category: 'Onboarding',
//             action: 'Cancelled import',
//         })

//         processEvent({
//             type: 'onboardingCancelImport',
//         })

//         this._port.postMessage({ cmd: CMDS.CANCEL })
//         this.complete()
//     }

//     complete() {
//         if (!this._cancelled) {
//             analytics.trackEvent({
//                 category: 'Onboarding',
//                 action: 'Finished import',
//             })

//             processEvent({
//                 type: 'onboardingFinishImport',
//             })
//         }
//         this._dispatch(setImportsDone(true))
//     }

//     /**
//      * Responds to messages sent from background script over the runtime connection by dispatching
//      * appropriate redux actions. Non-handled messages are ignored.
//      */
//     handleCmds = ({ cmd, ...payload }) => {
//         switch (cmd) {
//             case CMDS.INIT: // Tell it to start immediately after BG connman sends INIT ready signal
//                 return this.start()
//             case CMDS.NEXT:
//                 return this._dispatch(incProgress())
//             case CMDS.COMPLETE:
//                 return this.complete()
//             case CMDS.PAUSE: // BG connman will pause on page refresh - this just auto-restarts on page load
//                 return this._port.postMessage({ cmd: CMDS.RESUME })
//             default:
//         }
//     }
// }
