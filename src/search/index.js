import get from 'lodash/fp/get'
import last from 'lodash/fp/last'

import { searchableTextFields } from 'src/page-analysis'

import { findVisits, addVisitsContext } from './find-visits'


// Search by keyword query, returning all docs if no query is given
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    skipUntil,
    limit = 10,
    maxWaitDuration = 1000,
    includeContext = false,
}) {
    if (limit <= 0) {
        return {
            rows: [],
            resultsExhausted: true,
        }
    }
    if (query === '') {
        const visitsResult = await findVisits({startDate, endDate, limit, skipUntil})
        // Note whether we reached the bottom.
        visitsResult.resultsExhausted = visitsResult.rows.length < limit
        return visitsResult
    } else {
        // Process visits batch by batch, filtering for ones that match the
        // query until we reach the requested limit or have exhausted all
        // of them.

        let rows = []
        let resultsExhausted = false
        // Number of visits we process at a time (rather arbitrary)
        const batchSize = limit * 10
        // Time when we have to report back with what we got so far, in case we keep searching.
        const reportingDeadline = Date.now() + maxWaitDuration
        do {
            let batch = await findVisits({
                startDate,
                endDate,
                limit: batchSize,
                skipUntil,
            })
            const batchRows = batch.rows

            // Check if we reached the bottom.
            resultsExhausted = batchRows.length < batchSize

            // Next batch (or next invocation), start from the last result.
            skipUntil = (batchRows.length > 0)
                ? last(batchRows).id
                : skipUntil

            // Filter for visits to pages that contain the query words.
            const hits = batchRows.filter(
                row => pageMatchesQuery({page: row.doc.page, query})
            )

            rows = rows.concat(hits)
        } while (
            // If we did not have enough hits, get and filter another batch...
            rows.length < limit && !resultsExhausted
            // ...except if we did already find something and our user may be getting impatient.
            && !(rows.length >= 1 && Date.now() > reportingDeadline)
        )

        // If too many, apply the requested limit to the number of results.
        if (rows.length > limit) {
            rows = rows.slice(0, limit)
            resultsExhausted = false
            skipUntil = last(rows).id
        }

        let visitsResult = {
            rows,
            // Remember the last docId, to continue from there when more results
            // are requested.
            searchedUntil: skipUntil,
            resultsExhausted,
        }

        if (includeContext) { visitsResult = await addVisitsContext({visitsResult}) }

        return visitsResult
    }
}

// We just use a simple literal word filter for now. No index, no ranking.
function pageMatchesQuery({page, query}) {
    // Get page text fields.
    const texts = searchableTextFields.map(fieldName => get(fieldName)(page))
        .filter(text => text) // remove undefined fields
        .map(text => text.toString().toLowerCase())

    // Test if every word in the query is present in at least one text field.
    const queryWords = query.toLowerCase().trim().split(/s+/)
    return queryWords.every(word =>
        texts.some(text => text.includes(word))
    )
}
