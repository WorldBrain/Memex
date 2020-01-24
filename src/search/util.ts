import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { DexieUtilsPlugin } from './plugins/dexie-utils'
import { DBGet } from './types'
import { Page } from './models'
import { initErrHandler } from './storage'

export const DEFAULT_TERM_SEPARATOR = /[|\u{A0}' .,|(\n)]+/u
export const URL_SEPARATOR = /[/?#=+& _.,\-|(\n)]+/

export const collections = (db: Storex) => Object.keys(db.registry.collections)

export const getPage = (getDb: DBGet) => async (url: string) => {
    const db = await getDb()
    const page = await db
        .collection('pages')
        .findOneObject<Page>({ url: normalizeUrl(url) })
        .catch(initErrHandler())

    if (page == null) {
        return null
    }
    const result = new Page(db, page)
    await result.loadRels()
    return result
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
