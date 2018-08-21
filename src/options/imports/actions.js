import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { CMDS, IMPORT_CONN_NAME } from './constants'
import * as selectors from './selectors'
import { remoteFunction } from 'src/util/webextensionRPC'

const processEvent = remoteFunction('processEvent')

export const filterDownloadDetails = createAction(
    'imports/filterDownloadDetails',
)

export const addImportItem = createAction('imports/addImportItem')

export const toggleAllowType = createAction('imports/toggleAllowType')

export const initAllowTypes = createAction('imports/initAllowTypes')
export const initEstimateCounts = createAction('imports/initEstimateCounts')
export const initTotalsCounts = createAction('imports/initTotalsCounts')
export const initFailCounts = createAction('imports/initFailCounts')
export const initSuccessCounts = createAction('imports/initSuccessCounts')

export const initImportState = createAction('imports/initImportState')
export const initDownloadData = createAction('imports/initDownloadData')

export const prepareImport = createAction('imports/prepareImport')
export const startImport = createAction('imports/startImport')
export const stopImport = createAction('imports/stopImport')
export const finishImport = createAction('imports/finishImport')
export const readyImport = createAction('imports/readyImport')
export const cancelImport = createAction('imports/cancelImport')
export const pauseImport = createAction('imports/pauseImport')
export const resumeImport = createAction('imports/resumeImport')

// Adv settings mode actions
export const toggleAdvMode = createAction('imports-adv/toggleAdvMode')
export const setConcurrency = createAction('imports-adv/setConcurrency')
export const setProcessErrs = createAction('imports-adv/setProcessErrs')

export const showDownloadDetails = createAction('imports/showDownloadDetails')

/**
 * Responds to messages sent from background script over the runtime connection by dispatching
 * appropriate redux actions. Non-handled messages are ignored.
 */
const getCmdMessageHandler = dispatch => ({ cmd, ...payload }) => {
    switch (cmd) {
        case CMDS.INIT:
            dispatch(initEstimateCounts(payload))
            dispatch(readyImport())
            break
        case CMDS.START:
            dispatch(startImport())
            break
        case CMDS.PAUSE:
            dispatch(pauseImport())
            break
        case CMDS.NEXT:
            dispatch(addImportItem(payload))
            break
        case CMDS.COMPLETE:
            dispatch(stopImport())
            break
    }
}

// Hacky, but can't see a way around this... init thunk needs to be called before any other thunk...
let port

/**
 * Handles initing the imports runtime connection with the background script's batch import logic.
 */
export const init = () => async dispatch => {
    port = browser.runtime.connect({ name: IMPORT_CONN_NAME })
    port.onMessage.addListener(getCmdMessageHandler(dispatch))
}

/**
 * Creates a thunk that dispatches a given redux action and sends message over runtime connection port
 * to background script.
 * @param {any} action Redux action ready to dispatch.
 * @param {string} cmd The command to send over runtime connection's port.
 * @param {() => void} [cb] Opt. callback to run before any dispatch.
 */
const makePortMessagingThunk = ({
    actionCreator,
    cmd,
    cb = f => f,
}) => payload => dispatch => {
    cb()
    dispatch(actionCreator(payload))
    port.postMessage({ cmd, payload })
}

export const recalcEsts = makePortMessagingThunk({
    actionCreator: prepareImport,
    cmd: CMDS.RECALC,
})

export const setPrevFailed = makePortMessagingThunk({
    actionCreator: setProcessErrs,
    cmd: CMDS.SET_PROCESS_ERRS,
})

export const setConcurrencyLevel = makePortMessagingThunk({
    actionCreator: setConcurrency,
    cmd: CMDS.SET_CONCURRENCY,
})

// Batch controlling thunks
export const stop = makePortMessagingThunk({
    actionCreator: cancelImport,
    cmd: CMDS.CANCEL,
    cb: () => {
        analytics.trackEvent({
            category: 'Imports',
            action: 'Cancel import',
        })

        processEvent({
            type: 'cancelImport',
        })
    },
})

export const pause = makePortMessagingThunk({
    actionCreator: pauseImport,
    cmd: CMDS.PAUSE,
    cb: () => {
        analytics.trackEvent({
            category: 'Imports',
            action: 'Pause import',
        })

        processEvent({
            type: 'pauseImport',
        })
    },
})

export const resume = makePortMessagingThunk({
    actionCreator: resumeImport,
    cmd: CMDS.RESUME,
    cb: () => {
        analytics.trackEvent({
            category: 'Imports',
            action: 'Resume import',
        })

        processEvent({
            type: 'resumeImport',
        })
    },
})

export const finish = makePortMessagingThunk({
    actionCreator: finishImport,
    cmd: CMDS.FINISH,
    cb: () => {
        analytics.trackEvent({
            category: 'Imports',
            action: 'Finish import',
        })

        processEvent({
            type: 'finishImport',
        })
    },
})

export const start = () => (dispatch, getState) => {
    const state = getState()

    analytics.trackEvent({
        category: 'Imports',
        action: 'Start import',
        name: selectors.allowTypesString(state),
        value: selectors.concurrency(state),
    })

    processEvent({
        type: 'startImport',
    })

    dispatch(prepareImport())
    port.postMessage({
        cmd: CMDS.START,
        payload: selectors.allowTypes(state),
    })
}
