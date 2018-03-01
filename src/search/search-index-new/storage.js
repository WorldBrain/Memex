import Dexie from 'dexie'

import { Page, Visit, Bookmark, Tag } from './models'

/**
 * @typedef {Array} PageEntry
 * @property {any} 0 Page data object - needs `url` string and `terms` array.
 * @property {number[]} 1 Opt. times to create Visits for. Uses calling time if none defined.
 * @property {number} 2 Opt. time to create a Bookmark for.
 */
export default class Storage extends Dexie {
    static DEF_PARAMS = {
        indexedDB: null,
        IDBKeyRange: null,
        dbName: 'memex',
    }
    static MIN_STR = ''
    static MAX_STR = String.fromCharCode(65535)

    /**
     * @type {Dexie.Table} Represents page data - our main data type.
     */
    pages

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    visits

    /**
     * @type {Dexie.Table} Represents page visit timestamp and activity data.
     */
    bookmarks

    /**
     * @type {Dexie.Table} Represents tags associated with Pages.
     */
    tags

    constructor({ indexedDB, IDBKeyRange, dbName } = Storage.DEF_PARAMS) {
        super(dbName, {
            indexedDB: indexedDB || window.indexedDB,
            IDBKeyRange: IDBKeyRange || window.IDBKeyRange,
        })

        this._initSchema()
    }

    /**
     * See docs for explanation of Dexie table schema syntax:
     * http://dexie.org/docs/Version/Version.stores()
     */
    _initSchema() {
        this.version(1).stores({
            pages: 'url, *terms, *titleTerms, *urlTerms, domain',
            visits: '[time+url], url',
            bookmarks: 'url',
            tags: '[name+url], name, url',
        })

        // ... add versions/migration logic here

        // Set up model classes
        this.pages.mapToClass(Page)
        this.visits.mapToClass(Visit)
        this.bookmarks.mapToClass(Bookmark)
        this.tags.mapToClass(Tag)
    }

    /**
     * Performs async clearing of each table in succession (may just `Promise.all` this).
     *
     * @return {Promise<void>}
     */
    async clearData() {
        for (const table of this.tables) {
            await table.clear()
        }
    }

    /**
     * Used as a helper to shape the search results for the current UI's expected result shape.
     *
     * @param {any[]} results Results array returned from `_search` method.
     * @return {any[]} Array corresponding to input `results` with all needed display data attached.
     */
    async _getResultsForDisplay(results) {
        const resultUrls = results.map(([url]) => url)
        // Grab all the Pages needed for results
        const pages = await this.pages
            .where('url')
            .anyOf(resultUrls)
            .toArray()

        // Grab assoc. tags for all pages + create a Map of URLs => tags name array for easy lookup
        const tags = await this.tags
            .where('url')
            .anyOf(resultUrls)
            .toArray()

        const pageTagsMap = new Map()
        for (const { name, url } of tags) {
            const tags = pageTagsMap.get(url) || []
            pageTagsMap.set(url, [...tags, name])
        }

        const displayPages = new Map()
        for (const page of pages) {
            await page.loadRels()

            // Only keep around the data needed for display
            displayPages.set(page.url, {
                url: page.fullUrl,
                title: page.fullTitle,
                hasBookmark: page.hasBookmark,
                displayTime: page.latest,
                tags: pageTagsMap.get(page.url) || [],
                screenshot: page.screenshotURI,
                favIcon: page.favIconURI,
            })
        }

        // Return display page data in order of input results
        return results.map(([url]) => displayPages.get(url))
    }

    /**
     * @param {any[]} resultEntries Map entries (2-el KVP arrays) of URL keys to latest times
     * @param {number} [args.skip=0]
     * @param {number} [args.limit=10]
     * @return {any[]} Sorted and trimmed version of `resultEntries` input.
     */
    _paginate(resultEntries, { skip = 0, limit = 10 }) {
        return resultEntries
            .sort(([, a], [, b]) => b - a)
            .slice(skip, skip + limit)
    }

