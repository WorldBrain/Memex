import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import indexInterface from '../'
import { tabManager } from '../../activity-logger/background/'

makeRemotelyCallable({
    addTag: indexInterface.addTag,
    delTag: indexInterface.delTag,
    suggest: indexInterface.suggest,
    extendedSuggest: indexInterface.extendedSuggest,
    addBookmark: indexInterface.addBookmark,
    delBookmark: indexInterface.delBookmark,
    delPages: indexInterface.delPages,
    delPagesByDomain: indexInterface.delPagesByDomain,
    delPagesByPattern: indexInterface.delPagesByPattern,
    getMatchingPageCount: indexInterface.getMatchingPageCount,
    search: indexInterface.search,
    pageLookup: url =>
        indexInterface.getPage(url).then(transformPageForSending),
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

    return await indexInterface.delBookmark(node).catch(console.error)
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

    return await indexInterface.addBookmark({ url: node.url, tabId })
}
