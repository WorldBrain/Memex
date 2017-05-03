import { createAction } from 'redux-act'


export const startImport = createAction('options/startImport')
export const stopImport = createAction('options/stopImport')
export const pauseImport = createAction('options/pauseImport')
export const resumeImport = createAction('options/resumeImport')

export const startIndexRebuild = createAction('options/startIndexRebuild')
export const stopIndexRebuild = createAction('options/stopIndexRebuild')
