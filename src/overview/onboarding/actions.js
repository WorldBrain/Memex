import { createAction } from 'redux-act'
import { CMDS, IMPORT_CONN_NAME } from 'src/options/imports/constants'

export const setVisible = createAction('onboarding/setVisible')

export const init = () => dispatch =>
    new ImportsConnHandler(IMPORT_CONN_NAME, dispatch)

/**
 * Background script connection state handler, which sets up the connection and dispatches
 * specific redux actions for specific commands sent from the background script along the connection.
 *
 * @class ImportsConnHandler
 */
class ImportsConnHandler {
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
            case CMDS.NEXT:
            case CMDS.COMPLETE:
            default:
                console.log(cmd, payload)
        }
    }
}
