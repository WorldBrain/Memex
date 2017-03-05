import { getLastVisits, findVisitsToPages, addVisitsContext } from './find-visits'
import { searchPages } from './find-pages'

const defaultResultLimit = 30

// Search by keyword query, returning all docs if no query is given
export function filterVisitsByQuery({query}) {
    if (query === '') {
        return getLastVisits({limit: defaultResultLimit})
    }
    else {
        return searchPages({
            query,
            limit: defaultResultLimit,
            followRedirects: true
        }).then(
            pagesResult => findVisitsToPages({pagesResult})
        ).then(
            visitsResult => addVisitsContext({visitsResult})
        )
    }
}
