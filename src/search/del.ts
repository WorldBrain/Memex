import Dexie from 'dexie'

import getDb, { Page } from '.'
import { initErrHandler } from './storage'
import normalizeUrl from '../util/encode-url-for-id'

type QueryApplier = (
    table: Dexie.Table<Page, string>,
) => Dexie.Collection<Page, string>

const deletePages = async (applyQuery: QueryApplier) => {
    const db = await getDb
    return db.transaction('rw', db.tables, async () => {
        const pages = await applyQuery(db.pages).toArray()

        await Promise.all(pages.map(page => page.delete())).catch(
            initErrHandler(),
        )
    })
}

export function delPages(urls: string[]) {
    const normalizedUrls: string[] = urls.map(normalizeUrl as any)

    return deletePages(table => table.where('url').anyOf(normalizedUrls))
}

export function delPagesByDomain(url: string) {
    return deletePages(table => table.where('domain').equals(url))
}

// WARNING: Inefficient; goes through entire table
export function delPagesByPattern(pattern: string | RegExp) {
    const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern

    return deletePages(table => table.filter(page => re.test(page.url)))
}
