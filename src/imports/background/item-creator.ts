import normalizeUrl from 'src/util/encode-url-for-id'
import { checkWithBlacklist } from 'src/blacklist/background/interface'
import { isLoggable } from 'src/activity-logger'
import { IMPORT_TYPE as TYPE } from 'src/options/imports/constants'
import DataSources from './data-sources'
import { chunk } from 'src/util/chunk'
import { ExistingSets } from './types'

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
    static EXISTING_ITEM_BATCH_SIZE = 1000

    _dataSources: DataSources
    private _existingKeys: (
        args: { limit: number; offset: number },
    ) => Promise<ExistingSets>
    private _existingKeyCounts: () => Promise<{
        histCount: number
        bmCount: number
    }>

    private _completedServicesCount: number
    private _histCount: number
    private _bmCount: number
    private _servicesData: any[]
    _histLimit
    _bmLimit
    _servicesLimit
    existingDataReady
    _isBlacklisted

    /**
     * @param {ItemCreatorParams} args
     */
    constructor({
        limits = ImportItemCreator.DEF_LIMITS,
        dataSources = new DataSources({}),
        existingKeySource,
        existingKeyCounts,
    }: {
        limits?: any
        dataSources?: DataSources
        existingKeySource: (
            args: { limit: number; offset: number },
        ) => Promise<ExistingSets>
        existingKeyCounts: () => Promise<{ histCount: number; bmCount: number }>
    }) {
        this.limits = limits
        this._dataSources = dataSources
        this._existingKeys = existingKeySource
        this._existingKeyCounts = existingKeyCounts

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
        return this._bmCount
    }

    get completedHistCount() {
        return this._histCount - this.completedBmCount
    }

    get completedServicesCount() {
        return this._completedServicesCount
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
                const keySets = await this._existingKeyCounts()

                this._histCount = keySets.histCount
                this._bmCount = keySets.bmCount
                resolve()
            } catch (err) {
                reject(err)
            }
        })

        await this.existingDataReady
        this._servicesData = blobUrl
            ? await this._dataSources.parseFile(blobUrl, allowTypes)
            : []

        await this.calculateCompletedServicesCount()
    }

    private async calculateCompletedServicesCount() {
        this._completedServicesCount = 0

        for (
            let offset = 0;
            offset < this._histCount;
            offset += ImportItemCreator.EXISTING_ITEM_BATCH_SIZE
        ) {
            const existingSet = (await this._existingKeys({
                limit: ImportItemCreator.EXISTING_ITEM_BATCH_SIZE,
                offset,
            })).histKeys

            this._completedServicesCount += this._servicesData.filter(item =>
                existingSet.has(normalizeUrl(item.url)),
            ).length
        }
    }

    /**
     * Performs all needed filtering on a collection of history or bookmarks
     */
    _filterItemsByUrl = (args: {
        transform: (item: any) => any
        totalCount: number
        existingSetSelector: (sets: ExistingSets) => Set<string>
    }) => async (items: any[]): Promise<Map<string, any>> => {
        const importItems = new Map<string, any>()

        for (
            let offset = 0;
            offset < args.totalCount;
            offset += ImportItemCreator.EXISTING_ITEM_BATCH_SIZE
        ) {
            const existsSet = args.existingSetSelector(
                await this._existingKeys({
                    limit: ImportItemCreator.EXISTING_ITEM_BATCH_SIZE,
                    offset,
                }),
            )

            for (const item of items) {
                const { url } = item
                if (!isLoggable({ url }) || this._isBlacklisted({ url })) {
                    continue
                }

                try {
                    const normalized = normalizeUrl(url)

                    if (!existsSet.has(normalized)) {
                        importItems.set(normalized, args.transform(item))
                    }
                } catch (err) {
                    continue
                }
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
            const data = await itemFilter(itemBatch)
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
            const itemsFilter = this._filterItemsByUrl({
                transform: deriveImportItem(TYPE.BOOKMARK),
                totalCount: this._bmCount,
                existingSetSelector: sets => sets.bmKeys,
            })

            yield* this._iterateItems(
                this._dataSources.bookmarks(),
                itemsFilter,
                this._bmLimit,
                TYPE.BOOKMARK,
            )
        }

        if (this._histLimit > 0) {
            const itemsFilter = this._filterItemsByUrl({
                transform: deriveImportItem(TYPE.HISTORY),
                totalCount: this._histCount,
                existingSetSelector: sets => sets.histKeys,
            })

            yield* this._iterateItems(
                this._dataSources.history(),
                itemsFilter,
                this._histLimit,
                TYPE.HISTORY,
            )
        }

        if (this._servicesData && this._servicesLimit > 0) {
            const itemsFilter = items => {
                const importItems = new Map()
                for (const item of items) {
                    importItems.set(
                        item,
                        deriveServicesImportItem(TYPE.OTHERS)(item),
                    )
                }
                return importItems
            }

            yield* this._iterateItems(
                chunk(this._servicesData, 10),
                itemsFilter,
                this._servicesLimit,
                TYPE.OTHERS,
            )
        }
    }
}
