import normalizeUrl from 'src/util/encode-url-for-id'
import Storage from './storage'
import { Page } from './models'
import pipeline from './pipeline'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import QueryBuilder from 'src/search/query-builder'
import analysePage from 'src/page-analysis/background'
import fullSearch from './search'

/**
 * @typedef {Object} VisitInteraction
 * @property {number} duration Time user was active during visit (ms).
 * @property {number} scrollPx Y-axis pixel scrolled to at point in time.
 * @property {number} scrollPerc
 * @property {number} scrollMaxPx Furthest y-axis pixel scrolled to during visit.
 * @property {number} scrollMaxPerc
 */

/**
 * @typedef {Object} PageAddRequest
 * @property {any} pageData TODO: type
 * @property {number[]} [visits=[]] Opt. visit times to assoc. with Page.
 * @property {number} [bookmark] Opt. bookmark time to assoc. with Page.
 */

// Create main singleton to interact with DB in the ext
const db = new Storage()
export { Storage }
export default db

//
// Adding stuff
//

/**
 * Adds/updates a page + associated visit (pages never exist without either an assoc.
 *  visit or bookmark in current model).
 *
 * @param {PageAddReq} req
 * @return {Promise<void>}
 */
export async function addPage({ visits = [], bookmark, ...pipelineReq }) {
    const pageData = await pipeline(pipelineReq)

    return db
        .transaction('rw', db.tables, async () => {
            const page = new Page(pageData)
            // Load any current assoc. data for this page
            await page.loadRels()

            // If no meta event times supplied, create a new Visit for now
            const shouldCreateVisit = !visits.length && bookmark == null

            // Create Visits for each specified time, or a single Visit for "now" if no assoc event
            visits = shouldCreateVisit ? [Date.now()] : visits
            visits.forEach(time => page.addVisit(time))

            // Create bookmark, if given
            if (bookmark != null) {
                page.setBookmark(bookmark)
            }

            // Persist current state
            await page.save()
            console.log('added:', page)
        })
        .catch(console.error)
}

/**
 * @param {PageAddReq} req
 * @return {Promise<void>}
 */
export async function addPageTerms(req) {
    const { url, terms, text } = await pipeline(req)

    return db.transaction('rw', db.pages, async () => {
        await db.pages.update(url, { terms, text })

        console.log(`added ${terms.length} terms to page: ${url}`)
    })
}

/**
 * Updates an existing specified visit with interactions data.
 *
 * @param {string} url The URL of the visit to get.
 * @param {string|number} time
 * @param {VisitInteraction} data
 * @return {Promise<void>}
 */
export async function updateTimestampMeta(url, time, data) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.visits, () =>
        db.visits
            .where('[time+url]')
            .equals([time, normalized])
            .modify(data),
    )
}

export async function addVisit(url, time = Date.now()) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        const matchingPage = await db.pages.get(normalized)
        if (matchingPage == null) {
            throw new Error(
                `Cannot add visit for non-existent page: ${normalized}`,
            )
        }

        await matchingPage.loadRels()
        matchingPage.addVisit(time)
        return await matchingPage.save()
    })
}

//
// Deleting stuff
export function delPages(urls) {
    const normalized = urls.map(normalizeUrl)

    return deletePages(pageTable => pageTable.where('url').anyOf(normalized))
}

export function delPagesByDomain(url) {
    const normalized = normalizeUrl(url)

    return deletePages(table => table.where('url').startsWith(normalized))
}

// WARNING: Inefficient; goes through entire table
export function delPagesByPattern(pattern) {
    const re = new RegExp(pattern, 'i')

    return deletePages(table => table.filter(page => re.test(page.url)))
}

const deletePages = applyQuery =>
    db.transaction('rw', db.tables, async () => {
        const pages = await applyQuery(db.pages).toArray()

        for (const page of pages) {
            await page.delete()
        }
    })

