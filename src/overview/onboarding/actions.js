import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'
import { IMPORT_TYPE as TYPE, CMDS } from 'src/options/imports/constants'
import { IMPORT_CONN_NAME } from './constants'
import * as selectors from './selectors'

const dirtyEstsCache = remoteFunction('dirtyEstsCache')

export const setShouldTrack = createAction('onboarding/setShouldTrack')
export const toggleShouldTrack = createAction('onboarding/toggleShouldTrack')
export const setVisible = createAction('onboarding/setVisible')
export const incProgress = createAction('onboarding/incProgress')
export const setProgress = createAction('onboarding/setProgress')
export const setImportsDone = createAction('onboarding/setImportsDone')

export const init = () => (dispatch, getState) =>
    new ImportsConnHandler(IMPORT_CONN_NAME, dispatch, getState)

/**
 * Background script connection state handler, which sets up the connection and dispatches
 * specific redux actions for specific commands sent from the background script along the connection.
 *
 * @class ImportsConnHandler
 */
class ImportsConnHandler {
    static ONBOARDING_ALLOW_TYPES = {
        [TYPE.HISTORY]: true,
        [TYPE.BOOKMARK]: false,
        [TYPE.OLD]: false,
    }

    constructor(connName, dispatch, getState) {
        this._port = browser.runtime.connect({ name: connName })
        this._dispatch = dispatch
        this._getState = getState

        this._port.onMessage.addListener(this.handleCmds)
    }

    start() {
        const state = this._getState()

        if (!selectors.isImportsDone(state)) {
            this._port.postMessage({
                cmd: CMDS.START,
                payload: ImportsConnHandler.ONBOARDING_ALLOW_TYPES,
            })
        }
    }

    cancel() {
        this._port.postMessage({ cmd: CMDS.CANCEL })
        this.complete()
    }

    complete() {
        this._dispatch(setImportsDone(true))
        dirtyEstsCache()
    }

    /**
     * Responds to messages sent from background script over the runtime connection by dispatching
     * appropriate redux actions. Non-handled messages are ignored.
    */
    handleCmds = ({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.INIT: // Tell it to start immediately after BG connman sends INIT ready signal
                return this.start()
            case CMDS.NEXT:
                return this._dispatch(incProgress())
            case CMDS.COMPLETE:
                return this.complete()
            case CMDS.PAUSE: // BG connman will pause on page refresh - this just auto-restarts on page load
                return this._port.postMessage({ cmd: CMDS.RESUME })
            default:
                console.log(cmd, payload)
        }
    }
}
