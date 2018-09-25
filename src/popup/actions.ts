import { browser } from 'webextension-polyfill-ts'
import { createAction } from 'redux-act'

import { remoteFunction } from '../util/webextensionRPC'
import { Thunk } from './types'
import { acts as bookmarkActs } from './bookmark-button'
import { acts as tagActs } from './tags-button'
import { acts as collectionActs } from './collections-button'
import { acts as blacklistActs } from './blacklist-button'

const fetchPageTagsRPC = remoteFunction('fetchPageTags')
const fetchListsRPC = remoteFunction('fetchListPagesByUrl')
const fetchAllListsRPC = remoteFunction('fetchAllLists')
const fetchInitTagSuggRPC = remoteFunction('extendedSuggest')
const isURLBlacklistedRPC = remoteFunction('isURLBlacklisted')
const fetchInternalTabRPC = remoteFunction('fetchTab')

export const setTabId = createAction<number>('popup/setTabId')
export const setUrl = createAction<string>('popup/setUrl')
export const setSearchVal = createAction<string>('popup/setSearchVal')

export const initState: () => Thunk = () => async dispatch => {
    const [currentTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    })

    // If we can't get the tab data, then can't init action button states
    if (!currentTab || !currentTab.url) {
        return
    }

    dispatch(setTabId(currentTab.id))
    dispatch(setUrl(currentTab.url))

    const isBlacklisted = await isURLBlacklistedRPC(currentTab.url)
    dispatch(blacklistActs.setIsBlacklisted(isBlacklisted))

    try {
        const internalTab = await fetchInternalTabRPC(currentTab.id)
        dispatch(bookmarkActs.setIsBookmarked(internalTab.isBookmarked))

        const listsAssocWithPage = await fetchListsRPC({ url: currentTab.url })
        const lists = await fetchAllListsRPC({
            excludeIds: listsAssocWithPage.map(({ id }) => id),
            limit: 20,
        })
        dispatch(collectionActs.setInitColls([...listsAssocWithPage, ...lists]))
        dispatch(collectionActs.setCollections(listsAssocWithPage))

        // Get 20 more tags that are not related related to the list.
        const pageTags = await fetchPageTagsRPC(currentTab.url)
        const tags = await fetchInitTagSuggRPC(pageTags, 'tag')
        dispatch(tagActs.setInitTagSuggests([...pageTags, ...tags]))
        dispatch(tagActs.setTags(pageTags))
    } catch (err) {
        // Do nothing; just catch the error - means page doesn't exist for URL
    }
}
