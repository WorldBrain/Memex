import moment from 'moment'
import chunk from 'lodash/fp/chunk'

import encodeUrl from 'src/util/encode-url-for-id'
import { grabExistingKeys } from 'src/search'
import { checkWithBlacklist as initBlacklistCheck } from 'src/blacklist'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE, OLD_EXT_KEYS } from 'src/options/imports/constants'
import stateManager from './import-state'

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
const transformBrowserToImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    type,
})

/**
 * @returns {({ url: string }) => boolean} A function affording checking of a URL against the
 *  URLs of previously error'd import items.
 */
async function initErrordItemsCheck() {
    const errordUrls = new Set()

    for await (const { chunk } of stateManager.getErrItems()) {
        Object.values(chunk).forEach(item => errordUrls.add(item.url))
    }

    return ({ url }) => errordUrls.has(url)
}
export default class ImportItemCreator {
    constructor(histKeysSet, bmKeysSet) {
        this.dataSourcesReady = new Promise((resolve, reject) =>
            this._initExistingChecks()
                .then(resolve)
                .catch(reject),
        )
    }

    async _initExistingChecks() {
        this.isBlacklisted = await initBlacklistCheck()
        this.isPrevErrord = await initErrordItemsCheck()

        // Grab existing data keys from DB
        const keySets = await grabExistingKeys()
        this.histKeys = keySets.histKeys
        this.bmKeys = keySets.bmKeys
    }

    /**
    *
    * Performs all needed filtering on a collection of history, bookmark, or old ext items. As these
    * can be quite large, attemps to do in a single iteration of the input collection.
    *
    * @param {Array<any>} items Array of items with `url` to filter on.
    * @param {(item: any) => any} transform Opt. transformformation fn turning current iterm into import item structure.
    * @param {(url: string) => bool} alreadyExists Opt. checker function to check against existing data.
    * @return {Map<string, any>} Filtered version of `items` array made into a Map of encoded URL strings to import items.
    */
    _filterItemsByUrl(items, transform = f => f, alreadyExists = url => false) {
        const importItems = new Map()

        for (let i = 0; i < items.length; i++) {
            if (
                !isLoggable(items[i]) ||
                this.isBlacklisted(items[i]) ||
                this.isPrevErrord(items[i])
            ) {
                continue
            }

            // Augment the item with encoded URL for DB check and item map
            try {
                const encodedUrl = encodeUrl(items[i].url, true)

                if (!alreadyExists(encodedUrl)) {
                    importItems.set(encodedUrl, transform(items[i]))
                }
            } catch (err) {
                continue
            }
        }

        return importItems
    }

    /**
     * @param {moment} startTime The time to start search from for browser history.
     * @returns {Array<browser.history.HistoryItem>} All history items in browser filtered by URL.
     */
    _fetchHistItems = startTime =>
        browser.history.search({
            text: '',
            maxResults: 999999,
            startTime: startTime.valueOf(),
            endTime: startTime.add(2, 'weeks').valueOf(),
        })

    /**
     * @param {number} [maxResults=100000] The max amount of items to grab from browser.
     * @returns {Array<browser.bookmarks.BookmarkTreeNode>} All bookmark items in browser filtered by URL.
     */
    _fetchBmItems = (maxResults = 100000) =>
        browser.bookmarks.getRecent(maxResults)

    async _getOldExtItems() {
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
                        transform(
                            storageChunk[chunks[i][j]],
                            i * chunkSize + j,
                        ),
                    )
                }
            }
        }

        return this._filterItemsByUrl(importItems)
    }

    async _getBmItems() {
        return this._filterItemsByUrl(
            await this._fetchBmItems(),
            transformBrowserToImportItem(IMPORT_TYPE.BOOKMARK),
            url => this.bmKeys.has(url),
        )
    }

    /**
     * Handles fetching and filtering the history URLs in time period batches,
     * yielding those batches.
     */
    async *_iterateHistItems() {
        const transform = transformBrowserToImportItem(IMPORT_TYPE.HISTORY)
        const exists = url => this.histKeys.has(url)
        // Get all history from browser (last 3 months), filter on existing DB pages
        const startTime = moment().subtract(lookbackWeeks, 'weeks')

        // Fetch and filter history in 2 week batches to limit space
        for (let i = 0; i < lookbackWeeks / 2; i++, startTime.add(2, 'weeks')) {
            const historyItemBatch = await this._fetchHistItems(
                moment(startTime),
            )

            yield this._filterItemsByUrl(historyItemBatch, transform, exists)
        }
    }

    /**
     * Main interface method, allowing incremental creation of different import item types.
     *
     * @generator
     * @yields {any} Object containing `type` and `data` keys, with string and
     *  `Map<string, ImportItem>` types, respectively.
     */
    async *createImportItems() {
        // Get all bookmarks from browser, filter on existing DB bookmarks
        yield {
            type: IMPORT_TYPE.BOOKMARK,
            data: await this._getBmItems(),
        }

        // Get all old ext from local storage, don't filter on existing data
        yield {
            type: IMPORT_TYPE.OLD,
            data: await this._getOldExtItems(),
        }

        // Yield history items in two week chunks
        for await (const twoWeeksHistory of this._iterateHistItems()) {
            yield { type: IMPORT_TYPE.HISTORY, data: twoWeeksHistory }
        }
    }
}
