import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import searchConnectionHandler from './search-connection-handler'
import {
    setTags,
    addTags,
    delTags,
    fetchTags,
    initSingleLookup,
    removeKeyType,
    suggest,
    delBookmark,
    addBookmark,
    handleBookmarkCreation,
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    getMatchingPageCount,
} from '../'

const singleLookup = initSingleLookup()

makeRemotelyCallable({
    addTags,
    delTags,
    setTags,
    fetchTags,
    suggest,
    pageLookup: (id, projectOpts = {}) =>
        singleLookup(id).then(
            page =>
                page != null
                    ? transformPageForSending(page, projectOpts)
                    : page,
        ),
    addBookmark,
    delBookmark,
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    getMatchingPageCount,
})

const destructPageAtt = (att = []) => [...att]

/**
 * Objects like `Set` and `Map` won't send nicely over the script connection APIs. Destructure them into
 * Arrays for sending, if defined in `projectOpts`.
 *
 * @param {any} page
 * @param {any} projectOpts Object containing attribute for each `page` Set att. If att is defined,
 *  destructure it into array.
 */
const transformPageForSending = (page, projectOpts) => ({
    ...page,
    urlTerms: projectOpts.urlTerms ? destructPageAtt(page.urlTerms) : [],
    titleTerms: projectOpts.titleTerms ? destructPageAtt(page.titleTerms) : [],
    terms: projectOpts.terms ? destructPageAtt(page.terms) : [],
    visits: projectOpts.visits ? destructPageAtt(page.visits) : [],
    bookmarks: projectOpts.bookmarks ? destructPageAtt(page.bookmarks) : [],
    tags: projectOpts.tags ? destructPageAtt(page.tags).map(removeKeyType) : [],
})

// Allow other scripts to connect to background index and send queries
browser.runtime.onConnect.addListener(searchConnectionHandler)

const handleBookmarkRemoval = (id, { node }) =>
    node.url
        ? delBookmark(node.url)
        : console.warn('Cannot remove bookmark with no URL', node)

// Store and index any new browser bookmark
browser.bookmarks.onCreated.addListener(handleBookmarkCreation)
browser.bookmarks.onRemoved.addListener(handleBookmarkRemoval)
