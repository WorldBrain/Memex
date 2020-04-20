import { createAction } from 'redux-act'

import analytics from '../../analytics'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'

function deriveDomain(url: string) {
    const { hostname } = new URL(url)
    return hostname.startsWith('www') ? hostname.slice(4) : hostname
}

const addToBlacklistRPC: (url: string) => Promise<void> = remoteFunction(
    'addToBlacklist',
)
const processEventRPC: (args: any) => Promise<void> = remoteFunction(
    'processEvent',
)

const deletePagesRPC = remoteFunction('delPages')
const deletePagesByDomainRPC = remoteFunction('delPagesByDomain')

export const setShowBlacklistChoice = createAction<boolean>(
    'blacklist/setShowChoice',
)

export const setShowBlacklistDelete = createAction<boolean>(
    'blacklist/setShowDelete',
)

export const setIsBlacklisted = createAction<boolean>(
    'blacklist/setIsBlacklisted',
)

export const setDomainDelete = createAction<boolean>(
    'blacklist/setDomainDelete',
)

export const addURLToBlacklist: (
    flag: boolean,
) => Thunk = isDomainChoice => async (dispatch, getState) => {
    const state = getState()

    analytics.trackEvent({
        category: 'Blacklist',
        action: isDomainChoice
            ? 'createDomainEntryViaPopup'
            : 'createSiteEntryViaPopup',
    })

    processEventRPC({
        type: isDomainChoice
            ? EVENT_NAMES.BLACKLIST_DOMAIN
            : EVENT_NAMES.BLACKLIST_SITE,
    })

    let url = popup.url(state)
    url = isDomainChoice ? deriveDomain(url) : url

    addToBlacklistRPC(url)
    dispatch(setDomainDelete(isDomainChoice))
    dispatch(setShowBlacklistChoice(false))
    dispatch(setShowBlacklistDelete(true))
    dispatch(setIsBlacklisted(true))
}

export const deleteBlacklistData: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const state = getState()

    analytics.trackEvent({
        category: 'Pages',
        action: 'deleteViaSiteBlacklist',
    })

    const url = popup.url(state)
    const domainDelete = selectors.domainDelete(state)

    try {
        if (domainDelete) {
            await deletePagesByDomainRPC(deriveDomain(url))
        } else {
            await deletePagesRPC([url])
        }

        dispatch(setShowBlacklistDelete(false))
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
