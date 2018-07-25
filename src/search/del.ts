import Dexie from 'dexie'

import db, { Page } from '.'
import normalizeUrl from '../util/encode-url-for-id'

type QueryApplier = (table: typeof db.pages) => Dexie.Collection<Page, string>

const deletePages = (applyQuery: QueryApplier) =>
    db.transaction('rw', db.tables, async () => {
        const pages = await applyQuery(db.pages).toArray()

        await Promise.all(pages.map(page => page.delete()))
    })

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
