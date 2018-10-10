import getDb from '.'
import normalizeUrl from '../util/encode-url-for-id'
import { initErrHandler } from './storage'

export const DEFAULT_TERM_SEPARATOR = /[|\u{A0}' .,|(\n)]+/u
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

export async function getPage(url: string) {
    const db = await getDb
    const page = await db.pages.get(normalizeUrl(url)).catch(initErrHandler())

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
export async function grabExistingKeys() {
    const db = await getDb
    return db
        .transaction('r', db.pages, db.bookmarks, async () => ({
            histKeys: new Set(await db.pages.toCollection().primaryKeys()),
            bmKeys: new Set(await db.bookmarks.toCollection().primaryKeys()),
        }))
        .catch(initErrHandler({ histKeys: new Set(), bmKeys: new Set() }))
}

/**
 * Handles splitting up searchable content into indexable terms. Terms are all
 * lowercased.
 *
 * @param {string} content Searchable content text.
 * @param {string|RegExp} [separator=' '] Separator used to split content into terms.
 * @returns {string[]} Array of terms derived from `content`.
 */
export const extractContent = (
    content,
    { separator = DEFAULT_TERM_SEPARATOR },
) =>
    content
        .split(separator)
        .map(word => word.toLowerCase())
        .filter(term => term.length)
