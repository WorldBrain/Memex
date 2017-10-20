import { createAction } from 'redux-act'

import db from 'src/pouchdb'
import { CMDS, IMPORT_CONN_NAME } from './constants'
import { allowTypes as allowTypesSelector } from './selectors'

export const filterDownloadDetails = createAction(
    'imports/filterDownloadDetails',
)

export const addImportItem = createAction('imports/addImportItem')

export const toggleAllowType = createAction('imports/toggleAllowType')

export const initEstimateCounts = createAction('imports/initEstimateCounts')
export const initTotalsCounts = createAction('imports/initTotalsCounts')
export const initFailCounts = createAction('imports/initFailCounts')
export const initSuccessCounts = createAction('imports/initSuccessCounts')

export const initImportState = createAction('imports/initImportState')
export const initDownloadData = createAction('imports/initDownloadData')

export const initImport = createAction('imports/initImport')
export const prepareImport = createAction('imports/prepareImport')
export const startImport = createAction('imports/startImport')
export const stopImport = createAction('imports/stopImport')
export const finishImport = createAction('imports/finishImport')
export const readyImport = createAction('imports/readyImport')
export const cancelImport = createAction('imports/cancelImport')
export const pauseImport = createAction('imports/pauseImport')
export const resumeImport = createAction('imports/resumeImport')

// Dev mode actions
export const toggleDevMode = createAction('imports-dev/toggleDevMode')
export const startTestDataUpload = createAction(
    'imports-dev/startTestDataUpload',
)
export const finishTestDataUpload = createAction(
    'imports-dev/finishTestDataUpload',
)

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

const deserializeDoc = docString => {
    if (!docString) return undefined
    try {
        return JSON.parse(docString)
    } catch (error) {
        console.error(`Cannot parse following input:\n${docString}`)
    }
}

/**
 * Performs a restore of given docs files.
 * @param {Array<File>} files One or more NDJSON files that contain database docs.
 */
export const uploadTestData = files => async (dispatch, getState) => {
    dispatch(startTestDataUpload())

    if (files.length < 1) {
        return dispatch(finishTestDataUpload())
    }

    const getFileText = getFileTextViaReader(new FileReader())
    const onlyDefinedDocs = doc => doc

    // Write contents of each file, one-at-a-time, to the DB
    for (const file of files) {
        const text = await getFileText(file)
        const docs = text
            .split('\n')
            .map(deserializeDoc)
            .filter(onlyDefinedDocs)

        await db.bulkDocs(docs)
        console.log(`${docs.length} test docs stored`)
    }

    dispatch(finishTestDataUpload())
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
 * Handles initing the imports runtime connection with the background script's batch import logic.
 */
export const init = () => dispatch => {
    port = browser.runtime.connect({ name: IMPORT_CONN_NAME })
    const cmdMessageHandler = getCmdMessageHandler(dispatch)
    port.onMessage.addListener(cmdMessageHandler)
}

/**
 * Creates a thunk that dispatches a given redux action and sends message over runtime connection port
 * to background script.
 * @param action Redux action ready to dispatch.
 * @param cmd The command to send over runtime connection's port.
 */
const makePortMessagingThunk = ({ action, cmd }) => () => dispatch => {
    dispatch(action)
    port.postMessage({ cmd })
}

// Batch controlling thunks
export const stop = makePortMessagingThunk({
    action: cancelImport(),
    cmd: CMDS.CANCEL,
})
export const pause = makePortMessagingThunk({
    action: pauseImport(),
    cmd: CMDS.PAUSE,
})
export const resume = makePortMessagingThunk({
    action: resumeImport(),
    cmd: CMDS.RESUME,
})
export const finish = makePortMessagingThunk({
    action: finishImport(),
    cmd: CMDS.FINISH,
})
export const start = () => (dispatch, getState) => {
    const allowImportTypes = allowTypesSelector(getState())

    dispatch(prepareImport())
    port.postMessage({ cmd: CMDS.START, ...allowImportTypes })
}
