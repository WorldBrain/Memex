import db from '.'
import normalizeUrl from 'src/util/encode-url-for-id'

export async function getPage(url) {
    const page = await db.pages.get(normalizeUrl(url))

    if (page != null) {
        // Force-load any related records from other tables
        await page.loadRels()
    }

    return page
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
