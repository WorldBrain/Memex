import { createAction } from 'redux-act'

import analytics from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'
import { STORAGE_KEY } from './constants'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'
import * as Raven from 'src/util/raven'

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
        Raven.captureException(err)
        dispatch(setBlacklist([]))
    } finally {
        dispatch(setIsLoading(false))
    }
}

export const addToBlacklist = expression => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'createEntryViaSettings',
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
        Raven.captureException(error)
    } finally {
        dispatch(setIsLoading(false))
        dirtyEstsCache() // Force import ests to recalc next visit
    }
}

export const removeFromBlacklist = index => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Blacklist',
        action: 'deleteEntryViaSettings',
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

export const removeMatchingDocs = expression => async (dispatch, getState) => {
    analytics.trackEvent({
        category: 'Pages',
        action: 'deleteViaRegexBlacklist',
        value: selectors.matchedDocCount(getState()),
    })
    dispatch(setModalShow(false))

    try {
        await deletePagesByPattern(expression) // To be run in background; can take long
    } catch (err) {
        handleDBQuotaErrors(
            error =>
                notifications.create({
                    requireInteraction: false,
                    title: 'Memex error: deleting page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
}
