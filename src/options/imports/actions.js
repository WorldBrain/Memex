import { createAction } from 'redux-act'

export const filterDownloadDetails = createAction('imports/filterDownloadDetails')
export const addDownloadDetails = createAction('imports/addDownloadDetails')

export const initImportState = createAction('imports/initImportState')
export const initDownloadData = createAction('imports/initDownloadData')
export const initHistoryStats = createAction('imports/initHistoryStats')
export const initBookmarksStats = createAction('imports/initBookmarksStats')

export const startImport = createAction('imports/startImport')
export const stopImport = createAction('imports/stopImport')
export const pauseImport = createAction('imports/pauseImport')
export const resumeImport = createAction('imports/resumeImport')

export const startIndexRebuild = createAction('imports/startIndexRebuild')
export const stopIndexRebuild = createAction('imports/stopIndexRebuild')
