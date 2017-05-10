import chrono from 'chrono-node'

const BEFORE_REGEX = /before "(.*?)"/
const AFTER_REGEX = /after "(.*?)"/

// Takes in query as a string and extracts startDate and endDate
export default function extractTimeFiltersFromQuery(query) {
    const matchedBefore = query.match(BEFORE_REGEX)
    const matchedAfter = query.match(AFTER_REGEX)

    let startDate
    let endDate
    if (matchedBefore && matchedBefore[1]) endDate = chrono.parseDate(matchedBefore[1]).getTime()
    if (matchedAfter && matchedAfter[1]) startDate = chrono.parseDate(matchedAfter[1]).getTime()

    // Checks which comes first before/after and based on that decide where query should be sliced
    const firstIndexOfTimeFilter = Math.min(
        matchedBefore ? matchedBefore.index : query.length,
        matchedAfter ? matchedAfter.index : query.length,
    )
    const extractedQuery = query.substring(0, firstIndexOfTimeFilter)

    return {
        startDate,
        endDate,
        extractedQuery,
    }
}
