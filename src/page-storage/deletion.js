import db, { fetchDocTypesByUrl } from 'src/pouchdb'
import * as index from 'src/search/search-index'
import { pageKeyPrefix } from 'src/page-storage'
import { visitKeyPrefix } from 'src/activity-logger'
import { bookmarkKeyPrefix } from 'src/bookmarks'

export default async function deleteDocsByUrl(url) {
    const fetchDocsByType = fetchDocTypesByUrl(url)

    const opts = { include_docs: false }
    const { rows: pageRows } = await fetchDocsByType(pageKeyPrefix, opts)
    const { rows: visitRows } = await fetchDocsByType(visitKeyPrefix, opts)
    const { rows: bookmarkRows } = await fetchDocsByType(bookmarkKeyPrefix, opts)

    const allRows = [...pageRows, ...visitRows, ...bookmarkRows]
    await Promise.all([
        deleteDocs(allRows),
        handleIndexDeletes(allRows),
    ])
}

export const deleteDocs = docs => db.bulkDocs(docs.map(
    row => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true,
    })
))

/**
 * Handles updating the index to remove pages and/or the visit timestamp.
 *
 * @param {any} [docsToDelete=[]] Array of docs that will be deleted from Pouch. Need to delete
 *  the page docs in here from the index.
 * @param {any} metaDoc The visit doc being deleted from Pouch. If this is not associated
 *  with any of the pages in `docsToDelete`, the corresponding index doc will be updated.
 */
export async function handleIndexDeletes(docsToDelete = [], metaDoc) {
    // Grab all page docs IDs (index indexes by page doc)
    const indexDocIds = docsToDelete
        .filter(doc => doc.id.startsWith('page/')) // Filter out visits/bookmarks
        .map(doc => doc.id)

    // If meta doc not already in pages to delete, delete it
    if (metaDoc && !indexDocIds.includes(metaDoc.page._id)) {
        if (metaDoc._id.startsWith('visit/')) {
            await index.removeVisit(metaDoc)
        } else {
            await index.removeBookmark(metaDoc)
        }
    }

    await index.del(indexDocIds)
}
