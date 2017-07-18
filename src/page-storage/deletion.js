import db, { normaliseFindResult } from 'src/pouchdb'
import { findVisits } from 'src/search/find-visits'
import { bookmarkDocsSelector } from 'src/imports/background'
import { getEquivalentPages } from 'src/search/find-pages'

export async function deleteVisitAndPage({visitId, deleteAssoc = false}) {
    // Delete the visit object
    const visit = await db.get(visitId)
    const pageId = visit.page._id
    await db.remove(visit)

    // Either delete all associated docs or just try to delete page/s if orphaned
    const docs = deleteAssoc ? await getAssociatedDocs({pageId}) : await getOrphanedPageDocs({pageId})
    await deleteDocs(docs)
}

export const deleteDocs = docs => db.bulkDocs(docs.map(
    row => ({
        _id: row.id,
        _rev: row.value.rev,
        _deleted: true,
    })
))

/**
 * Get any associated visit, bookmark, and equivalent pages associated with a given page doc.
 *
 * @param {string} pageId The ID of the page doc to get.
 * @return {Array<Document>} Documents found associated with pageId.
 */
async function getAssociatedDocs({pageId}) {
    const pagesResult = await getEquivalentPages({pageId})
    const visitsResult = await findVisits({pagesResult})
    const bookmarksResult = normaliseFindResult(await db.find({
        selector: {
            ...bookmarkDocsSelector,
            'page._id': { $in: pagesResult.rows.map(row => row.id) },
        },
    }))

    return [
        ...pagesResult.rows,
        ...visitsResult.rows,
        ...bookmarksResult.rows,
    ]
}

async function getOrphanedPageDocs({pageId}) {
    // Because of deduplication, different page objects may redirect to this
    // one, or this one may redirect to others. So we check for visits either
    // referring to this page object or to any equivalent ones.
    const pagesResult = await getEquivalentPages({pageId})
    const visitsResult = await findVisits({pagesResult})
    // If there are no visits to any of them, delete all these page objects.
    // (otherwise, we leave them; it does not seem worth the effort to smartly
    // prune some orphans among them already)
    return visitsResult.rows.length === 0 ? pagesResult.rows : []
}