//
// Tags
//
const modifyTag = shouldAdd =>
    function(url, tag) {
        const normalized = normalizeUrl(url)

        return db.transaction('rw', db.tables, async () => {
            const page = await db.pages.get(normalized)

            if (page == null) {
                throw new Error(
                    'Page does not exist for provided URL:',
                    normalized,
                )
            }

            await page.loadRels()

            if (shouldAdd) {
                page.addTag(tag)
            } else {
                page.delTag(tag)
            }

            return await page.save()
        })
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)

//
// Bookmarks
//
export function addBookmark({ url, timestamp = Date.now(), tabId }) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        let page = await db.pages.get(normalized)

        // No existing page for BM; need to make new via content-script if `tabId` provided
        if (page == null) {
            if (tabId == null) {
                throw new Error(
                    'Page does not exist for URL and no tabID provided to extract content:',
                    normalized,
                )
            }

            // TODO: handle screenshot, favicon
            const { content } = await analysePage({ tabId })
            const [pageDoc] = await pipeline({ pageDoc: { content, url } })
            page = new Page(pageDoc)
        }

        await page.loadRels()
        page.setBookmark()
        await page.save()
    })
}

export function delBookmark({ url }) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        const page = await db.pages.get(normalized)

        if (page != null) {
            await page.loadRels()
            page.delBookmark()

            // Delete if Page left orphaned, else just save current state
            if (page.shouldDelete) {
                await page.delete()
            } else {
                await page.save()
            }
        }
    })
}

/**
 * Handles the browser `bookmarks.onCreated` event:
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/bookmarks/onCreated
 */
export async function handleBookmarkCreation(browserId, { url }) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        let page = await db.pages.get(normalized)

        // No existing page for BM; need to make new from a remote DOM fetch
        if (page == null) {
            const fetch = fetchPageData({
                url,
                opts: { includePageContent: true, includeFavIcon: true },
            })

            const pageData = await fetch.run()
            const [pageDoc] = await pipeline({ pageDoc: { url, ...pageData } })

            page = new Page(pageDoc)
        }

        await page.loadRels()
        page.setBookmark()
        await page.save()
    })
}

//
// Utilities
//
export function initSingleLookup() {
    return async function(...args) {}
}

export const getPage = url => db.pages.get(normalizeUrl(url))

/**
 * Hardcoded replacement for now.
 *
 * TODO: Maybe overhaul `import-item-creation` module to not need this (only caller)
 */
export async function grabExistingKeys(...args) {
    return db.transaction('r', db.pages, db.bookmarks, async () => ({
        histKeys: new Set(await db.pages.toCollection().primaryKeys()),
        bmKeys: new Set(await db.bookmarks.toCollection().primaryKeys()),
    }))
}

//
// Searching & suggesting
//

export async function search({ query, showOnlyBookmarks, ...params }) {
    // Extract query terms via QueryBuilder (may change)
    const qb = new QueryBuilder().searchTerm(query).get()

    const docs = await db.transaction('r', db.tables, () =>
        fullSearch({
            queryTerms: [...qb.query],
            bookmarks: showOnlyBookmarks,
            ...params,
        }),
    )

    return {
        docs,
        resultsExhausted: docs.length < params.limit,
        totalCount: docs.length,
        isBadTerm: qb.isBadTerm,
    }
}

// WARNING: Inefficient; goes through entire table
export async function getMatchingPageCount(pattern) {
    const re = new RegExp(pattern, 'i')
    return await db.pages.filter(page => re.test(page.url)).count()
}

export async function suggest(query = '', type, limit = 10) {
    // Start building the WhereClause from appropriate table
    const whereClause = (() => {
        switch (type) {
            case 'domain':
                return db.pages.where('domain')
            case 'tag':
            default:
                return db.tags.where('name')
        }
    })()

    // Perform suggestion matching
    return await whereClause
        .startsWith(query)
        .limit(limit)
        .uniqueKeys()
}

export const indexQueue = { clear() {} }