    /**
     * Goes through visits index by most recent and groups by URL, mapping URLs to latest
     * visit times.
     *
     * TODO: Better pagination; probably no need to go back every time when just changing pages.
     *   Maybe look into memoization or caching.
     *
     * @param {number} [args.startTime=0] Lower-bound for visit time.
     * @param {number} [args.endTime=Date.now()] Upper-bound for visit time.
     * @param {number} [args.skip=0]
     * @param {number} [args.limit=10]
     * @return {Map<string, number>} Map of URL keys to latest visit time numbers. Should be size <= skip + limit.
     */
    async _getLatestVisitsByUrl(
        { startTime = 0, endTime = Date.now(), skip = 0, limit = 10 },
        shallowLookback = false,
    ) {
        const latestVisitsByUrl = new Map()

        let visitColl = this.visits
            .where('[time+url]')
            .between([startTime, Storage.MIN_STR], [endTime, Storage.MAX_STR])
            .reverse() // Go through visits by most recent

        // Blank search can be a bit faster as we don't need to intersected Pages to meet result limit
        if (shallowLookback) {
            visitColl = visitColl.until(
                () => latestVisitsByUrl.size > skip + limit,
            )
        }

        await visitColl.eachPrimaryKey(([time, url]) => {
            // Only ever record the first (latest) visit for each URL
            if (!latestVisitsByUrl.get(url)) {
                latestVisitsByUrl.set(url, time)
            }
        })

        return latestVisitsByUrl
    }

    /**
     * Runs for blank terms searches.
     */
    async _blankSearch({
        domains = [], // TODO: support these
        bookmarks = false,
        ...params
    }) {
        const latestVisitsByUrl = await this._getLatestVisitsByUrl(params, true)

        return this._paginate([...latestVisitsByUrl], params)
    }

    /**
     * @param {string} [args.query=''] Terms search query.
     * @param {boolean} [args.bookmarks=false] Whether or not to filter by bookmarked pages only.
     * @return {Promise<[number, string][]>} Ordered array of result KVPs of latest visit timestamps to page URLs.
     */
    async _search({
        queryTerms = [],
        domains = [],
        bookmarks = false,
        tags = [],
        ...params
    }) {
        const domainsSet = new Set(domains)

        // Fetch all latest visits in time range, grouped by URL
        const latestVisitsByUrl = await this._getLatestVisitsByUrl(params)

        // Fetch all pages with terms matching query (TODO: make it AND the queryTerms set)
        let matchingPageUrls = await this.pages
            .where('titleTerms')
            .anyOf(queryTerms)
            .distinct()
            .or('urlTerms')
            .anyOf(queryTerms)
            .distinct()
            .or('terms')
            .anyOf(queryTerms)
            .distinct()
            // Filter matching pages down by domains, if specified + visit results
            .filter(page => {
                if (domainsSet.size > 0 && !domainsSet.has(page.domain)) {
                    return false
                }

                return latestVisitsByUrl.has(page.url)
            })
            .primaryKeys()

        // Further filter down by bookmarks, if specified
        if (bookmarks) {
            matchingPageUrls = await this.bookmarks
                .where('url')
                .anyOf(matchingPageUrls)
                .primaryKeys()
        }

        // Further filter down by tags, if specified
        if (tags.length) {
            const matchingTags = await this.tags
                .where('name')
                .anyOf(tags)
                .primaryKeys()

            const matchingTagUrls = new Set(
                matchingTags.map(([name, url]) => url),
            )

            matchingPageUrls = matchingPageUrls.filter(url =>
                matchingTagUrls.has(url),
            )
        }

        // Paginate
        return this._paginate(
            matchingPageUrls.map(url => [url, latestVisitsByUrl.get(url)]),
            params,
        )
    }

    search(params) {
        return this.transaction('r', this.tables, async () => {
            console.log('QUERY:', params)

            console.time('search')
            let results = !params.queryTerms.length
                ? await this._blankSearch(params)
                : await this._search(params)
            console.timeEnd('search')

            console.log(results)
            console.time('search result mapping')
            results = await this._getResultsForDisplay(results)
            console.timeEnd('search result mapping')

            return results
        })
    }
}
