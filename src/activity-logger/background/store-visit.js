import db from '../../pouchdb'
import { generateVisitDocId, generatePageDocId } from '..'

// Store the visit/page pair in PouchDB.
// Returns the generated visitId and pageId.
export default function storeVisit({timestamp, visitInfo, pageInfo}) {
    // Choose the identifier for this visit of this page.
    const visitId = generateVisitDocId({timestamp})
    // Choose the identifier for the page itself.
    const pageId = generatePageDocId({timestamp})

    const page = {
        ...pageInfo,
        _id: pageId,
    }
    const visit = {
        ...visitInfo,
        page: {_id: pageId},
        _id: visitId,
    }
    return db.bulkDocs([page, visit]).then(
        () => ({visitId, pageId})
    )
}
