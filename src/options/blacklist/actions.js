import { createAction } from 'redux-act'

import { dirty as dirtyStoredEsts } from 'src/imports/import-item-cache'
import { remoteFunction } from 'src/util/webextensionRPC'

const deleteDocs = remoteFunction('deleteDocsByUrl')
const fetchMatchingPages = remoteFunction('fetchPagesByUrlPattern')

export const setMatchedCount = createAction('settings/setMatchedCount')
export const setModalShow = createAction('settings/setModalShow')
export const setIsLoading = createAction('settings/setIsLoading')
export const setSiteInputValue = createAction('settings/setSiteInputValue')
export const resetSiteInputValue = createAction('settings/resetSiteInputValue')
export const setBlacklist = createAction('settings/setBlacklist')
export const addSiteToBlacklist = createAction('settings/addSiteToBlacklist')
export const removeSiteFromBlacklist = createAction(
    'settings/removeSiteFromBlacklist',
)

export const addToBlacklist = expression => async dispatch => {
    dispatch(addSiteToBlacklist({ expression, dateAdded: Date.now() }))
    dirtyStoredEsts() // Force import ests to recalc next visit
    dispatch(resetSiteInputValue())
    dispatch(setIsLoading(true))
    try {
        const rows = await fetchMatchingPages(expression)

        if (rows.length) {
            dispatch(setModalShow(true))
            dispatch(setMatchedCount(rows.length))
        }
    } catch (error) {
    } finally {
        dispatch(setIsLoading(false))
    }
}

export const removeFromBlacklist = index => dispatch => {
    dispatch(removeSiteFromBlacklist({ index }))
    dirtyStoredEsts() // Force import ests to recalc next visit
}

export const removeMatchingDocs = expression => dispatch => {
    deleteDocs(expression, 'regex') // To be run in background; can take long
    dispatch(setModalShow(false))
}
