import db from '../../pouchdb'
import randomString from '../../util/random-string'
import { convertVisitDocId, convertPageDocId } from '..'

function generateVisitDocId({timestamp}) {
    return convertVisitDocId({
        timestamp: timestamp.toISOString(),
        // Add a random string to prevent accidental collisions.
        nonce: randomString(),
    })
}

function generatePageDocId({timestamp}) {
    return convertPageDocId({
        timestamp: timestamp.toISOString(),
        // Add a random string to prevent accidental collisions.
        nonce: randomString(),
    })
}

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
