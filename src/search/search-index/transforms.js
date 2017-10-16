import { convertMetaDocId } from 'src/activity-logger'
import pipeline from './pipeline'
import { getLatestMeta, extractTerms, keyGen } from './util'

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
export const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

// Groups input docs into standard index doc structure
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
