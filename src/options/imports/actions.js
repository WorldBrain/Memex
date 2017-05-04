import { createAction } from 'redux-act'

export const filterDownloadDetails = createAction('imports/filterDownloadDetails')
export const addDownloadDetails = createAction('imports/addDownloadDetails')

export const setHistoryStats = createAction('imports/setHistoryStats')
export const setBookmarksStats = createAction('imports/setBookmarksStats')

export const startImport = createAction('imports/startImport')
export const stopImport = createAction('imports/stopImport')
export const pauseImport = createAction('imports/pauseImport')
export const resumeImport = createAction('imports/resumeImport')

export const startIndexRebuild = createAction('imports/startIndexRebuild')
export const stopIndexRebuild = createAction('imports/stopIndexRebuild')
