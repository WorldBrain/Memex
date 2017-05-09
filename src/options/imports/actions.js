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
