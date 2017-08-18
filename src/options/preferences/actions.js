import { createAction } from 'redux-act'

export const setFreezeDryBookmarks = createAction('prefs/setFreezeDryBookmarks')
export const toggleFreezeDryBookmarks = createAction('prefs/toggleFreezeDryBookmarks')
export const setFreezeDryArchive = createAction('prefs/setFreezeDryArchive')
export const toggleFreezeDryArchive = createAction('prefs/toggleFreezeDryArchive')
