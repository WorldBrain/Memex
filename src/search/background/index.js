import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import {
    addTag,
    delTag,
    suggest,
    delBookmark,
    addBookmark,
    handleBookmarkCreation,
    getPage,
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    getMatchingPageCount,
} from '../'

makeRemotelyCallable({
    addTag,
    delTag,
    suggest,
    addBookmark,
    delBookmark,
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    getMatchingPageCount,
    pageLookup: url => getPage(url).then(transformPageForSending),
})

async function transformPageForSending(page) {
    if (page == null) {
        return null
    }

    await page.loadRels()

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
        ? delBookmark(node.url)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(handleBookmarkCreation)
browser.bookmarks.onRemoved.addListener(handleBookmarkRemoval)
