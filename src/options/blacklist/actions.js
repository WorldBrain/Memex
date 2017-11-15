import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'

const deleteDocs = remoteFunction('deleteDocsByUrl')
const calcMatchingDocs = remoteFunction('calcMatchingDocs')

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
    dispatch(resetSiteInputValue())
    dispatch(setModalShow(true))
    dispatch(setIsLoading(true))
    try {
        const { allRows } = await calcMatchingDocs(expression)
        dispatch(setMatchedCount(allRows.length))
    } catch (error) {
    } finally {
        dispatch(setIsLoading(false))
    }
}

export const removeMatchingDocs = expression => dispatch => {
    deleteDocs(expression, 'regex') // To be run in background; can take long
    dispatch(setModalShow(false))
}
