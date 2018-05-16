import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import indexInterface from '../'
import { storeEvent } from '../search-index-new/'

makeRemotelyCallable({
    addTag: indexInterface.addTag,
    delTag: indexInterface.delTag,
    suggest: indexInterface.suggest,
    addBookmark: indexInterface.addBookmark,
    delBookmark: indexInterface.delBookmark,
    delPages: indexInterface.delPages,
    delPagesByDomain: indexInterface.delPagesByDomain,
    delPagesByPattern: indexInterface.delPagesByPattern,
    getMatchingPageCount: indexInterface.getMatchingPageCount,
    search: indexInterface.search,
    storeEvent: storeEvent,
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

const handleBookmarkRemoval = (id, { node }) =>
    node.url
        ? indexInterface.delBookmark(node).catch(console.error)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(indexInterface.handleBookmarkCreation)
browser.bookmarks.onRemoved.addListener(handleBookmarkRemoval)
