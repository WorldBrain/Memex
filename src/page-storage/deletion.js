import db from 'src/pouchdb'
import * as index from 'src/search/search-index'


export async function deleteMetaAndPage({ metaDoc, deleteAssoc = false }) {
    // Delete the meta doc
    // const metaDoc = await db.get(metaDoc._id)
    const pageId = metaDoc.page._id
    await db.remove(metaDoc)

    const docs = await getAssociatedDocs(pageId)
    handleIndexDeletes(docs, metaDoc)
    await deleteDocs(docs)
}

export const deleteDocs = docs => db.bulkDocs(docs.map(
    row => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true,
    })
))

async function getAllAssoc(pageId, metaType) {
    const prefix = pageId.replace('page', metaType)
    const { rows } = await db.allDocs({ startkey: prefix, endkey: `${prefix}\uffff` })
    return rows
}

/**
 * Get any associated visit, bookmark, and equivalent pages associated with a given page doc.
 *
 * @param {string} pageId The ID of the page doc to get.
 * @return {Array<Document>} Documents found associated with pageId.
 */
async function getAssociatedDocs(pageId) {
    const pageDoc = await db.get(pageId)
    const visitDocs = await getAllAssoc(pageId, 'visit')
    const bookmarkDocs = await getAllAssoc(pageId, 'bookmark')

    return [
        pageDoc,
        ...visitDocs,
        ...bookmarkDocs,
    ]
}

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
