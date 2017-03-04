import fromPairs from 'lodash/fp/fromPairs'
import update from 'lodash/fp/update'
import reverse from 'lodash/fp/reverse'
import unionBy from 'lodash/unionBy' // the fp version does not support >2 inputs (lodash issue #3025)
import sortBy from 'lodash/fp/sortBy'

import db, { normaliseFindResult, resultRowsById }  from '../pouchdb'
import { convertVisitDocId, visitKeyPrefix, getTimestamp } from '../activity-logger'
import { getPages } from './find-pages'


// Nest the page docs into the visit docs, and return the latter.
function insertPagesIntoVisits({visitsResult, pagesResult, presorted=false}) {
    // If pages are not already passed to us, get them and call ourselves again.
    if (pagesResult === undefined) {
        // Get the page of each visit.
        const pageIds = visitsResult.rows.map(row => row.doc.page._id)
        return getPages({pageIds}).then(pagesResult =>
            // Invoke ourselves with the found pages.
            insertPagesIntoVisits({visitsResult, pagesResult, presorted: true})
        )
    }

    if (presorted) {
        // A small optimisation if the results already match one to one.
        return update('rows', rows => rows.map(
            (row, i) => update('doc.page', ()=>pagesResult.rows[i].doc)(row)
        ))(visitsResult)
    }
    else {
        // Read each visit's doc.page._id and replace it with the specified page.
        const pagesById = resultRowsById(pagesResult)
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
    ).then(
        visitsResult => insertPagesIntoVisits({visitsResult})
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

// Expand the results, adding a bit of context around each visit.
// Currently context means a few preceding and succeding visits.
export function addVisitsContext({
    visitsResult,
    maxPrecedingVisits=2,
    maxSuccedingVisits=2,
    maxPrecedingTime = 1000*60*20,
    maxSuccedingTime = 1000*60*20,
}) {
    // For each visit, get its context.
    const promises = visitsResult.rows.map(row => {
        const timestamp = getTimestamp(row.doc)
        // Get preceding visits
        return db.allDocs({
            include_docs: true,
            // Subtract 1ms to exclude itself (there is no include_start option).
            startkey: convertVisitDocId({timestamp: timestamp-1}),
            endkey: convertVisitDocId({timestamp: timestamp-maxPrecedingTime}),
            descending: true,
            limit: maxPrecedingVisits,
        }).then(prequelResult => {
            // Get succeeding visits
            return db.allDocs({
                include_docs: true,
                // Add 1ms to exclude itself (there is no include_start option).
                startkey: convertVisitDocId({timestamp: timestamp+1}),
                endkey: convertVisitDocId({timestamp: timestamp+maxSuccedingTime}),
                limit: maxSuccedingVisits,
            }).then(sequelResult => {
                // Combine them as if they were one result.
                return {
                    rows: prequelResult.rows.concat(reverse(sequelResult.rows))
                }
            })
        }).then(contextResult =>
            // Insert pages as usual.
            insertPagesIntoVisits({visitsResult: contextResult})
        ).then(
            // Mark each row as being a 'contextual result'.
            update('rows', rows =>
                rows.map(row => ({...row, isContextualResult: true}))
            )
        )
    })
    // When the context of each visit has been retrieved, merge and return them.
    return Promise.all(promises).then(contextResults =>
        // Insert the contexts (prequels+sequels) into the original results
        update('rows', rows => {
            // Concat all results and all their contexts, but remove duplicates.
            const allRows = unionBy(
                rows,
                ...contextResults.map(result => result.rows),
                'doc._id' // Use the id as uniqueness criterion
            )
            // Sort them again by timestamp
            return sortBy(row => -getTimestamp(row.doc))(allRows)
        })(visitsResult)
    )
}
