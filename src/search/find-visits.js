import update from 'lodash/fp/update'
import reverse from 'lodash/fp/reverse'
import unionBy from 'lodash/unionBy' // the fp version does not support >2 inputs (lodash issue #3025)
import sortBy from 'lodash/fp/sortBy'

import db, { normaliseFindResult, resultRowsById } from 'src/pouchdb'
import { convertVisitDocId, visitKeyPrefix, getTimestamp } from 'src/activity-logger'
import { getPages } from './find-pages'


// Nest the page docs into the visit docs, and return the latter.
async function insertPagesIntoVisits({
    visitsResult,
    pagesResult,
}) {
    // If pages are not already passed to us, get them.
    if (pagesResult === undefined) {
        // Get the page of each visit.
        const pageIds = visitsResult.rows.map(row => row.doc.page._id)
        pagesResult = await getPages({
            pageIds,
            // Assume that we always want to follow redirects.
            followRedirects: true,
        })
        // Because the results are lined up, we can use a small optimisation and
        // return directly.
        return update('rows', rows => rows.map(
            (row, i) => update('doc.page', () => pagesResult.rows[i].doc)(row)
        ))(visitsResult)
    }
    // Read each visit's doc.page._id and replace it with the specified page.
    const pagesById = resultRowsById(pagesResult)
    return update('rows', rows => rows.map(
        update('doc.page', page => pagesById[page._id].doc)
    ))(visitsResult)
}


// Find visits in the given date range (and/or up to the given limit), sorted by
// time (descending).
// If pagesResult is given, only find visits to those pages.
// XXX: If pages are redirected, only visits to the source page are found.
export async function findVisits({startDate, endDate, skip, limit, pagesResult}) {
    let selector = {
        // Constrain by id (like with startkey/endkey), both to get only the
        // visit docs, and (if needed) to filter the visits after/before a
        // given timestamp (this compares timestamps lexically, which only
        // works while they are of the same length, so we should fix this by
        // 2286).
        _id: {
            $gte: startDate !== undefined
                ? convertVisitDocId({timestamp: startDate})
                : visitKeyPrefix,
            $lte: endDate !== undefined
                ? convertVisitDocId({timestamp: endDate})
                : `${visitKeyPrefix}\uffff`,
        },
    }

    if (pagesResult) {
        // Find only the visits that contain the given pages
        const pageIds = pagesResult.rows.map(row => row.id)
        selector = {
            ...selector,
            'page._id': {$in: pageIds},
        }
    }

    let findResult = await db.find({
        selector,
        skip,
        // Sort them by time, newest first
        sort: [{'_id': 'desc'}],
        // limit, // XXX pouchdb-find seems to mess up when passing a limit...
    })
    // ...so we apply the limit ourselves.
    findResult = update('docs', docs => docs.slice(0, limit))(findResult)

    let visitsResult = normaliseFindResult(findResult)
    visitsResult = await insertPagesIntoVisits({visitsResult, pagesResult})
    return visitsResult
}

// Expand the results, adding a bit of context around each visit.
// Currently context means a few preceding and succeding visits.
export async function addVisitsContext({
    visitsResult,
    ...options
}) {
    // For each visit, get its context.
    const contextResultsP = visitsResult.rows.map(async row => {
        let contextResult = await getContextForVisit({
            visitDoc: row.doc,
            ...options,
        })
        // Mark each row as being a 'contextual result'.
        contextResult = update('rows', rows =>
            rows.map(row => ({...row, isContextualResult: true}))
        )(contextResult)
        return contextResult
    })
    const contextResults = await Promise.all(contextResultsP)

    // Insert the contexts (prequels+sequels) into the original results
    const visitsWithContextResult = update('rows', rows => {
        // Concat all results and all their contexts, but remove duplicates.
        const allRows = unionBy(
            rows,
            ...contextResults.map(result => result.rows),
            'id' // Use the visits' ids as the uniqueness criterion
        )
        // Sort them again by timestamp
        return sortBy(row => -getTimestamp(row.doc))(allRows)
    })(visitsResult)

    return visitsWithContextResult
}

async function getContextForVisit({
    visitDoc,
    maxPrecedingVisits = 2,
    maxSuccedingVisits = 2,
    maxPrecedingTime = 1000 * 60 * 20,
    maxSuccedingTime = 1000 * 60 * 20,
}) {
    const timestamp = getTimestamp(visitDoc)
    // Get preceding visits
    const prequelResultP = db.allDocs({
        include_docs: true,
        // Subtract 1ms to exclude itself (there is no include_start option).
        startkey: convertVisitDocId({timestamp: timestamp - 1}),
        endkey: convertVisitDocId({timestamp: timestamp - maxPrecedingTime}),
        descending: true,
        limit: maxPrecedingVisits,
    })
    // Get succeeding visits
    const sequelResultP = db.allDocs({
        include_docs: true,
        // Add 1ms to exclude itself (there is no include_start option).
        startkey: convertVisitDocId({timestamp: timestamp + 1}),
        endkey: convertVisitDocId({timestamp: timestamp + maxSuccedingTime}),
        limit: maxSuccedingVisits,
    })
    const prequelResult = await prequelResultP
    const sequelResult = await sequelResultP

    // Combine them as if they were one result.
    let contextResult = {
        rows: prequelResult.rows.concat(reverse(sequelResult.rows)),
    }
    // Insert pages as usual.
    contextResult = await insertPagesIntoVisits({visitsResult: contextResult})
    return contextResult
}
