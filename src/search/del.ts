import { Page } from '.'
import { initErrHandler } from './storage'
import { collections } from './util'
import { DBGet } from './types'
import normalizeUrl from '../util/encode-url-for-id'
import { DexieUtilsPlugin } from './plugins/dexie-utils'

const deletePages = async (getDb: DBGet, query: object) => {
    const db = await getDb()
    const pages = await db.collection('pages').findObjects<Page>(query)

    return Promise.all(pages.map(page => new Page(db, page).delete())).catch(
        initErrHandler(),
    )
}

export const delPages = (getDb: DBGet) => (urls: string[]) => {
    const normalizedUrls: string[] = urls.map(normalizeUrl as any)

    return deletePages(getDb, { url: { $in: normalizedUrls } })
}

export const delPagesByDomain = (getDb: DBGet) => (url: string) => {
    return deletePages(getDb, { domain: url })
}

// WARNING: Inefficient; goes through entire table
export const delPagesByPattern = (getDb: DBGet) => async (
    pattern: string | RegExp,
) => {
    const db = await getDb()
    return db.operation(DexieUtilsPlugin.REGEXP_DELETE_OP, {
        collection: 'pages',
        fieldName: 'url',
        pattern,
    })
}

export const dangerousPleaseBeSureDeleteAndRecreateDatabase = (
    getDb: DBGet,
) => async () => {
    const db = await getDb()
    return db.operation(DexieUtilsPlugin.NUKE_DB_OP)
}
