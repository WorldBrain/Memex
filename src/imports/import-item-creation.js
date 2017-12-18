import moment from 'moment'
import chunk from 'lodash/fp/chunk'

import db from 'src/pouchdb'
import encodeUrl from 'src/util/encode-url-for-id'
import stateManager from './background/import-state'
import { pageKeyPrefix, convertPageDocId } from 'src/page-storage'
import { bookmarkKeyPrefix, convertBookmarkDocId } from 'src/bookmarks'
import { checkWithBlacklist } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE, OLD_EXT_KEYS } from 'src/options/imports/constants'

const chunkSize = 200
const lookbackWeeks = 12 // Browser history is limited to the last 3 months

// Binds old ext bookmark urls to a function that transforms old ext data to an import item
const transformOldExtDataToImportItem = bookmarkUrls => (item, index) => ({
    type: IMPORT_TYPE.OLD,
    url: item.url,
    hasBookmark: bookmarkUrls.has(item.url),
    index,
})

// Binds an import type to a function that transforms a history/bookmark doc to an import item.
const transformBrowserItemToImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    type,
})

async function checkWithExistingBookmarks() {
    const { rows: existingBmDocs } = await db.allDocs({
        startkey: bookmarkKeyPrefix,
        endkey: `${bookmarkKeyPrefix}\uffff`,
    })

    const existingUrls = new Set(
        existingBmDocs.map(row => convertBookmarkDocId(row.id).url),
    )
    return url => existingUrls.has(url)
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

    const existingUrls = new Set(
        existingPageDocs.map(row => convertPageDocId(row.id).url),
    )
    return url => existingUrls.has(url)
}

/**
 * @returns {({ url: string }) => boolean} A function affording checking of a URL against the
 *  URLs of previously error'd import items.
 */
async function checkWithErrordItems() {
    const errordUrls = new Set()

    for await (const { chunk } of stateManager.getErrItems()) {
        Object.values(chunk).forEach(item => errordUrls.add(item.url))
    }

    return ({ url }) => errordUrls.has(url)
}

// Simply hides away the the try...catch needed for the  `encodeUrl` call
//  in the hopes of a little perf. boost on older versions of V8.
const err = { value: null }
function getEncodedUrl(...args) {
    try {
        const encodedUrl = encodeUrl(...args)
        return encodedUrl
    } catch (error) {
        err.value = error
        return err
    }
}

async function initFilterItemsByUrl() {
    const isBlacklisted = await checkWithBlacklist()
    const isErrord = await checkWithErrordItems()

    /**
     * Performs all needed filtering on a collection of history, bookmark, or old ext items. As these
     * can be quite large, attemps to do in a single iteration of the input collection.
     *
     * @param {Array<any>} items Array of items with `url` to filter on.
     * @param {(item: any) => any} transform Opt. transformformation fn turning current iterm into import item structure.
     * @param {(url: string) => bool} alreadyExists Opt. checker function to check against existing data.
     * @return {Map<string, any>} Filtered version of `items` array made into a Map of encoded URL strings to import items.
     */
    return (items, transform = f => f, alreadyExists = url => false) => {
        const importItems = new Map()

        for (let i = 0; i < items.length; i++) {
            if (
                !isLoggable(items[i]) ||
                isBlacklisted(items[i]) ||
                isErrord(items[i])
            ) {
                continue
            }

            // Augment the item with encoded URL for DB check and item map
            const encodedUrl = getEncodedUrl(items[i].url, false)
            if (encodedUrl === err || alreadyExists(encodedUrl)) {
                continue
            }

            // Add to map if you got here
            importItems.set(encodedUrl, transform(items[i]))
        }

        return importItems
    }
}

/**
 * @param {moment} startTime The time to start search from for browser history.
 * @returns {Array<browser.history.HistoryItem>} All history items in browser filtered by URL.
 */
const getHistoryItems = startTime =>
    browser.history.search({
        text: '',
        maxResults: 999999,
        startTime: startTime.valueOf(),
        endTime: startTime.add(2, 'weeks').valueOf(),
    })

/**
 * Handles fetching and filtering the history URLs in time period batches.
 * @param {Function} filterItemsByUrl
 */
async function* filterHistoryItems(filterItemsByUrl) {
    const checkExistingPages = await checkWithExistingPages()
    const transformHist = transformBrowserItemToImportItem(IMPORT_TYPE.HISTORY)

    // Get all history from browser (last 3 months), filter on existing DB pages
    const startTime = moment().subtract(lookbackWeeks, 'weeks')

    // Fetch and filter history in 2 week batches to limit space
    for (let i = 0; i < lookbackWeeks / 2; i++, startTime.add(2, 'weeks')) {
        const historyItemBatch = await getHistoryItems(moment(startTime))

        yield filterItemsByUrl(
            historyItemBatch,
            transformHist,
            checkExistingPages,
        )
    }
}

/**
 * @param {number} [maxResults=100000] The max amount of items to grab from browser.
 * @returns {Array<browser.bookmarks.BookmarkTreeNode>} All bookmark items in browser filtered by URL.
 */
const getBookmarkItems = (maxResults = 100000) =>
    browser.bookmarks.getRecent(maxResults)

async function getOldExtItems() {
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
        const chunks = chunk(chunkSize)([...indexSet])
        for (let i = 0; i < chunks.length; i++) {
            const storageChunk = await browser.storage.local.get(chunks[i])

            for (let j = 0; j < chunks[i].length; j++) {
                if (storageChunk[chunks[i][j]] == null) {
                    continue
                }

                importItems.push(
                    transform(storageChunk[chunks[i][j]], i * chunkSize + j),
                )
            }
        }
    }

    return importItems
}

/**
 * @returns {any} Object containing three Maps of encoded URL keys to import item values.
 *   Used to create the imports list and estimate counts.
 */
export default async function* createImportItems() {
    const filterItemsByUrl = await initFilterItemsByUrl()

    const [bmItems, checkExistingBms] = await Promise.all([
        getBookmarkItems(),
        checkWithExistingBookmarks(),
    ])

    // Get all bookmarks from browser, filter on existing DB bookmarks
    yield {
        type: IMPORT_TYPE.BOOKMARK,
        data: filterItemsByUrl(
            bmItems,
            transformBrowserItemToImportItem(IMPORT_TYPE.BOOKMARK),
            checkExistingBms,
        ),
    }

    // Yield history items in two week chunks
    for await (const twoWeeksHistory of filterHistoryItems(filterItemsByUrl)) {
        yield { type: IMPORT_TYPE.HISTORY, data: twoWeeksHistory }
    }

    // Get all old ext from local storage, don't filter on existing data
    yield {
        type: IMPORT_TYPE.OLD,
        data: filterItemsByUrl(await getOldExtItems()),
    }
}
