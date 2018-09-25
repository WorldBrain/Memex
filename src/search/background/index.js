import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as index from '..'
import { tabManager } from '../../activity-logger/background/'

makeRemotelyCallable({
    search: index.search,
    addTag: index.addTag,
    delTag: index.delTag,
    suggest: index.suggest,
    delPages: index.delPages,
    addBookmark: index.addBookmark,
    delBookmark: index.delBookmark,
    fetchPageTags: index.fetchPageTags,
    extendedSuggest: index.extendedSuggest,
    delPagesByDomain: index.delPagesByDomain,
    delPagesByPattern: index.delPagesByPattern,
    getMatchingPageCount: index.getMatchingPageCount,
})

// Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
browser.bookmarks.onCreated.addListener(handleBookmarkCreation)
browser.bookmarks.onRemoved.addListener(handleBookmarkRemoval)

async function handleBookmarkRemoval(id, { node }) {
    // Created folders won't have `url`; ignore these
    if (!node.url) {
        return
    }

    return index.delBookmark(node).catch(console.error)
}

async function handleBookmarkCreation(id, node) {
    // Created folders won't have `url`; ignore these
    if (!node.url) {
        return
    }

    let tabId
    const activeTab = tabManager.getActiveTab()

    if (activeTab != null && activeTab.url === node.url) {
        tabId = activeTab.id
    }

    return index.addBookmark({ url: node.url, tabId })
}
