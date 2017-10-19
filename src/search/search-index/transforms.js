import { convertMetaDocId } from 'src/activity-logger'
import pipeline from './pipeline'
import { getLatestMeta, extractTerms, keyGen } from './util'

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
export const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

/**
 * @typedef IndexLookupDoc
 * @type {Object}
 * @property {string} latest Latest visit/bookmark timestamp time for easy scoring.
 * @property {string} type Enum of either 'bookmark' or 'visit'.
 * @property {Set} terms Set of searchable terms extracted from page content.
 * @property {Set} visits Set of visit index doc IDs, extracted from visit docs.
 * @property {Set} bookmarks Set of bookmark index doc IDs, extracted from bookmark docs.
 */

/**
 * @param {string|RegExp} termSeparator Separator to split terms on.
 * @returns {(req: IndexRequest) => IndexLookupDoc} Function taking Pouch page, bookmark, and visit docs,
 *  returning doc structured for indexing.
 */
export const transformPageAndMetaDocs = termSeparator => ({
    pageDoc,
    visitDocs = [],
    bookmarkDocs = [],
}) => {
    const visits = visitDocs.map(transformMetaDoc)
    const bookmarks = bookmarkDocs.map(transformMetaDoc)

    const processedPageDoc = pipeline(pageDoc)

    return {
        ...processedPageDoc,
        ...getLatestMeta(visits, bookmarks),
        terms: new Set(extractTerms(processedPageDoc.content, termSeparator)),
        visits: new Set(visits.map(keyGen.visit)),
        bookmarks: new Set(bookmarks.map(keyGen.bookmark)),
    }
}
