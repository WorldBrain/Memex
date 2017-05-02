import { findVisits, addVisitsContext } from './find-visits'
import { searchPages } from './find-pages'

// Search by keyword query, returning all docs if no query is given
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    limit = 20,
    includeContext = false,
}) {
    if (query === '') {
        const test = await findVisits({startDate, endDate, limit})
        return test
    } else {
        const pagesResult = await searchPages({
            query,
            limit,
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
