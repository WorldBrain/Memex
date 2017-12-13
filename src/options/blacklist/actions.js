import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { dirtyStoredEsts } from 'src/imports'
import { remoteFunction } from 'src/util/webextensionRPC'
import { matchedDocCount } from './selectors'

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
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Add blacklist entry',
    })

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
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Remove blacklist entry',
    })

    dispatch(removeSiteFromBlacklist({ index }))
    dirtyStoredEsts() // Force import ests to recalc next visit
}

export const removeMatchingDocs = expression => (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Delete matching pages',
        value: matchedDocCount(getState()),
    })

    deleteDocs(expression, 'regex') // To be run in background; can take long
    dispatch(setModalShow(false))
}
