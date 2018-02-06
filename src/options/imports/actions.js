import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { CMDS, IMPORT_CONN_NAME, OLD_EXT_KEYS } from './constants'
import * as selectors from './selectors'
import { importIndex } from 'src/options/imports/index_ops'
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

export const setShowOldExt = createAction('imports/setShowOldExt')

// Adv settings mode actions
export const toggleAdvMode = createAction('imports-adv/toggleAdvMode')
export const setFileUploading = createAction('imports-adv/setFileUploading')
export const setConcurrency = createAction('imports-adv/setConcurrency')
export const setProcessErrs = createAction('imports-adv/setProcessErrs')

export const showDownloadDetails = createAction('imports/showDownloadDetails')

/**
 * @param {FileReader} fileReader FileReader instance to bind to text reading function.
 * @return {(File) => Promise<String>} Async function that reads a given file and returns its text.
 */
const getFileTextViaReader = fileReader => file =>
    new Promise((resolve, reject) => {
        fileReader.onload = event => resolve(event.target.result)
        fileReader.readAsText(file)
    })

/**
 * Performs a restore of given docs files.
 * @param {Array<File>} files One or more NDJSON files that contain database docs.
 */
export const uploadTestData = files => async (dispatch, getState) => {
    dispatch(setFileUploading(true))

    if (files.length < 1) {
        return dispatch(setFileUploading(false))
    }

    const getFileText = getFileTextViaReader(new FileReader())

    // Write contents of each file, one-at-a-time, to the DB
    for (const file of files) {
        const text = await getFileText(file)
        await importIndex(JSON.parse(text))
    }

    dispatch(setFileUploading(false))
}

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
 * Handles initing the imports runtime connection with the background script's batch import logic,
 * as well as checking local storage to see if old extension imports needs to be shown.
 */
export const init = () => async dispatch => {
    port = browser.runtime.connect({ name: IMPORT_CONN_NAME })
    port.onMessage.addListener(getCmdMessageHandler(dispatch))

    const { [OLD_EXT_KEYS.INDEX]: index } = await browser.storage.local.get(
        OLD_EXT_KEYS.INDEX,
    )

    // If old ext data exists, set the view state to show
    if (index && index.index instanceof Array && index.index.length) {
        dispatch(setShowOldExt(true))
    }
}

/**
 * Creates a thunk that dispatches a given redux action and sends message over runtime connection port
 * to background script.
 * @param {any} action Redux action ready to dispatch.
 * @param {string} cmd The command to send over runtime connection's port.
 * @param {() => void} [cb] Opt. callback to run before any dispatch.
 */
const makePortMessagingThunk = ({
    action,
    cmd,
    cb = f => f,
}) => () => dispatch => {
    cb()
    dispatch(action)
    port.postMessage({ cmd })
}

// Batch controlling thunks
export const stop = makePortMessagingThunk({
    action: cancelImport(),
    cmd: CMDS.CANCEL,
    cb: () =>
        analytics.trackEvent({
            category: 'Imports',
            action: 'Cancel import',
        }),
})

export const pause = makePortMessagingThunk({
    action: pauseImport(),
    cmd: CMDS.PAUSE,
    cb: () =>
        analytics.trackEvent({
            category: 'Imports',
            action: 'Pause import',
        }),
})

export const resume = makePortMessagingThunk({
    action: resumeImport(),
    cmd: CMDS.RESUME,
    cb: () =>
        analytics.trackEvent({
            category: 'Imports',
            action: 'Resume import',
        }),
})

export const finish = makePortMessagingThunk({
    action: finishImport(),
    cmd: CMDS.FINISH,
    cb: () =>
        analytics.trackEvent({
            category: 'Imports',
            action: 'Finish import',
        }),
})

export const start = () => (dispatch, getState) => {
    const state = getState()

    analytics.trackEvent({
        category: 'Imports',
        action: 'Start import',
        name: selectors.allowTypesString(state),
        value: selectors.concurrency(state),
    })

    dispatch(prepareImport())
    port.postMessage({
        cmd: CMDS.START,
        payload: selectors.allowTypes(state),
    })
}

export const setConcurrencyLevel = concurrency => dispatch => {
    dispatch(setConcurrency(concurrency))
    port.postMessage({ cmd: CMDS.SET_CONCURRENCY, payload: concurrency })
}

export const setPrevFailed = value => dispatch => {
    dispatch(setProcessErrs(value))
    port.postMessage({ cmd: CMDS.SET_PROCESS_ERRS, payload: value })
}
