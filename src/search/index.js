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
    includeContext = false,
}) {
    if (query === '') {
        return findVisits({startDate, endDate, limit, skipUntil})
    } else {
        // Process visits batch by batch, filtering for ones that match the
        // query until we reach the requested limit or have exhausted all
        // of them.

        let rows = []
        let visitsExhausted = false
        // Number of visits we process at a time (rather arbitrary)
        const batchSize = limit * 10
        do {
            let batch = await findVisits({
                startDate,
                endDate,
                limit: batchSize,
                skipUntil,
            })
            const batchRows = batch.rows

            // Check if we reached the bottom.
            visitsExhausted = batchRows.length < batchSize

            // Next batch (or next invocation), start from the last result.
            skipUntil = (batchRows.length > 0)
                ? last(batchRows).id
                : skipUntil

            // Filter for visits to pages that contain the query words.
            const hits = batchRows.filter(
                row => pageMatchesQuery({page: row.doc.page, query})
            )

            rows = rows.concat(hits)

            // If we did not have enough hits, get and filter another batch.
        } while (rows.length < limit && !visitsExhausted)

        // If too many, apply the requested limit to the number of results.
        rows = rows.slice(0, limit)

        let visitsResult = {
            rows,
            // Remember the last docId, to continue from there when more results
            // are requested.
            searchedUntil: skipUntil,
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
        .map(text => text.toLowerCase())

    // Test if every word in the query is present in at least one text field.
    const queryWords = query.toLowerCase().trim().split(/s+/)
    return queryWords.every(word =>
        texts.some(text => text.includes(word))
    )
}
