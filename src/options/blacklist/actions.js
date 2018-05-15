import { createAction } from 'redux-act'

import analytics, { updateLastActive } from 'src/analytics'
import internalAnalytics from 'src/analytics/internal'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'
import { STORAGE_KEY } from './constants'

const deletePagesByPattern = remoteFunction('delPagesByPattern')
const getMatchingPageCount = remoteFunction('getMatchingPageCount')
const dirtyEstsCache = remoteFunction('dirtyEstsCache')

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

export const initBlacklist = () => async dispatch => {
    dispatch(setIsLoading(true))
    try {
        const { [STORAGE_KEY]: blacklist } = await browser.storage.local.get({
            [STORAGE_KEY]: '[]',
        })

        const parsedBlacklist = JSON.parse(blacklist)
        dispatch(setBlacklist(parsedBlacklist))
    } catch (err) {
        dispatch(setBlacklist([]))
    } finally {
        dispatch(setIsLoading(false))
    }
}

export const addToBlacklist = expression => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Add blacklist entry',
    })

    internalAnalytics.processEvent({
        type: 'add_lacklist_entry',
    })

    const oldBlacklist = selectors.blacklist(getState())
    const newEntry = { expression, dateAdded: Date.now() }

    dispatch(addSiteToBlacklist(newEntry))
    dispatch(resetSiteInputValue())
    dispatch(setIsLoading(true))
    try {
        await browser.storage.local.set({
            [STORAGE_KEY]: JSON.stringify([newEntry, ...oldBlacklist]),
        })
        const count = await getMatchingPageCount(expression)

        if (count > 0) {
            dispatch(setModalShow(true))
            dispatch(setMatchedCount(count))
        }
    } catch (error) {
    } finally {
        updateLastActive() // Consider user active (analytics)
        dispatch(setIsLoading(false))
        dirtyEstsCache() // Force import ests to recalc next visit
    }
}

export const removeFromBlacklist = index => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Remove blacklist entry',
    })

    internalAnalytics.processEvent({
        type: 'remove_blacklist_entry',
    })

    const oldBlacklist = selectors.blacklist(getState())
    const newBlacklist = [
        ...oldBlacklist.slice(0, index),
        ...oldBlacklist.slice(index + 1),
    ]

    await browser.storage.local.set({
        [STORAGE_KEY]: JSON.stringify(newBlacklist),
    })

    updateLastActive() // Consider user active (analytics)
    dispatch(removeSiteFromBlacklist({ index }))
    dirtyEstsCache() // Force import ests to recalc next visit
}

export const removeMatchingDocs = expression => (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Delete matching pages',
        value: selectors.matchedDocCount(getState()),
    })

    deletePagesByPattern(expression) // To be run in background; can take long
    dispatch(setModalShow(false))
}
