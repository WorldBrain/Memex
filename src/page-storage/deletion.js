import db from 'src/pouchdb'
import { findVisits } from 'src/search/find-visits'
import { getEquivalentPages } from 'src/search/find-pages'

export async function deleteVisitAndPage({visitId}) {
    // Delete the visit object
    const visit = await db.get(visitId)
    const pageId = visit.page._id
    await db.remove(visit)

    // If this was the only visit linking to the page, also remove the page.
    // (a simple choice for now; this behaviour may be changed in the future)
    await deletePageIfOrphaned({pageId})
}

async function deletePageIfOrphaned({pageId}) {
    // Because of deduplication, different page objects may redirect to this
    // one, or this one may redirect to others. So we check for visits either
    // referring to this page object or to any equivalent ones.
    const pagesResult = await getEquivalentPages({pageId})
    const visitsResult = await findVisits({pagesResult})
    // If there are no visits to any of them, delete all these page objects.
    // (otherwise, we leave them; it does not seem worth the effort to smartly
    // prune some orphans among them already)
    if (visitsResult.rows.length === 0) {
        await db.bulkDocs(pagesResult.rows.map(
            row => ({
                _id: row.id,
                _rev: row.value.rev,
                _deleted: true,
            })
        ))
    }
}
