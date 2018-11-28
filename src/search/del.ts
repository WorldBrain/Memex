import DexieOrig from 'dexie'

import { Page } from '.'
import { initErrHandler } from './storage'
import { Dexie } from './types'
import normalizeUrl from '../util/encode-url-for-id'

type QueryApplier = (
    table: DexieOrig.Table<Page, string>,
) => DexieOrig.Collection<Page, string>

const deletePages = async (applyQuery: QueryApplier, getDb: Promise<Dexie>) => {
    const db = await getDb
    return db.transaction('rw', db.tables, async () => {
        const pages = await applyQuery(db.pages).toArray()

        await Promise.all(pages.map(page => page.delete(getDb))).catch(
            initErrHandler(),
        )
    })
}

export const delPages = (getDb: Promise<Dexie>) => (urls: string[]) => {
    const normalizedUrls: string[] = urls.map(normalizeUrl as any)

    return deletePages(table => table.where('url').anyOf(normalizedUrls), getDb)
}

export const delPagesByDomain = (getDb: Promise<Dexie>) => (url: string) => {
    return deletePages(table => table.where('domain').equals(url), getDb)
}

// WARNING: Inefficient; goes through entire table
export const delPagesByPattern = (getDb: Promise<Dexie>) => (
    pattern: string | RegExp,
) => {
    const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern

    return deletePages(table => table.filter(page => re.test(page.url)), getDb)
}
