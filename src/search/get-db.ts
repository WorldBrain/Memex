import initDexie from './dexie'
import { Dexie } from './types'
import { Page, Visit, Bookmark, Tag, FavIcon } from './models'

/*
 * Bit of a hack to allow the storex Dexie backend to be available to all
 * the legacy code that uses Dexie directly (i.e., all this module's exports).
 * Storex is init'd async, hence this needs to be a Promise that resolves to
 * the backend. It is resolved after storex is init'd in the BG script entrypoint.
 */
let db: Promise<Dexie>
let resolveDb: (db: Dexie) => void = null
const createNewDbPromise = () => {
    db = new Promise<Dexie>(resolve => (resolveDb = resolve))
}
createNewDbPromise()

export const setStorexBackend = backend => {
    if (!resolveDb) {
        createNewDbPromise()
    }

    // Extend the base Dexie instance with all the Memex-specific stuff we've added
    resolveDb(
        initDexie({
            backend,
            tableClasses: [
                { table: 'pages', model: Page },
                { table: 'visits', model: Visit },
                { table: 'bookmarks', model: Bookmark },
                { table: 'tags', model: Tag },
                { table: 'favIcons', model: FavIcon },
            ],
        }),
    )

    resolveDb = null
}

/**
 * WARNING: This should only ever be used by the legacy memex code which relies on Dexie.
 * Any new code should use the storex instance set up in the BG script entrypoint.
 */
const getDb = () => db

export default getDb
