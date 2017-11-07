import chunk from 'lodash/fp/chunk'

import db from 'src/pouchdb'
import encodeUrl from 'src/util/encode-url-for-id'
import { pageKeyPrefix, generatePageDocId } from 'src/page-storage'
import { checkWithBlacklist } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE, OLD_EXT_KEYS } from 'src/options/imports/constants'
import importsConnectionHandler from './imports-connection-handler'

// Constants
export const importStateStorageKey = 'import_items'
export const installTimeStorageKey = 'extension_install_time'

// Imports local storage state interface
export const getImportItems = async () => {
    const { [importStateStorageKey]: data } = await browser.storage.local.get({
        [importStateStorageKey]: [],
    })

    return new Map(data)
}

/**
 * @param {Map<string, IImportItem>} items Import items collection to become the new state.
 */
export const setImportItems = items =>
    browser.storage.local.set({
        [importStateStorageKey]: Array.from(items),
    })

export const clearImportItems = () =>
    browser.storage.local.remove(importStateStorageKey)

/**
 * @param {string} encodedUrl The URL to remove from imports items' collection state.
 */
export const removeImportItem = async encodedUrl => {
    const importItemsMap = await getImportItems()
    importItemsMap.delete(encodedUrl)
    await setImportItems(importItemsMap)
}

/**
 * Removes local storage entry representing single page data in the old ext.
 *
 * @param {string} oldExtKey Local storage key to remove.
 */
export async function clearOldExtData({ timestamp, index }) {
    const {
        [OLD_EXT_KEYS.INDEX]: oldIndex,
        [OLD_EXT_KEYS.NUM_DONE]: numDone,
    } = await browser.storage.local.get({
        [OLD_EXT_KEYS.INDEX]: { index: [] },
        [OLD_EXT_KEYS.NUM_DONE]: 0,
    })

    // Inc. finished count
    await browser.storage.local.set({
        [OLD_EXT_KEYS.NUM_DONE]: numDone + 1,
        [OLD_EXT_KEYS.INDEX]: {
            index: [
                ...oldIndex.index.slice(0, index),
                ...oldIndex.index.slice(index + 1),
            ],
        },
    })
    // Remove old ext page item
    await browser.storage.local.remove(timestamp.toString())
}

// Binds old ext bookmark urls to a function that transforms old ext data to an import item
const transformOldExtDataToImportItem = bookmarkUrls => (data, index) => ({
    type: IMPORT_TYPE.OLD,
    url: data.url,
    timestamp: data.time,
    hasBookmark: bookmarkUrls.has(data.url),
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

/**
 * @returns {({ url: string }) => boolean} A function affording checking of a URL against the
 *  URLs of existing page docs.
 */
async function checkWithExistingDocs() {
    const { rows: existingPageDocs } = await db.allDocs({
        startkey: pageKeyPrefix,
        endkey: `${pageKeyPrefix}\uffff`,
    })

    const existingIds = new Set(existingPageDocs.map(row => row.id))
    return item => {
        try {
            return !existingIds.has(generatePageDocId(item))
        } catch (err) {
            return false // Malformed URI
        }
    }
}

/**
 * Handles performing blacklist and pending import filtering logic on any type
 * of items containing a `url` field.
 *
 * @param {Array<any>} items Some Iterable of items of any shape, as long as they contain `url` field.
 * @returns {Array<any>} Filtered version of the items arg.
 */
async function filterItemsByUrl(items, type) {
    const isNotBlacklisted = await checkWithBlacklist()
    const doesNotExist = await checkWithExistingDocs()

    const isWorthRemembering = item =>
        isLoggable(item) && isNotBlacklisted(item) && doesNotExist(item)

    return items
        .filter(isWorthRemembering)
        .map(transformBrowserItemToImportItem(type))
        .reduce(
            (acc, currItem) => acc.set(encodeUrl(currItem.url), currItem),
            new Map(),
        )
}

/**
 * @param {number} [maxResults=9999999] The max amount of items to grab from browser.
 * @param {number} [startTime=0] The time to start search from for browser history.
 * @returns {Array<browser.history.HistoryItem>} All history items in browser filtered by URL.
 */
export async function getURLFilteredHistoryItems(
    maxResults = 9999999,
    startTime = 0,
) {
    const historyItems = await browser.history.search({
        text: '',
        maxResults,
        startTime,
    })
    return filterItemsByUrl(historyItems, IMPORT_TYPE.HISTORY)
}

/**
 * @param {number} [maxResults=100000] The max amount of items to grab from browser.
 * @returns {Array<browser.bookmarks.BookmarkTreeNode>} All bookmark items in browser filtered by URL.
 */
export async function getURLFilteredBookmarkItems(maxResults = 100000) {
    const bookmarkItems = await browser.bookmarks.getRecent(maxResults)
    return filterItemsByUrl(bookmarkItems, IMPORT_TYPE.BOOKMARK)
}

export async function getOldExtItems() {
    let bookmarkUrls = new Set()
    const {
        [OLD_EXT_KEYS.INDEX]: index,
        [OLD_EXT_KEYS.BOOKMARKS]: bookmarks,
        [OLD_EXT_KEYS.NUM_DONE]: numDone,
    } = await browser.storage.local.get({
        [OLD_EXT_KEYS.INDEX]: { index: [] },
        [OLD_EXT_KEYS.BOOKMARKS]: '[]',
        [OLD_EXT_KEYS.NUM_DONE]: 0,
    })

    if (typeof bookmarks === 'string') {
        try {
            bookmarkUrls = new Set(JSON.parse(bookmarks).map(bm => bm.url))
        } catch (error) {}
    }

    const transform = transformOldExtDataToImportItem(bookmarkUrls)
    const importItemsMap = new Map()

    // Only attempt page data conversion if index + bookmark storage values are correct types
    if (index && index.index instanceof Array) {
        for (const keyChunk of chunk(200)(index.index)) {
            const storageChunk = await browser.storage.local.get(keyChunk)

            keyChunk.forEach((key, i) => {
                if (storageChunk[key] == null) {
                    return
                }

                try {
                    const encodedUrl = encodeUrl(storageChunk[key].url)
                    importItemsMap.set(
                        encodedUrl,
                        transform(storageChunk[key], i),
                    )
                } catch (error) {} // Malformed URL
            })
        }
    }

    return { completedCount: numDone, importItemsMap }
}

// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(importsConnectionHandler)
