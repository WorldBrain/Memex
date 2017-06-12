import { findVisits, addVisitsContext } from './find-visits'
import { searchPages } from './find-pages'

// Search by keyword query, returning all docs if no query is given
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    skip = 0,
    limit = 30,
    includeContext = false,
}) {
    if (query === '') {
        return await findVisits({startDate, endDate, skip, limit})
    } else {
        const pagesResult = await searchPages({
            query,
            limit,
            skip,
            followRedirects: true,
        })

        let visitsResult = await findVisits({
            pagesResult,
            startDate,
            endDate,
        })

        if (includeContext) { visitsResult = await addVisitsContext({visitsResult}) }

        return visitsResult
    }
}
