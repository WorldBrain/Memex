import Dexie from 'dexie'

import { Page, Visit, Bookmark } from './models'

/**
 * @typedef {Object} VisitInteraction
 * @property {number} duration Time user was active during visit (ms).
 * @property {number} scrollPx Y-axis pixel scrolled to at point in time.
 * @property {number} scrollPerc
 * @property {number} scrollMaxPx Furthest y-axis pixel scrolled to during visit.
 * @property {number} scrollMaxPerc
 */

/**
 * @typedef {Array} PageEntry
 * @property {any} 0 Page data object - needs `url` string and `terms` array.
 * @property {number[]} 1 Opt. times to create Visits for. Uses calling time if none defined.
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
            pages: 'url, *terms, *titleTerms, *urlTerms',
            visits: '[time+url], url',
            bookmarks: 'url, time',
        })

        // ... add versions/migration logic here

        // Set up model classes
        this.pages.mapToClass(Page)
        this.visits.mapToClass(Visit)
        this.bookmarks.mapToClass(Bookmark)
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
     * Adds/updates a page + associated visit (pages never exist without either an assoc.
     *  visit or bookmark in current model).
     *
     * @param {PageEntry} pageEntry
     * @return {Promise<void>}
     */
    async addPage([pageData, times]) {
        const page = new Page(pageData)

        // Load any current assoc. data for this page
        await page.loadRels(this)

        // Create Visits for each specified time, or a single Visit for "now"
        const visitTimes = times == null || !times.length ? [Date.now()] : times
        visitTimes.forEach(time => page.addVisit(time))

        // Persist current state
        await page.save(this)
        console.log('added:', page)
    }

    /**
     * @param {PageEntry[]} pageEntries
     * @return {Promise<void>}
     */
    async addPages(pageEntries) {
        for (const pageEntry of pageEntries) {
            await this.addPage(pageEntry)
        }
    }

    /**
     * Handles adding a new bookmark for a given URL/page. If `pageData` is supplied and there is
     * no pre-existing page for `url`, a new unvisited page is created along with the bookmark.
     *
     * @param {string} args.url
     * @param {number} [args.time=Date.now()]
     * @param {any} [pageData] Supply if
     * @return {Promise<void>}
     */
    async addBookmark({ url, time = Date.now(), pageData }) {
        const matchingPage = await this.pages.where({ url }).first()

        // Base case; page exists, so just add bookmark and update
        if (matchingPage != null) {
            await matchingPage.loadRels(this)
            matchingPage.setBookmark(time)
            return matchingPage.save(this)
        }

        // Edge case: Page doesn't exist, try to create new one from supplied data
        if (pageData == null) {
            throw new Error(
                'Bookmarked URL has no matching page stored, and no page data was supplied',
            )
        }

        const page = new Page(pageData)
        page.setBookmark(time)
        await page.save()
    }

    /**
     * @param {string} args.url
     * @return {Promise<void>}
     */
    async delBookmark({ url }) {
        const matchingPage = await this.pages.where({ url }).first()

        if (matchingPage != null) {
            await matchingPage.loadRels(this)
            matchingPage.delBookmark()
            await matchingPage.save(this)
        }
    }

    /**
     * Updates an existing specified visit with interactions data.
     *
     * @param {string} url The URL of the visit to get.
     * @param {string|number} time
     * @param {VisitInteraction} data
     * @return {Promise<void>}
     */
    updateVisitInteractionData(url, time, data) {
        return this.transaction('rw', this.visits, () =>
            this.visits
                .where('[url+time]')
                .equals([url, time])
                .modify(data),
        )
    }

    /**
     * Used as a helper to shape the search results for the current UI's expected result shape.
     *
     * @param {any[]} results Results array returned from `_search` method.
     * @return {any[]} Array corresponding to input `results` with all needed display data attached.
     */
    async _getResultsForDisplay(results) {
        // Grab all the Pages needed for results
        const pages = await this.pages
            .where('url')
            .anyOf(results.map(([_, url]) => url))
            .toArray()

        const displayPages = new Map()
        for (const page of pages) {
            await page.loadRels(this)

            // Only keep around the data needed for display
            displayPages.set(page.url, {
                url: page.fullUrl,
                title: page.fullTitle,
                hasBookmark: page.hasBookmark,
                displayTime: page.latestVisitTime,
                tags: [], // TODO: tags data model
            })
        }

        // Return display page data in order of input results
        return results.map(([_, url]) => displayPages.get(url))
    }

    /**
     * @param {string} [args.query=''] Terms search query.
     * @param {number} [args.startTime=0] Lower-bound for visit time.
     * @param {number} [args.endTime=Date.now()] Upper-bound for visit time.
     * @param {number} [args.skip=0]
     * @param {number} [args.limit=10]
     * @param {boolean} [args.bookmarks=false] Whether or not to filter by bookmarked pages only.
     * @return {Promise<[number, string][]>} Ordered array of result KVPs of latest visit timestamps to page URLs.
     */
    _search({
        queryTerms = [],
        startTime = 0,
        endTime = Date.now(),
        domains = [],
        skip = 0,
        limit = 10,
        bookmarks = false,
    }) {
        return this.transaction(
            'r',
            this.pages,
            this.visits,
            this.bookmarks,
            async () => {
                const domainsSet = new Set(domains)

                // Fetch all latest visits in time range, grouped by URL
                const latestVisitByUrl = new Map()
                await this.visits
                    .where('[time+url]')
                    .between(
                        [startTime, Storage.MIN_STR],
                        [endTime, Storage.MAX_STR],
                    )
                    .reverse() // Go through visits by most recent
                    .eachPrimaryKey(([time, url]) => {
                        // Only ever record the first (latest) visit for each URL
                        if (!latestVisitByUrl.get(url)) {
                            latestVisitByUrl.set(url, time)
                        }
                    })

                // Fetch all pages with terms matching query
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
                        if (
                            domainsSet.size > 0 &&
                            !domainsSet.has(page.domain)
                        ) {
                            return false
                        }

                        return latestVisitByUrl.has(page.url)
                    })
                    .primaryKeys()

                // Further filter down by bookmarks, if specified
                if (bookmarks) {
                    matchingPageUrls = await this.bookmarks
                        .where('url')
                        .anyOf(matchingPageUrls)
                        .primaryKeys()
                }

                // Paginate
                return matchingPageUrls
                    .map(url => [latestVisitByUrl.get(url), url])
                    .sort(([a], [b]) => b - a)
                    .slice(skip, skip + limit)
            },
        )
    }

    async search(params) {
        console.log('QUERY:', params)

        console.time('search')
        let results = await this._search(params)
        console.timeEnd('search')

        console.time('search result mapping')
        results = await this._getResultsForDisplay(results)
        console.timeEnd('search result mapping')

        return results
    }
}
