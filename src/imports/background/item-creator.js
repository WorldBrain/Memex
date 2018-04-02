import normalizeUrl from 'src/util/encode-url-for-id'
import { grabExistingKeys } from 'src/search'
import { checkWithBlacklist } from 'src/blacklist/background/interface'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import DataSources from './data-sources'

// Binds an import type to a function that transforms a history/bookmark doc to an import item.
const deriveImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    type,
})

/**
 * @typedef {Object} ImportItemChunk
 * @property {string} type
 * @property {Map<string, ImportItem>} data Map of URL keys to import items.
 */

/**
 * @typedef {Object} BrowserItem
 * @property {string} id
 * @property {string} url
 */

/**
 * @typedef {Object} ItemLimits
 * @property {number} histLimit
 * @property {number} bmLimit
 */

/**
 * @typedef {Object} ItemCreatorParams
 * @property {ItemLimits} limits
 * @property {DataSources} dataSources
 * @property {() => Promise<any>} existingKeySource Resolves to `histKeys` and `bmKeys` `Set<string>`s containing
 *  all existing history and bookmark keys to compare incoming URLs against.
 */

export default class ImportItemCreator {
    static DEF_LIMITS = { histLimit: Infinity, bmLimit: Infinity }

    /**
     * @param {ItemCreatorParams} args
     */
    constructor({
        limits = ImportItemCreator.DEF_LIMITS,
        dataSources = new DataSources({}),
        existingKeySource = grabExistingKeys,
    }) {
        this.limits = limits
        this._dataSources = dataSources
        this._existingKeys = existingKeySource

        this.initData()
    }

    set limits({
        histLimit = ImportItemCreator.DEF_LIMITS.histLimit,
        bmLimit = ImportItemCreator.DEF_LIMITS.bmLimit,
    }) {
        this._histLimit = histLimit
        this._bmLimit = bmLimit
    }

    get completedBmCount() {
        return this._bmKeys.size
    }

    get completedHistCount() {
        return this._histKeys.size - this.completedBmCount
    }

    static _limitMap = (items, limit) => new Map([...items].slice(0, limit))

    /**
     * Sets up existing data states which are used for filtering out items.
     */
    async initData() {
        this.existingDataReady = new Promise(async (resolve, reject) => {
            try {
                this._isBlacklisted = await checkWithBlacklist()

                // Grab existing data keys from DB
                const keySets = await this._existingKeys()
                this._histKeys = keySets.histKeys
                this._bmKeys = keySets.bmKeys
                resolve()
            } catch (err) {
                reject(err)
            }
        })

        await this.existingDataReady
    }

    /**
    *
    * Performs all needed filtering on a collection of history or bookmarks
    *
    * @param {(item: any) => any} [transform=noop] Opt. transformformation fn turning current iterm into import item structure.
    * @param {(url: string) => bool} [alreadyExists] Opt. checker function to check against existing data.
    * @return {(items: BrowserItem[]) => Map<string, any>} Function that filters array of browser items into a Map of encoded URL strings to import items.
    */
    _filterItemsByUrl = (transform, existsSet) => items => {
        const importItems = new Map()

        for (let i = 0; i < items.length; i++) {
            // Exclude item if any of the standard checks fail
            if (!isLoggable(items[i]) || this._isBlacklisted(items[i])) {
                continue
            }

            try {
                // Asssociate the item with the encoded URL in results Map
                const url = normalizeUrl(items[i].url)

                if (!existsSet.has(url)) {
                    existsSet.add(url)
                    importItems.set(url, transform(items[i]))
                }
            } catch (err) {
                continue
            }
        }

        return importItems
    }

    /**
     * Iterates through given data source, yielding chunks of derived import items when needed.
     *
     * @param {AsyncIterable<BrowserItem[]>} itemIterator Acts as data source of history/bookmark items.
     * @param {(items: BrowserItem[]) => Map<string, any>} itemFilter Filters items from data source against existing data.
     * @param {number} limit
     * @param {string} type
     * @return {AsyncIterable<ImportItemChunk>}
     */
    async *_iterateItems(itemIterator, itemFilter, limit, type) {
        let itemCount = 0

        for await (const itemBatch of itemIterator) {
            const prevCount = itemCount
            const data = itemFilter(itemBatch)
            itemCount += data.size

            if (itemCount >= limit) {
                return yield {
                    data: ImportItemCreator._limitMap(data, limit - prevCount),
                    type,
                }
            }

            if (!data.size) {
                continue
            }

            yield { data, type }
        }
    }

    /**
     * Main interface method, allowing incremental creation of different import item types.
     *
     * @return {AsyncIterable<ImportItemChunk>}
     */
    async *createImportItems() {
        if (this._bmLimit > 0) {
            const itemsFilter = this._filterItemsByUrl(
                deriveImportItem(TYPE.BOOKMARK),
                this._bmKeys,
            )

            yield* this._iterateItems(
                this._dataSources.bookmarks(),
                itemsFilter,
                this._bmLimit,
                TYPE.BOOKMARK,
            )
        }

        if (this._histLimit > 0) {
            const itemsFilter = this._filterItemsByUrl(
                deriveImportItem(TYPE.HISTORY),
                this._histKeys,
            )

            yield* this._iterateItems(
                this._dataSources.history(),
                itemsFilter,
                this._histLimit,
                TYPE.HISTORY,
            )
        }
    }
}
