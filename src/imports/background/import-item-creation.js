import chunk from 'lodash/fp/chunk'

import db from 'src/pouchdb'
import encodeUrl from 'src/util/encode-url-for-id'
import { pageKeyPrefix, convertPageDocId } from 'src/page-storage'
import { bookmarkKeyPrefix, convertBookmarkDocId } from 'src/bookmarks'
import { checkWithBlacklist } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
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
    encodedUrl: item.encodedUrl,
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
    return item => existingIds.has(item.encodedUrl)
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
    return item => existingIds.has(item.encodedUrl)
}

/**
 * @param {Array<any>} items Items with `encodedUrl` prop
 * @returns {Map<string, any>} Map of `encodedUrl` to the remaining import item data.
 */
const transformToImportItemMap = items =>
    items.reduce(
        (acc, { encodedUrl, ...currItem }) => acc.set(encodedUrl, currItem),
        new Map(),
    )

async function initFilterItemsByUrl() {
    const isNotBlacklisted = await checkWithBlacklist()

    /**
     * @param {Array<any>} items Array of items with `url` to filter on.
     * @return {Array<any>} Filtered version of `items` array, also augmented with `encodedUrl`.
     */
    return (items, alreadyExists) =>
        items.reduce((accItems, currItem) => {
            if (!isLoggable(currItem) || !isNotBlacklisted(currItem)) {
                return accItems
            }

            try {
                // Augment the item with encoded URL for DB check and item map
                const encodedUrl = encodeUrl(currItem.url, false)
                const augItem = { ...currItem, encodedUrl }

                // Filter out items already existing in DB, if specified
                if (alreadyExists == null || !alreadyExists(augItem)) {
                    return [...accItems, augItem]
                }
                return accItems
            } catch (error) {
                // URI malformed; don't add to list
                return accItems
            }
        }, [])
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
        // NOTE: There is a bug with old ext index sometimes repeating the index keys
        //  (eg.I indexed 400 pages, index contained 43)
        const indexSet = new Set(index.index)

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

    const historyItems = allowTypes[IMPORT_TYPE.HISTORY]
        ? filterItemsByUrl(
              await getHistoryItems(),
              await checkWithExistingPages(),
          )
        : []

    const bookmarkItems = allowTypes[IMPORT_TYPE.BOOKMARK]
        ? filterItemsByUrl(
              await getBookmarkItems(),
              await checkWithExistingBookmarks(),
          )
        : []

    const oldExtItems = allowTypes[IMPORT_TYPE.OLD]
        ? filterItemsByUrl(await getOldExtItems())
        : []

    return {
        historyItemsMap: transformToImportItemMap(
            historyItems.map(
                transformBrowserItemToImportItem(IMPORT_TYPE.HISTORY),
            ),
        ),
        bookmarkItemsMap: transformToImportItemMap(
            bookmarkItems.map(
                transformBrowserItemToImportItem(IMPORT_TYPE.BOOKMARK),
            ),
        ),
        oldExtItemsMap: transformToImportItemMap(oldExtItems),
    }
}
