import fromPairs from 'lodash/fp/fromPairs'
import update from 'lodash/fp/update'

import db from '../pouchdb'
import { visitKeyPrefix } from '../activity-logger'
import { getPages } from './find-pages'


// Get query result indexed by doc id, as an {id: row} object.
const resultsById = result =>
    fromPairs(result.rows.map(row => [(row.id || row.doc._id), row]))

// Present db.find results in the same structure as other PouchDB results.
const normaliseFindResult = result => ({
    rows: result.docs.map(doc => ({
        doc,
        id: doc._id,
        key: doc._id,
        value: {rev: doc._rev},
    }))
})

// Nest the page docs into the visit docs, and return the latter.
function insertPagesIntoVisits({visitsResult, pagesResult, presorted=false}) {
    if (presorted) {
        // A small optimisation if the results already match one to one.
        return update('rows', rows => rows.map(
            (row, i) => update('doc.page', ()=>pagesResult.rows[i].doc)(row)
        ))(visitsResult)
    }
    else {
        const pagesById = resultsById(pagesResult)
        return update('rows', rows => rows.map(
            update('doc.page', page => pagesById[page._id].doc)
        ))(visitsResult)
    }
}

// Get the most recent visits, each with the visited page already nested in it.
export function getLastVisits({
    limit
}={}) {
    return db.find({
        selector: {
            // workaround for lack of startkey/endkey support
            _id: { $gte: visitKeyPrefix, $lte: `${visitKeyPrefix}\uffff`}
        },
        sort: [{_id: 'desc'}],
        limit,
    }).then(
        normaliseFindResult
    ).then(visitsResult => {
        // Get the page of each visit.
        const pageIds = visitsResult.rows.map(row => row.doc.page._id)
        return getPages({pageIds}).then(
            // Pass on both results to the next step.
            pagesResult => ({visitsResult, pagesResult})
        )
    }).then(({visitsResult, pagesResult}) =>
        // Return each visit with te page nested at visit.page.
        insertPagesIntoVisits({visitsResult, pagesResult, presorted: true})
    )
}


// Find all visits to the given pages, return them with the pages nested.
// Resulting visits are sorted by time, descending.
export function findVisitsToPages({pagesResult}) {
    const pageIds = pagesResult.rows.map(row => row.doc._id)
    return db.find({
        // Find the visits that contain the pages
        selector: {
            'page._id': {$in: pageIds},
            // workaround for lack of startkey/endkey support
            _id: {$gte: visitKeyPrefix, $lte: `${visitKeyPrefix}\uffff`},
        },
        // Sort them by time, newest first
        sort: [{'_id': 'desc'}],
    }).then(
        normaliseFindResult
    ).then(visitsResult =>
        insertPagesIntoVisits({visitsResult, pagesResult})
    )
}
