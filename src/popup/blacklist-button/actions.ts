import { createAction } from 'redux-act'

import analytics from '../../analytics'
import { remoteFunction } from '../../util/webextensionRPC'
import { Thunk } from '../types'
import * as selectors from './selectors'
import * as popup from '../selectors'

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
        category: 'Popup',
        action: isDomainChoice ? 'Blacklist domain' : 'Blacklist site',
    })

    processEventRPC({
        type: isDomainChoice ? 'blacklistDomain' : 'blacklistSite',
    })

    let url = popup.url(state)
    url = isDomainChoice ? deriveDomain(url) : url

    addToBlacklistRPC(url)
    dispatch(setDomainDelete(isDomainChoice))
    dispatch(setShowBlacklistChoice(false))
    dispatch(setShowBlacklistDelete(true))
    dispatch(setIsBlacklisted(true))
}

export const deleteBlacklistData: () => Thunk = () => (dispatch, getState) => {
    const state = getState()

    analytics.trackEvent({
        category: 'Popup',
        action: 'Delete blacklisted pages',
    })

    const url = popup.url(state)
    const domainDelete = selectors.domainDelete(state)

    if (domainDelete) {
        deletePagesByDomainRPC(deriveDomain(url))
    } else {
        deletePagesRPC([url])
    }

    dispatch(setShowBlacklistDelete(false))
}
