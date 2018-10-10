import storageManager, { backend } from './storex'
import { Dexie } from './types'
import { Page, Visit, Bookmark, Tag, FavIcon } from './models'

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

    return index
})()

export * from './types'
export * from './models'

export { storageManager }
export default getDb

//
// Adding stuff
//

export {
    addPage,
    addPageTerms,
    updateTimestampMeta,
    addVisit,
    addFavIcon,
} from './add'

//
// Deleting stuff

export { delPages, delPagesByDomain, delPagesByPattern } from './del'

//
// Tags-specific
//

export { addTag, delTag, fetchPageTags } from './tags'

//
// Bookmarks-specific
//

export { addBookmark, delBookmark, pageHasBookmark } from './bookmarks'

//
// Utilities
//

export { getPage, grabExistingKeys } from './util'

//
// Searching & suggesting
//

export {
    search,
    suggest,
    extendedSuggest,
    getMatchingPageCount,
    domainHasFavIcon,
} from './search'

export { createPageFromTab, createPageFromUrl } from './on-demand-indexing'
