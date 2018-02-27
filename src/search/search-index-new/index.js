import normalizeUrl from 'src/util/encode-url-for-id'
import Storage from './storage'
import { Page } from './models'
import pipeline from './pipeline'
import QueryBuilder from '../query-builder'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import analysePage from 'src/page-analysis/background'

// Create main singleton to interact with DB in the ext
const db = new Storage()
export default db

//
// Adding stuff
//

export async function addPage(pipelineReq) {
    return pipeline(pipelineReq).then(entry => db.addPage(entry))
}

export async function addPageTerms(pipelineReq) {
    return pipeline(pipelineReq).then(
        ([{ url, terms, text }]) =>
            console.log(`adding ${terms.length} terms to page: ${url}`) ||
            db.pages.update(url, { terms, text }),
    )
}

export async function updateTimestampMeta(...args) {
    return db.updateVisitInteractionData(...args)
}

export const addVisit = (url, time = Date.now()) => db.addVisit({ url, time })

//
// Deleting stuff
//
export async function delPages(urls) {
    const normalized = urls.map(normalizeUrl)
    const pages = await db.pages
        .where('url')
        .anyOf(normalized)
        .toArray()

    for (const page of pages) {
        await page.delete()
    }
}

export async function delPagesByDomain(url) {
    const normalized = normalizeUrl(url)
    const pages = await db.pages
        .where('url')
        .startsWith(normalized)
        .toArray()

    for (const page of pages) {
        await page.delete()
    }
}

// WARNING: Inefficient; goes through entire table
export async function delPagesByPattern(pattern) {
    const re = new RegExp(pattern, 'i')
    const pages = await db.pages.filter(page => re.test(page.url)).toArray()

    for (const page of pages) {
        await page.delete()
    }
}

//
// Tags
//
const modifyTag = shouldAdd =>
    async function(url, tag) {
        const normalized = normalizeUrl(url)
        const page = await db.pages.get(normalized)

        if (page == null) {
            throw new Error('Page does not exist for provided URL:', normalized)
        }

        await page.loadRels()

        if (shouldAdd) {
            page.addTag(tag)
        } else {
            page.delTag(tag)
        }

        await page.save()
    }
export const delTag = modifyTag(false)
export const addTag = modifyTag(true)

//
// Bookmarks
//
export async function addBookmark({ url, timestamp = Date.now(), tabId }) {
    const normalized = normalizeUrl(url)
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
}

export async function delBookmark({ url }) {
    const normalized = normalizeUrl(url)
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
}

/**
 * Handles the browser `bookmarks.onCreated` event:
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/bookmarks/onCreated
 */
export async function handleBookmarkCreation(browserId, { url }) {
    const normalized = normalizeUrl(url)
    let page = await db.pages.get(normalized)

    // No existing page for BM; need to make new from a remote DOM fetch
    if (page == null) {
        const fetch = fetchPageData({
            url,
            opts: { includePageContent: true, includeFavIcon: true },
        })

        // TODO: handle favicon
        const { content } = await fetch.run()
        const [pageDoc] = await pipeline({ pageDoc: { content, url } })

        page = new Page(pageDoc)
    }

    await page.loadRels()
    page.setBookmark()
    await page.save()
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
    const qb = new QueryBuilder().searchTerm(query).get()

    const docs = await db.search({
        queryTerms: [...qb.query],
        bookmarks: showOnlyBookmarks,
        ...params,
    })

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
