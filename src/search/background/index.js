import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import * as index from '..'
import { tabManager } from '../../activity-logger/background/'

makeRemotelyCallable({
    addTag: index.addTag,
    delTag: index.delTag,
    suggest: index.suggest,
    extendedSuggest: index.extendedSuggest,
    addBookmark: index.addBookmark,
    delBookmark: index.delBookmark,
    delPages: index.delPages,
    delPagesByDomain: index.delPagesByDomain,
    delPagesByPattern: index.delPagesByPattern,
    getMatchingPageCount: index.getMatchingPageCount,
    search: index.search,
    pageLookup: url => index.getPage(url).then(transformPageForSending),
})

async function transformPageForSending(page) {
    if (page == null) {
        return null
    }

    return {
        hasBookmark: page.hasBookmark,
        tags: page.tags,
        latest: page.latest,
    }
}

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
