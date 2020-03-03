import { browser } from 'webextension-polyfill-ts'
import { createAction } from 'redux-act'
import { remoteFunction } from '../util/webextensionRPC'
import { Thunk } from './types'
import * as bookmarkActs from './bookmark-button/actions'
import * as tagActs from './tags-button/actions'
import * as collectionActs from './collections-button/actions'
import * as blacklistActs from './blacklist-button/actions'

const fetchPageTagsRPC = remoteFunction('fetchPageTags')
const fetchListsRPC = remoteFunction('fetchListPagesByUrl')
const fetchAllListsRPC = remoteFunction('fetchAllLists')
const fetchInitTagSuggRPC = remoteFunction('extendedSuggest')
const isURLBlacklistedRPC = remoteFunction('isURLBlacklisted')
const fetchInternalTabRPC = remoteFunction('fetchTab')
const fetchTabByUrlRPC = remoteFunction('fetchTabByUrl')

export const setTabId = createAction<number>('popup/setTabId')
export const setUrl = createAction<string>('popup/setUrl')
export const setSearchVal = createAction<string>('popup/setSearchVal')

const getCurrentTab = async () => {
    let currentTab
    if (browser.tabs) {
        ;[currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })
    } else {
        const url = window.location.href
        if (url) {
            currentTab = await fetchTabByUrlRPC(url)
        }
    }

    return currentTab
}
const setTabAndUrl: (id: number, url: string) => Thunk = (
    id,
    url,
) => async dispatch => {
    await dispatch(setTabId(id))
    await dispatch(setUrl(url))
}

const setTabIsBookmarked: (
    tabId: number,
) => Thunk = tabId => async dispatch => {
    const internalTab = await fetchInternalTabRPC(tabId)
    await dispatch(bookmarkActs.setIsBookmarked(internalTab.isBookmarked))
}

// N.B. This is also setup for all injections of the content script. Mainly so that keyboard shortcuts (bookmark) has the data when needed.
export const initBasicStore: () => Thunk = () => async dispatch => {
    const currentTab = await getCurrentTab()

    // If we can't get the tab data, then can't init action button states
    if (!currentTab || !currentTab.url) {
        console.warn("initBasicStore - Couldn't get a currentTab url")
        return false
    }
    await dispatch(setTabAndUrl(currentTab.id, currentTab.url))
    await dispatch(setTabIsBookmarked(currentTab.id))
}

export const initState: () => Thunk = () => async dispatch => {
    const currentTab = await getCurrentTab()

    // If we can't get the tab data, then can't init action button states
    if (!currentTab || !currentTab.url) {
        console.warn("initState - Couldn't get a currentTab url")
        return
    }

    await dispatch(setTabAndUrl(currentTab.id, currentTab.url))

    const isBlacklisted = await isURLBlacklistedRPC(currentTab.url)
    dispatch(blacklistActs.setIsBlacklisted(isBlacklisted))

    try {
        await dispatch(setTabIsBookmarked(currentTab.id))

        const listsAssocWithPage = await fetchListsRPC({ url: currentTab.url })
        const lists = await fetchAllListsRPC({
            excludeIds: listsAssocWithPage.map(({ id }) => id),
            limit: 20,
            skipMobileList: true,
        })
        dispatch(collectionActs.setInitColls([...listsAssocWithPage, ...lists]))
        dispatch(collectionActs.setCollections(listsAssocWithPage))

        // Get 20 more tags that are not related related to the list.
        const pageTags = await fetchPageTagsRPC(currentTab.url)
        const tags = await fetchInitTagSuggRPC({
            notInclude: pageTags,
            type: 'tag',
        })
        dispatch(tagActs.setInitTagSuggests([...pageTags, ...tags]))
        dispatch(tagActs.setTags(pageTags))
    } catch (err) {
        // Do nothing; just catch the error - means page doesn't exist for URL
        console.warn('initState - Error', err)
    }
}
