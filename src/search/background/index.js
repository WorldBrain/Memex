import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import indexInterface from '../'

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

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)

const handleBookmarkRemoval = (id, { node }) =>
    node.url
        ? indexInterface.delBookmark(node).catch(console.error)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(indexInterface.handleBookmarkCreation)
browser.bookmarks.onRemoved.addListener(handleBookmarkRemoval)
