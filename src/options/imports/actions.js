import { createAction } from 'redux-act'

export const filterDownloadDetails = createAction('imports/filterDownloadDetails')

const finishItem = (url, err) => ({ url, status: !err, err })
export const finishBookmarkItem = createAction('imports/finishBookmarkItem', finishItem)
export const finishHistoryItem = createAction('imports/finishHistoryItem', finishItem)

export const initCounts = createAction('imports/initCounts')

export const initImportState = createAction('imports/initImportState')
export const initDownloadData = createAction('imports/initDownloadData')

export const initImport = createAction('imports/initImport')
export const startImport = createAction('imports/startImport')
export const stopImport = createAction('imports/stopImport')
export const finishImport = createAction('imports/finishImport')
export const pauseImport = createAction('imports/pauseImport')
export const resumeImport = createAction('imports/resumeImport')

export const startIndexRebuild = createAction('imports/startIndexRebuild')
export const stopIndexRebuild = createAction('imports/stopIndexRebuild')

let port

export const init = () => dispatch => {
    port = browser.runtime.connect({ name: 'imports' })
    port.onMessage.addListener(msg => {
        const { type, ...payload } = msg
        switch (type) {
            case 'INIT': return dispatch(initCounts(payload))
            case 'NEXT': return dispatch(finishHistoryItem(payload.url, payload.error))
            case 'COMPLETE': return dispatch(stopImport())
        }
    })
}

export const start = () => dispatch => {
    dispatch(startImport())
    port.postMessage({ cmd: 'START' })
}

export const stop = () => dispatch => {
    dispatch(stopImport())
    port.postMessage({ cmd: 'STOP' })
}

export const pause = () => dispatch => {
    dispatch(pauseImport())
    port.postMessage({ cmd: 'PAUSE' })
}

export const resume = () => dispatch => {
    dispatch(resumeImport())
    port.postMessage({ cmd: 'RESUME' })
}
