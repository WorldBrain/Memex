import browser from 'webextension-polyfill'
import { createAction } from 'redux-act'
import { remoteFunction, runInBackground } from '../util/webextensionRPC'
import type { Thunk } from './types'
import { getCurrentTab } from './utils'
import { acts as bookmarkActs } from './bookmark-button'
import { acts as collectionActs } from './collections-button'
import type { BookmarksInterface } from 'src/bookmarks/background/types'
import type { PageIndexingInterface } from 'src/page-indexing/background/types'
import { isUrlSupported } from 'src/page-indexing/utils'

const fetchPageTagsRPC = remoteFunction('fetchPageTags')
const fetchListsRPC = remoteFunction('fetchListPagesByUrl')
const fetchAllListsRPC = remoteFunction('fetchAllLists')
const fetchInitTagSuggRPC = remoteFunction('extendedSuggest')

const bookmarks = runInBackground<BookmarksInterface>()

export const setTabId = createAction<number>('popup/setTabId')
export const setUrl = createAction<string>('popup/setUrl')
export const setSearchVal = createAction<string>('popup/setSearchVal')

const setTabAndUrl: (id: number, url: string) => Thunk = (id, url) => async (
    dispatch,
) => {
    await dispatch(setTabId(id))
    await dispatch(setUrl(url))
}

const setTabIsBookmarked: (pageUrl: string) => Thunk = (pageUrl) => async (
    dispatch,
) => {
    const hasBoomark = await bookmarks.pageHasBookmark(pageUrl)
    await dispatch(bookmarkActs.setIsBookmarked(hasBoomark))
}

async function init() {
    const currentTab = await getCurrentTab({
        runtimeAPI: browser.runtime,
        tabsAPI: browser.tabs,
    })

    // If we can't get the tab data, then can't init action button states
    if (
        !currentTab?.url ||
        !isUrlSupported({
            fullUrl: currentTab.originalUrl,
            allowFileUrls: true,
        })
    ) {
        return { currentTab: null, fullUrl: null }
    }

    try {
        const identifier = await runInBackground<
            PageIndexingInterface<'caller'>
        >().waitForContentIdentifier({
            tabId: currentTab.id,
            fullUrl: currentTab.url,
        })

        return { currentTab, fullUrl: identifier.fullUrl }
    } catch (e) {
        return { currentTab, fullUrl: currentTab.url }
    }
}

export const initState: () => Thunk = () => async (dispatch) => {
    const { currentTab, fullUrl } = await init()
    if (!currentTab) {
        return
    }

    await dispatch(setTabAndUrl(currentTab.id, fullUrl))

    try {
        await dispatch(setTabIsBookmarked(fullUrl))

        const listsAssocWithPage = await fetchListsRPC({ url: fullUrl })
        const lists = await fetchAllListsRPC({
            excludeIds: listsAssocWithPage.map(({ id }) => id),
            limit: 20,
            skipMobileList: true,
        })
        dispatch(collectionActs.setInitColls([...listsAssocWithPage, ...lists]))
        dispatch(collectionActs.setCollections(listsAssocWithPage))

        // Get 20 more tags that are not related related to the list.
        const pageTags = await fetchPageTagsRPC({ url: fullUrl })
        const tags = await fetchInitTagSuggRPC({
            notInclude: pageTags,
            type: 'tag',
        })
    } catch (err) {
        // Do nothing; just catch the error - means page doesn't exist for URL
        console.warn('initState - Error', err)
    }
}
