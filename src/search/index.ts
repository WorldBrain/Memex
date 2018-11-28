import DexieOrig from 'dexie'

import storageManager, { backend } from './storex'
import { Dexie } from './types'
import { Page, Visit, Bookmark, Tag, FavIcon } from './models'
import * as addMethods from './add'
import * as delMethods from './del'
import * as tagMethods from './tags'
import * as bookmarkMethods from './bookmarks'
import * as utilMethods from './util'
import * as searchMethods from './search'
import * as onDemandMethods from './on-demand-indexing'

// This code allows the `getDb` Promise to delay resolution until
//   the `initStorageManager` function is invoked. This is currently
//   needed to make sure the init code that runs inside `getDb` init
//   logic waits until all the `FeatureStorage` backends have a chance
//   to register their collections with storex.
//   TODO: more sane solution
let resolveFeaturesReady = () => undefined
const featuresReady = new Promise(resolve => (resolveFeaturesReady = resolve))

export const initStorageManager = () => {
    resolveFeaturesReady()
}

const getDb = (async () => {
    // TODO: move these declarations to own feature storage classes
    storageManager.registry.registerCollections({
        pages: {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                fullUrl: { type: 'text' },
                fullTitle: { type: 'text' },
                text: { type: 'text' },
                domain: { type: 'string' },
                hostname: { type: 'string' },
                screenshot: { type: 'media' },
                lang: { type: 'string' },
                canonicalUrl: { type: 'url' },
                description: { type: 'text' },
            },
            indices: [
                { field: 'url', pk: true },
                { field: 'text', fullTextIndexName: 'terms' },
                { field: 'fullTitle', fullTextIndexName: 'titleTerms' },
                { field: 'fullUrl', fullTextIndexName: 'urlTerms' },
                { field: 'domain' },
                { field: 'hostname' },
            ],
        },
        visits: {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                time: { type: 'timestamp' },
                duration: { type: 'int' },
                scrollMaxPerc: { type: 'float' },
                scrollMaxPx: { type: 'float' },
                scrollPerc: { type: 'float' },
                scrollPx: { type: 'float' },
            },
            indices: [{ field: ['time', 'url'], pk: true }, { field: 'url' }],
        },
        bookmarks: {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                time: { type: 'timestamp' },
            },
            indices: [{ field: 'url', pk: true }, { field: 'time' }],
        },
        tags: {
            version: new Date(2018, 1, 1),
            fields: {
                url: { type: 'string' },
                name: { type: 'string' },
            },
            indices: [
                { field: ['name', 'url'], pk: true },
                { field: 'name' },
                { field: 'url' },
            ],
        },
        favIcons: {
            version: new Date(2018, 1, 1),
            fields: {
                hostname: { type: 'string' },
                favIcon: { type: 'media' },
            },
            indices: [{ field: 'hostname', pk: true }],
        },
    })

    await featuresReady
    await storageManager.finishInitialization()

    // Set up model classes
    const index = backend['dexie'] as Dexie
    index.pages.mapToClass(Page)
    index.visits.mapToClass(Visit)
    index.bookmarks.mapToClass(Bookmark)
    index.tags.mapToClass(Tag)
    index.favIcons.mapToClass(FavIcon)

    /**
     * Overrides `Dexie._createTransaction` to ensure to add `backupChanges` table to any readwrite transaction.
     * This allows us to avoid specifying this table on every single transaction to allow table hooks to write to
     * our change tracking table.
     *
     * TODO: Add clause to condition to check if backups is enabled
     *  (no reason to add this table to all transactions if backups is off)
     */
    index['_createTransaction'] =
        process.env.NODE_ENV === 'test'
            ? index['_createTransaction']
            : DexieOrig.override(
                  index['_createTransaction'],
                  origFn => (mode: string, tables: string[], ...args) => {
                      if (
                          mode === 'readwrite' &&
                          !tables.includes('backupChanges')
                      ) {
                          tables = [...tables, 'backupChanges']
                      }
                      return origFn.call(index, mode, tables, ...args)
                  },
              )

    return index
})()

export * from './types'
export * from './models'

export { storageManager }
export default getDb
const addPage = addMethods.addPage(getDb)
const addPageTerms = addMethods.addPageTerms(getDb)
const updateTimestampMeta = addMethods.updateTimestampMeta(getDb)
const addVisit = addMethods.addVisit(getDb)
const addFavIcon = addMethods.addFavIcon(getDb)
const delPages = delMethods.delPages(getDb)
const delPagesByDomain = delMethods.delPagesByDomain(getDb)
const delPagesByPattern = delMethods.delPagesByPattern(getDb)
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
