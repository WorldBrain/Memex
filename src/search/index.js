import get from 'lodash/fp/get'

import { searchableTextFields } from 'src/page-analysis'

import { findVisits, addVisitsContext } from './find-visits'


// Search by keyword query, returning all docs if no query is given
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    limit = 30,
    includeContext = false,
}) {
    if (query === '') {
        return findVisits({startDate, endDate, limit})
    } else {
        // Get all visits
        let visitsResult = await findVisits({startDate, endDate})
        // Filter for visits to pages that contain the query words.
        visitsResult.rows = visitsResult.rows.filter(
            row => pageMatchesQuery({page: row.doc.page, query})
        )
        // Apply the requested limit to the number of results.
        visitsResult.rows = visitsResult.rows.slice(0, limit)

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
