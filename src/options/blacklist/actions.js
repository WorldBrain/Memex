import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'

export const setSiteInputValue = createAction('settings/setSiteInputValue')
export const resetSiteInputValue = createAction('settings/resetSiteInputValue')
export const setBlacklist = createAction('settings/setBlacklist')
export const addSiteToBlacklist = createAction('settings/addSiteToBlacklist')
export const removeSiteFromBlacklist = createAction('settings/removeSiteFromBlacklist')

export const addToBlacklist = url => {
    const blacklistConfirm = remoteFunction('quickBlacklistConfirm')

    return dispatch => {
        dispatch(addSiteToBlacklist({ expression: url, dateAdded: Date.now() }))
        blacklistConfirm(url)
    }
}
