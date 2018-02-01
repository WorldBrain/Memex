import { createAction } from 'redux-act'

import { IMPORT_TYPE as TYPE, CMDS } from 'src/options/imports/constants'
import { IMPORT_CONN_NAME } from './constants'

export const setVisible = createAction('onboarding/setVisible')
export const incProgress = createAction('onboarding/incProgress')
export const setImportsDone = createAction('onboarding/setImportsDone')

export const init = () => dispatch =>
    new ImportsConnHandler(IMPORT_CONN_NAME, dispatch)

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

    constructor(connName, dispatch) {
        this._port = browser.runtime.connect({ name: connName })
        this._dispatch = dispatch

        this._port.onMessage.addListener(this.handleCmds)
    }

    /**
     * Responds to messages sent from background script over the runtime connection by dispatching
     * appropriate redux actions. Non-handled messages are ignored.
    */
    handleCmds = ({ cmd, ...payload }) => {
        switch (cmd) {
            case CMDS.INIT:
                return this._port.postMessage({
                    cmd: CMDS.START,
                    payload: ImportsConnHandler.ONBOARDING_ALLOW_TYPES,
                })
            case CMDS.NEXT:
                return this._dispatch(incProgress())
            case CMDS.COMPLETE:
                return this._dispatch(setImportsDone(true))
            default:
                console.log(cmd, payload)
        }
    }
}
