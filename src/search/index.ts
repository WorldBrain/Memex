import { DexieStorageBackend } from 'storex-backend-dexie'
import { Dexie } from 'src/search/types'

import initDexie from './dexie'
import { Page, Visit, Bookmark, Tag, FavIcon } from './models'
import * as addMethods from './add'
import * as delMethods from './del'
import * as tagMethods from './tags'
import * as bookmarkMethods from './bookmarks'
import * as utilMethods from './util'
import * as searchMethods from './search'
import * as onDemandMethods from './on-demand-indexing'

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

export * from './types'
export * from './models'

export default getDb
const addPage = addMethods.addPage(getDb)
const addPageTerms = addMethods.addPageTerms(getDb)
const updateTimestampMeta = addMethods.updateTimestampMeta(getDb)
const addVisit = addMethods.addVisit(getDb)
const addFavIcon = addMethods.addFavIcon(getDb)
const delPages = delMethods.delPages(getDb)
const delPagesByDomain = delMethods.delPagesByDomain(getDb)
const delPagesByPattern = delMethods.delPagesByPattern(getDb)
const dangerousPleaseBeSureDeleteAndRecreateDatabase = delMethods.dangerousPleaseBeSureDeleteAndRecreateDatabase(
    getDb,
)
const addTag = tagMethods.addTag(getDb)
const delTag = tagMethods.delTag(getDb)
const fetchPageTags = tagMethods.fetchPageTags(getDb)
const addBookmark = bookmarkMethods.addBookmark(getDb)
const delBookmark = bookmarkMethods.delBookmark(getDb)
const pageHasBookmark = bookmarkMethods.pageHasBookmark(getDb)
const getPage = utilMethods.getPage(getDb)
const grabExistingKeys = utilMethods.grabExistingKeys(getDb)
const search = searchMethods.search(getDb)
const suggest = searchMethods.suggest(getDb)
const extendedSuggest = searchMethods.extendedSuggest(getDb)
const getMatchingPageCount = searchMethods.getMatchingPageCount(getDb)
const domainHasFavIcon = searchMethods.domainHasFavIcon(getDb)
const createPageFromTab = onDemandMethods.createPageFromTab(getDb)
const createPageFromUrl = onDemandMethods.createPageFromUrl(getDb)

export {
    addPage,
    addPageTerms,
    updateTimestampMeta,
    addVisit,
    addFavIcon,
    delPages,
    delPagesByDomain,
    delPagesByPattern,
    dangerousPleaseBeSureDeleteAndRecreateDatabase,
    addTag,
    delTag,
    fetchPageTags,
    addBookmark,
    delBookmark,
    pageHasBookmark,
    getPage,
    grabExistingKeys,
    search,
    suggest,
    extendedSuggest,
    getMatchingPageCount,
    domainHasFavIcon,
    createPageFromTab,
    createPageFromUrl,
}
