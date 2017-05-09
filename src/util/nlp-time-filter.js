import chrono from 'chrono-node'

const BEFORE_REGEX = /before "(.*?)"/
const AFTER_REGEX = /after "(.*?)"/

// Takes in query as a string and extracts startDate and endDate
export default function extractTimeFiltersFromQuery(query) {
    const matchedBefore = query.match(BEFORE_REGEX)
    const matchedAfter = query.match(AFTER_REGEX)

    let startDate
    let endDate
    if (matchedBefore[1]) endDate = chrono.parseDate(matchedBefore[1]).getTime()
    if (matchedAfter[1]) startDate = chrono.parseDate(matchedAfter[1]).getTime()

    return {
        startDate,
        endDate,
    }
}
