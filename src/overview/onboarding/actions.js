import { createAction } from 'redux-act'

import { IMPORT_TYPE as TYPE, CMDS } from 'src/options/imports/constants'
import { IMPORT_CONN_NAME } from './constants'
import * as selectors from './selectors'

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
        this._dispatch(setImportsDone(true))
    }

    /**
     * Responds to messages sent from background script over the runtime connection by dispatching
     * appropriate redux actions. Non-handled messages are ignored.
    */
    handleCmds = ({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.INIT:
                return this.start()
            case CMDS.NEXT:
                return this._dispatch(incProgress())
            case CMDS.COMPLETE:
                return this._dispatch(setImportsDone(true))
            case CMDS.PAUSE:
                return this._port.postMessage({ cmd: CMDS.RESUME })
            default:
                console.log(cmd, payload)
        }
    }
}
