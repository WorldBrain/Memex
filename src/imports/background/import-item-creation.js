import chunk from 'lodash/fp/chunk'

import db from 'src/pouchdb'
import encodeUrl from 'src/util/encode-url-for-id'
import { pageKeyPrefix, convertPageDocId } from 'src/page-storage'
import { bookmarkKeyPrefix, convertBookmarkDocId } from 'src/bookmarks'
import { checkWithBlacklist } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
import { differMaps } from 'src/util/map-set-helpers'
import {
    IMPORT_TYPE,
    OLD_EXT_KEYS,
    DEF_ALLOW,
} from 'src/options/imports/constants'

// Binds old ext bookmark urls to a function that transforms old ext data to an import item
const transformOldExtDataToImportItem = bookmarkUrls => (item, index) => ({
    type: IMPORT_TYPE.OLD,
    url: item.url,
    timestamp: item.time,
    hasBookmark: bookmarkUrls.has(item.url),
    index,
})

// Binds an import type to a function that transforms a history/bookmark doc to an import item.
const transformBrowserItemToImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    // HistoryItems contain lastVisitTime while BookmarkTreeNodes contain dateAdded
    timestamp: item.lastVisitTime || item.dateAdded,
    type,
})

async function checkWithExistingBookmarks() {
    const { rows: existingBmDocs } = await db.allDocs({
        startkey: bookmarkKeyPrefix,
        endkey: `${bookmarkKeyPrefix}\uffff`,
    })

    const existingIds = new Set(
        existingBmDocs.map(row => convertBookmarkDocId(row.id).url),
    )
    return url => existingIds.has(url)
}

/**
 * @returns {({ url: string }) => boolean} A function affording checking of a URL against the
 *  URLs of existing page docs.
 */
async function checkWithExistingPages() {
    const { rows: existingPageDocs } = await db.allDocs({
        startkey: pageKeyPrefix,
        endkey: `${pageKeyPrefix}\uffff`,
    })

    const existingIds = new Set(
        existingPageDocs.map(row => convertPageDocId(row.id).url),
    )
    return url => existingIds.has(url)
}

async function initFilterItemsByUrl() {
    const isNotBlacklisted = await checkWithBlacklist()

    /**
     * Performs all needed filtering on a collection of history, bookmark, or old ext items. As these
     * can be quite large, attemps to do in a single iteration of the input collection.
     *
     * @param {Array<any>} items Array of items with `url` to filter on.
     * @param {(item: any) => any} transform Opt. transformformation fn turning current iterm into import item structure.
     * @param {(url: string) => bool} alreadyExists Opt. checker function to check against existing data.
     * @return {Map<string, any>} Filtered version of `items` array made into a Map of encoded URL strings to import items.
     */
    return (items, transform = f => f, alreadyExists) =>
        items.reduce((accItems, currItem) => {
            if (!isLoggable(currItem) || !isNotBlacklisted(currItem)) {
                return accItems
            }

            let encodedUrl
            try {
                encodedUrl = encodeUrl(currItem.url, false) // Augment the item with encoded URL for DB check and item map
            } catch (error) {
                return accItems // URI malformed; don't add to list
            }

            // Filter out items already existing in DB, if specified
            if (alreadyExists == null || !alreadyExists(encodedUrl)) {
                accItems.set(encodedUrl, transform(currItem))
            }

            return accItems
        }, new Map())
}

/**
 * @param {number} [maxResults=9999999] The max amount of items to grab from browser.
 * @param {number} [startTime=0] The time to start search from for browser history.
 * @returns {Array<browser.history.HistoryItem>} All history items in browser filtered by URL.
 */
const getHistoryItems = (maxResults = 9999999, startTime = 0) =>
    browser.history.search({
        text: '',
        maxResults,
        startTime,
    })

/**
 * @param {number} [maxResults=100000] The max amount of items to grab from browser.
 * @returns {Array<browser.bookmarks.BookmarkTreeNode>} All bookmark items in browser filtered by URL.
 */
const getBookmarkItems = (maxResults = 100000) =>
    browser.bookmarks.getRecent(maxResults)

export async function getOldExtItems() {
    let bookmarkUrls = new Set()
    const {
        [OLD_EXT_KEYS.INDEX]: index,
        [OLD_EXT_KEYS.BOOKMARKS]: bookmarks,
    } = await browser.storage.local.get({
        [OLD_EXT_KEYS.INDEX]: { index: [] },
        [OLD_EXT_KEYS.BOOKMARKS]: '[]',
    })

    if (typeof bookmarks === 'string') {
        try {
            bookmarkUrls = new Set(JSON.parse(bookmarks).map(bm => bm.url))
        } catch (error) {}
    }

    const transform = transformOldExtDataToImportItem(bookmarkUrls)
    const importItems = []

    // Only attempt page data conversion if index + bookmark storage values are correct types
    if (index && index.index instanceof Array) {
        // NOTE: There is a bug with old ext index sometimes repeating the index keys, hence uniqing here
        //  (eg.I indexed 400 pages, index contained 43 million)
        const indexSet = new Set(index.index)

        // Break up old index into chunks of size 200 to access sequentially from storage
        // Doing this to allow us to cap space complexity at a constant level +
        // give time a `N / # chunks` speedup
        for (const keyChunk of chunk(200)([...indexSet])) {
            const storageChunk = await browser.storage.local.get(keyChunk)

            keyChunk.forEach((key, i) => {
                if (storageChunk[key] == null) {
                    return
                }

                importItems.push(transform(storageChunk[key], i))
            })
        }
    }

    return importItems
}

/**
 * @param {any} allowTypes
 * @returns {any} Object containing three Maps of encoded URL keys to import item values.
 *   Used to create the imports list and estimate counts.
 */
export default async function createImportItems(allowTypes = DEF_ALLOW) {
    const filterItemsByUrl = await initFilterItemsByUrl()

    // Get all history from browser, filter on existing DB pages
    let historyItemsMap = filterItemsByUrl(
        await getHistoryItems(),
        transformBrowserItemToImportItem(IMPORT_TYPE.HISTORY),
        await checkWithExistingPages(),
    )

    // Get all bookmarks from browser, filter on existing DB bookmarks
    const bookmarkItemsMap = filterItemsByUrl(
        await getBookmarkItems(),
        transformBrowserItemToImportItem(IMPORT_TYPE.BOOKMARK),
        await checkWithExistingBookmarks(),
    )

    // Get all old ext from local storage, don't filter on existing data
    const oldExtItemsMap = filterItemsByUrl(await getOldExtItems())

    // Perform set difference, removing bm items from history (these are a subset of hist)
    historyItemsMap = differMaps(bookmarkItemsMap)(historyItemsMap)

    return {
        historyItemsMap: allowTypes[IMPORT_TYPE.HISTORY]
            ? historyItemsMap
            : new Map(),
        bookmarkItemsMap: allowTypes[IMPORT_TYPE.BOOKMARK]
            ? bookmarkItemsMap
            : new Map(),
        oldExtItemsMap: allowTypes[IMPORT_TYPE.OLD]
            ? oldExtItemsMap
            : new Map(),
    }
}
