import chunk from 'lodash/fp/chunk'

import db from 'src/pouchdb'
import encodeUrl from 'src/util/encode-url-for-id'
import { pageKeyPrefix, generatePageDocId } from 'src/page-storage'
import { checkWithBlacklist } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
import {
    IMPORT_TYPE,
    OLD_EXT_KEYS,
    DEF_ALLOW,
} from 'src/options/imports/constants'

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

const transformToImportItemMap = items =>
    items.reduce(
        (acc, currItem) => acc.set(encodeUrl(currItem.url), currItem),
        new Map(),
    )

/**
 * Handles performing blacklist and pending import filtering logic on any type
 * of items containing a `url` field.
 *
 * @param {Array<any>} browserItems Some Iterable of items of any shape, as long as they contain `url` field.
 * @returns {Array<any>} Filtered version of the items arg.
 */
async function initFilterItemsByUrl() {
    const isNotBlacklisted = await checkWithBlacklist()
    const doesNotExist = await checkWithExistingDocs()

    const isWorthRemembering = item =>
        isLoggable(item) && isNotBlacklisted(item) && doesNotExist(item)

    return browserItems => browserItems.filter(isWorthRemembering)
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

export default async function createImportItems(allowTypes = DEF_ALLOW) {
    const filterItemsByUrl = await initFilterItemsByUrl()

    console.time('hist')
    const historyItems = allowTypes[IMPORT_TYPE.HISTORY]
        ? await getHistoryItems()
        : []
    console.timeEnd('hist')
    console.time('bm')
    const bookmarkItems = allowTypes[IMPORT_TYPE.BOOKMARK]
        ? await getBookmarkItems()
        : []
    console.timeEnd('bm')
    console.time('old')
    const oldExtItems = allowTypes[IMPORT_TYPE.OLD]
        ? await getOldExtItems()
        : []
    console.timeEnd('old')

    return {
        historyItemsMap: transformToImportItemMap(
            filterItemsByUrl(historyItems).map(
                transformBrowserItemToImportItem(IMPORT_TYPE.HISTORY),
            ),
        ),
        bookmarkItemsMap: transformToImportItemMap(
            filterItemsByUrl(bookmarkItems).map(
                transformBrowserItemToImportItem(IMPORT_TYPE.BOOKMARK),
            ),
        ),
        oldExtItemsMap: transformToImportItemMap(filterItemsByUrl(oldExtItems)),
    }
}
