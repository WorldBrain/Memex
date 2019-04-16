import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'
import { STORAGE_KEY } from './constants'
import { EVENT_NAMES } from '../../analytics/internal/constants'

const deletePagesByPattern = remoteFunction('delPagesByPattern')
const getMatchingPageCount = remoteFunction('getMatchingPageCount')
const dirtyEstsCache = remoteFunction('dirtyEstsCache')
const processEvent = remoteFunction('processEvent')

export const setMatchedCount = createAction('settings/setMatchedCount') as any
export const setModalShow = createAction('settings/setModalShow') as any
export const setIsLoading = createAction('settings/setIsLoading') as any
export const setSiteInputValue = createAction(
    'settings/setSiteInputValue',
) as any
export const resetSiteInputValue = createAction(
    'settings/resetSiteInputValue',
) as any
export const setBlacklist = createAction('settings/setBlacklist') as any
export const addSiteToBlacklist = createAction(
    'settings/addSiteToBlacklist',
) as any
export const removeSiteFromBlacklist = createAction(
    'settings/removeSiteFromBlacklist',
) as any

export const initBlacklist = () => async dispatch => {
    dispatch(setIsLoading(true))
    try {
        const { [STORAGE_KEY]: blacklist } = await window[
            'browser'
        ].storage.local.get({
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

    processEvent({
        type: EVENT_NAMES.ADD_BLACKLIST_ENTRY,
    })

    const oldBlacklist = selectors.blacklist(getState())
    const newEntry = {
        expression,
        dateAdded: Date.now(),
    }

    dispatch(addSiteToBlacklist(newEntry))
    dispatch(resetSiteInputValue())
    dispatch(setIsLoading(true))
    try {
        await window['browser'].storage.local.set({
            [STORAGE_KEY]: JSON.stringify([newEntry, ...oldBlacklist]),
        })
        const count = await getMatchingPageCount(expression)

        if (count > 0) {
            dispatch(setModalShow(true))
            dispatch(setMatchedCount(count))
        }
    } catch (error) {
        // Do nothing
    } finally {
        dispatch(setIsLoading(false))
        dirtyEstsCache() // Force import ests to recalc next visit
    }
}

export const removeFromBlacklist = index => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'Remove blacklist entry',
    })

    processEvent({
        type: EVENT_NAMES.REMOVE_BLACKLIST_ENTRY,
    })

    const oldBlacklist = selectors.blacklist(getState())
    const newBlacklist = [
        ...oldBlacklist.slice(0, index),
        ...oldBlacklist.slice(index + 1),
    ]

    await window['browser'].storage.local.set({
        [STORAGE_KEY]: JSON.stringify(newBlacklist),
    })

    dispatch(
        removeSiteFromBlacklist({
            index,
        }),
    )
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
