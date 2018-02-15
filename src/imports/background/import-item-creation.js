import moment from 'moment'
import chunk from 'lodash/fp/chunk'

import encodeUrl from 'src/util/encode-url-for-id'
import { grabExistingKeys } from 'src/search'
import { blacklist } from 'src/blacklist/background'
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
    /**
     * @param {number} [histLimit=Infinity] Limit of history items to create.
     * @param {number} [bmLimit=Infinity] Limit of bookmark items to create.
     */
    constructor({ histLimit = Infinity, bmLimit = Infinity }) {
        this._histLimit = histLimit
        this._bmLimit = bmLimit

        this.dataSourcesReady = new Promise((resolve, reject) =>
            this._initExistingChecks()
                .then(resolve)
                .catch(reject),
        )
    }

    static _limitMap = (items, limit) => new Map([...items].slice(0, limit))

    async _initExistingChecks() {
        this.isBlacklisted = await blacklist.checkWithBlacklist()
        this.isPrevErrord = await initErrordItemsCheck()

        // Grab existing data keys from DB
        const keySets = await grabExistingKeys()
        this.histKeys = keySets.histKeys
        this.bmKeys = keySets.bmKeys
    }

    /**
    *
    * Performs all needed filtering on a collection of history, bookmark, or old ext items.
    *
    * @param {(item: any) => any} [transform=noop] Opt. transformformation fn turning current iterm into import item structure.
    * @param {(url: string) => bool} [alreadyExists] Opt. checker function to check against existing data.
    * @return {(items: any[]) => Map<string, any>} Function that filters array of browser items into a Map of encoded URL strings to import items.
    */
    _filterItemsByUrl = (
        transform = f => f,
        alreadyExists = url => false,
    ) => items => {
        const importItems = new Map()

        for (let i = 0; i < items.length; i++) {
            // Exclude item if any of the standard checks fail
            if (
                !isLoggable(items[i]) ||
                this.isBlacklisted(items[i]) ||
                this.isPrevErrord(items[i])
            ) {
                continue
            }

            // Asssociate the item with the encoded URL in results Map
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
     * @param {number} startTime The time to start search from for browser history.
     * @param {number} [endTime=Date.now()] The time to end search from for browser history.
     * @param {number} [limit=999999] The limit to number of items to return
     * @returns {Array<browser.history.HistoryItem>} All history items in browser.
     */
    _fetchHistItems = ({ startTime, endTime = Date.now(), limit = 999999 }) =>
        browser.history.search({
            text: '',
            maxResults: limit,
            startTime,
            endTime,
        })

    async _getOldExtItems() {
        let bookmarkUrls = new Set()
        const filterByUrl = this._filterItemsByUrl()
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

        return filterByUrl(importItems)
    }

    /**
     * Recursively traverses BFS-like from the specified node in the BookmarkTree,
     * yielding the transformed bookmark ImportItems at each dir level.
     *
     * @generator
     * @param {browser.BookmarkTreeNode} dirNode BM node representing a bookmark directory.
     * @param {(items: browser.BookmarkTreeNode[]) => Map<string, ImportItem>} filter
     * @yields {Map<string, ImportItem>} Bookmark items in current level.
     */
    async *_traverseBmTreeDir(dirNode, filter, itemCount = 0) {
        // Folders don't contain `url`; recurse!
        const children = await browser.bookmarks.getChildren(dirNode.id)

        // Split into folders and bookmarks
        const childGroups = children.reduce(
            (prev, childNode) => {
                const stateKey = !childNode.url ? 'dirs' : 'bms'

                return {
                    ...prev,
                    [stateKey]: [...prev[stateKey], childNode],
                }
            },
            { dirs: [], bms: [] },
        )

        // Filter and yield the current level of bookmarks
        const itemsMap = filter(childGroups.bms)
        const accCount = itemCount + itemsMap.size

        if (accCount >= this._bmLimit) {
            return yield ImportItemCreator._limitMap(itemsMap, this._bmLimit)
        }

        yield itemsMap

        // Recursively process next levels (not expected to get deep)
        for (const dir of childGroups.dirs) {
            yield* await this._traverseBmTreeDir(dir, filter, accCount)
        }
    }

    /**
     * @generator
     * @param {string} rootId The ID of the BookmarkTreeNode to start searching from.
     * @yields {Map<string, ImportItem>} All bookmark items in browser, indexed by encoded URL.
     */
    async *_traverseBmTree(rootId) {
        const filterByUrl = this._filterItemsByUrl(
            transformBrowserToImportItem(IMPORT_TYPE.BOOKMARK),
            url => this.bmKeys.has(url),
        )

        // Start off tree traversal from root
        yield* await this._traverseBmTreeDir({ id: rootId }, filterByUrl)
    }

    /**
     * @generator
     * Handles fetching and filtering the history URLs in time period batches,
     * yielding those batches.
     */
    async *_iterateHistItems(limit = 99999) {
        const filterByUrl = this._filterItemsByUrl(
            transformBrowserToImportItem(IMPORT_TYPE.HISTORY),
            url => this.histKeys.has(url),
        )
        // Get all history from browser (last 3 months), filter on existing DB pages
        const baseTime = moment().subtract(lookbackWeeks, 'weeks')
        let itemCount = 0

        // Fetch and filter history in week batches to limit space
        for (
            let time = moment();
            time.isAfter(baseTime);
            time.subtract(1, 'week')
        ) {
            const historyItemBatch = await this._fetchHistItems({
                startTime: moment(time)
                    .subtract(1, 'week')
                    .valueOf(),
                endTime: time.valueOf(),
            })

            const prevCount = itemCount
            const itemsMap = filterByUrl(historyItemBatch)
            itemCount += itemsMap.size

            if (itemCount >= this._histLimit) {
                yield ImportItemCreator._limitMap(
                    itemsMap,
                    this._histLimit - prevCount,
                )
                break
            }

            yield itemsMap
        }
    }

    async *_createBmItems() {
        // Chrome and FF seem to ID their bookmark data differently. Root works from '' in FF
        //  but needs '0' in Chrome. `runtime.getBrowserInfo` is only available on FF web ext API
        const rootId =
            typeof browser.runtime.getBrowserInfo === 'undefined' ? '0' : ''

        // Get all bookmarks from browser, filter on existing DB bookmarks
        for await (const bmsChunk of this._traverseBmTree(rootId)) {
            // Not all levels in the bookmark tree need to have bookmark items
            if (!bmsChunk.size) {
                continue
            }

            yield { type: IMPORT_TYPE.BOOKMARK, data: bmsChunk }
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
        if (this._bmLimit > 0) {
            yield* this._createBmItems()
        }

        // Get all old ext from local storage, don't filter on existing data
        yield {
            type: IMPORT_TYPE.OLD,
            data: await this._getOldExtItems(),
        }

        if (this._histLimit > 0) {
            // Yield history items in chunks
            for await (const histItemChunk of this._iterateHistItems()) {
                yield { type: IMPORT_TYPE.HISTORY, data: histItemChunk }
            }
        }
    }
}
