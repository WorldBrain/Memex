import update from 'lodash/fp/update'

import db, { normaliseFindResult, resultRowsById } from 'src/pouchdb'
import { convertVisitDocId, visitKeyPrefix } from 'src/activity-logger'
import { getPages } from './find-pages'

// Nest the page docs into the visit docs, and return the latter.
async function insertPagesIntoVisits({ visitsResult, pagesResult }) {
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
        return update('rows', rows =>
            rows.map((row, i) =>
                update('doc.page', () => pagesResult.rows[i].doc)(row),
            ),
        )(visitsResult)
    }
    // Read each visit's doc.page._id and replace it with the specified page.
    const pagesById = resultRowsById(pagesResult)
    return update('rows', rows =>
        rows.map(update('doc.page', page => pagesById[page._id].doc)),
    )(visitsResult)
}

// Find visits in the given date range (and/or up to the given limit), sorted by
// time (descending).
// If pagesResult is given, only find visits to those pages.
// XXX: If pages are redirected, only visits to the source page are found.
export async function findVisits({
    startDate,
    endDate,
    limit,
    pagesResult,
    skipUntil,
}) {
    let selector = {
        // Constrain by id (like with startkey/endkey), both to get only the
        // visit docs, and (if needed) to filter the visits after/before a
        // given timestamp (this compares timestamps lexically, which only
        // works while they are of the same length, so we should fix this by
        // 2286).
        _id: {
            $gte:
                startDate !== undefined
                    ? convertVisitDocId({ timestamp: startDate })
                    : visitKeyPrefix,
            $lte:
                endDate !== undefined
                    ? convertVisitDocId({ timestamp: endDate })
                    : `${visitKeyPrefix}\uffff`,
            $lt: skipUntil,
        },
    }

    if (pagesResult) {
        // Find only the visits that contain the given pages
        const pageIds = pagesResult.rows.map(row => row.id)
        selector = {
            ...selector,
            'page._id': { $in: pageIds },
        }
    }

    let findResult = await db.find({
        selector,
        // Sort them by time, newest first
        sort: [{ _id: 'desc' }],
        // limit, // XXX pouchdb-find seems to mess up when passing a limit...
    })
    // ...so we apply the limit ourselves.
    findResult = update('docs', docs => docs.slice(0, limit))(findResult)

    let visitsResult = normaliseFindResult(findResult)
    visitsResult = await insertPagesIntoVisits({ visitsResult, pagesResult })
    return visitsResult
}
