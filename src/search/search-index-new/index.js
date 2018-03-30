import normalizeUrl from 'src/util/encode-url-for-id'
import Storage from './storage'
import pipeline from './pipeline'
import QueryBuilder from '../query-builder'

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
export async function setTags(...args) {}

export async function addTags(...args) {}

export async function delTags(...args) {}

export async function fetchTags(...args) {}

//
// Bookmarks
//
export async function addBookmark(...args) {}

export async function createBookmarkByUrl(...args) {}

export async function createNewPageForBookmark(...args) {}

export async function removeBookmarkByUrl(...args) {}

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

export async function suggest(...args) {}

export const indexQueue = { clear() {} }
