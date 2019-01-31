import normalizeUrl from 'src/util/encode-url-for-id'
import { checkWithBlacklist } from 'src/blacklist/background/interface'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import DataSources from './data-sources'
import { chunk } from 'src/util/chunk'

// Binds an import type to a function that transforms a history/bookmark doc to an import item.
const deriveImportItem = type => item => ({
    browserId: item.id,
    url: item.url,
    title: item.title,
    type,
})

const deriveServicesImportItem = type => item => ({
    ...item,
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
 * @property {ItemLimits} [limits]
 * @property {DataSources} dataSources
 * @property {() => Promise<any>} [existingKeySource] Resolves to `histKeys` and `bmKeys` `Set<string>`s containing
 *  all existing history and bookmark keys to compare incoming URLs against.
 */

export default class ImportItemCreator {
    static DEF_LIMITS = {
        histLimit: Infinity,
        bmLimit: Infinity,
        servicesLimit: Infinity,
    }
    static IMPORT_LIMIT = 1000

    _dataSources: DataSources
    _existingKeys: () => Promise<{
        histKeys: Set<string>
        bmKeys: Set<string>
    }>

    _histLimit
    _bmLimit
    _servicesLimit
    _bmKeys
    _histKeys
    _completedServicesKeys
    existingDataReady
    _isBlacklisted
    _servicesData

    /**
     * @param {ItemCreatorParams} args
     */
    constructor({
        limits = ImportItemCreator.DEF_LIMITS,
        dataSources = new DataSources({}),
        existingKeySource,
    }: {
        limits?: any
        dataSources?: DataSources
        existingKeySource: () => Promise<{
            histKeys: Set<string>
            bmKeys: Set<string>
        }>
    }) {
        this.limits = limits
        this._dataSources = dataSources
        this._existingKeys = existingKeySource

        this.initData()
    }

    set limits({
        histLimit = ImportItemCreator.DEF_LIMITS.histLimit,
        bmLimit = ImportItemCreator.DEF_LIMITS.bmLimit,
        servicesLimit = ImportItemCreator.DEF_LIMITS.servicesLimit,
    }) {
        this._histLimit = histLimit
        this._bmLimit = bmLimit
        this._servicesLimit = servicesLimit
    }

    get completedBmCount() {
        return this._bmCounts
    }

    get completedHistCount() {
        return this._histCounts - this.completedBmCount
    }

    get completedServicesCount() {
        return this._completedServicesKeys.size
    }

    static _limitMap = (items, limit) => new Map([...items].slice(0, limit))

    /**
     * Sets up existing data states which are used for filtering out items.
     * @param {string} blobUrl
     * @param {any} allowTypes
     */
    async initData(blobUrl?, allowTypes?) {
        this.existingDataReady = new Promise(async (resolve, reject) => {
            try {
                this._isBlacklisted = await checkWithBlacklist()

                // Grab existing data keys from DB
                const keySets = await this._existingKeys()

                this._histCounts = keySets.histCounts._value
                this._bmCounts = keySets.bmCounts._value
                this._histKeys = keySets.histKeys
                this._bmKeys = keySets.bmKeys
                resolve()
            } catch (err) {
                reject(err)
            }
        })

        await this.existingDataReady
        this._servicesData = blobUrl
            ? await this._dataSources.parseFile(blobUrl, allowTypes)
            : []

        this._completedServicesKeys = new Set(
            this._servicesData
                .filter(item => this._histKeys.has(normalizeUrl(item.url)))
                .map(item => item.url),
        )
    }

    /**
     *
     * Performs all needed filtering on a collection of history or bookmarks
     *
     * @param {(item: any) => any} [transform=noop] Opt. transformation fn turning current item into import item structure.
     * @param {(count: number) => bool} [count] check against the maximum number of entries from the database
     * @param {(url: string) => bool} [existsSet] Opt. checker function to check against existing data.
     * @return {(items: BrowserItem[]) => Map<string, any>} Function that filters array of browser items into a Map of encoded URL strings to import items. (return type)
     */
    _filterItemsByUrl = (transform, count, existsSet) => items => {
        const importItems = new Map()
        const addedItems = new Set(items)
        let offset = existsSet.size

        // constantly update existing urls to remove duplicates the set
        while (offset < count) {
            for (const url of existsSet) {
                addedItems.delete(url)
            }
            existsSet = () =>
                searchIndex.grabMoreExistingKeys(
                    offset,
                    ImportItemCreator.IMPORT_LIMIT,
                )
            offset += ImportItemCreator.IMPORT_LIMIT
        }

        for (const url of addedItems.values()) {
            if (!isLoggable(url) || this._isBlacklisted(url)) {
                addedItems.delete(url)
            } else {
                importItems.set(normalizeUrl(url), transform(url))
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
                this._bmCounts,
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
                this._histCounts,
                this._histKeys,
            )

            yield* this._iterateItems(
                this._dataSources.history(),
                itemsFilter,
                this._histLimit,
                TYPE.HISTORY,
            )
        }

        if (this._servicesData && this._servicesLimit > 0) {
            const itemsFilter = this._filterItemsByUrl(
                deriveServicesImportItem(TYPE.OTHERS),
                new Set(),
            )

            yield* this._iterateItems(
                chunk(this._servicesData, 10),
                itemsFilter,
                this._servicesLimit,
                TYPE.OTHERS,
            )
        }
    }
}
