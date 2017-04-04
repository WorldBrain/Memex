import { createAction } from 'redux-act'

export const setBlacklist = createAction('settings/setBlacklist')
export const addSiteToBlacklist = createAction('settings/addSiteToBlacklist')
export const removeSiteFromBlacklist = createAction('settings/removeSiteFromBlacklist')
