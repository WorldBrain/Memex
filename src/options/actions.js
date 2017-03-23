import { createAction } from 'redux-act'
import { ourState } from './selectors'


export const startLoadingHistory = createAction('options/startLoadingHistory')
export const stopLoadingHistory = createAction('options/stopLoadingHistory')
export const resumeLoadingHistory = createAction('options/resumeLoadingHistory')

export const startSearchIndexRebuild = createAction('options/startSearchIndexRebuild')
export const stopSearchIndexRebuild = createAction('options/stopSearchIndexRebuild')
