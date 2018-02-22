import Storage from './storage'
import pipeline from './pipeline'
import QueryBuilder from '../query-builder'

const db = new Storage()
export default db

//
// Adding stuff
//

export async function addPage(...args) {
    return pipeline(...args).then(entry => db.addPage(entry))
}

export async function addPageTerms(...args) {}

export async function updateTimestampMeta(...args) {}

//
// Deleting stuff
//
export async function delPages(...args) {}

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

export async function suggest(...args) {}

export const indexQueue = { clear() {} }
