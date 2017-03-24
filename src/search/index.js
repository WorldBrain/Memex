import { getLastVisits, findVisitsToPages, addVisitsContext } from './find-visits'
import { searchPages } from './find-pages'


// Search by keyword query, returning all docs if no query is given
export async function filterVisitsByQuery({
    query,
    startDate,
    endDate,
    limit=30,
    includeContext=false,
}) {
    if (query === '') {
        return await getLastVisits({limit})
    }
    else {
        const pagesResult = await searchPages({
            query,
            limit,
            followRedirects: true,
        })

        let visitsResult = await findVisitsToPages({
            pagesResult,
            startDate,
            endDate
        })

        if (includeContext)
            visitsResult = await addVisitsContext({visitsResult})

        return visitsResult
    }
}
