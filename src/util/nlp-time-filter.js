import chrono from 'chrono-node'

const BEFORE_REGEX = /before:[''"](.+)['"]/i
const AFTER_REGEX = /after:['"](.+)['"]/i

/**
 * @typedef QueryFilters
 * @type {Object}
 * @property {string} query The non-date-filter search terms.
 * @property {number} [startDate] Number of ms representing the start of filter time.
 * @property {number} [endDate] Number of ms representing the end of filter time.
 */

/**
 * Takes in query as a string and extracts startDate, endDate, and query parts.
 *
 * @param {string} query The query string that user has entered.
 * @returns {QueryFilters} The extracted query parameters.
 */
export default function extractTimeFiltersFromQuery(query) {
    const matchedBefore = query.match(BEFORE_REGEX)
    const matchedAfter = query.match(AFTER_REGEX)

    let startDate
    let endDate
    if (matchedBefore) {
        const parsedDate = chrono.parseDate(matchedBefore[1])
        endDate = parsedDate && parsedDate.getTime()
    }
    if (matchedAfter) {
        const parsedDate = chrono.parseDate(matchedAfter[1])
        startDate = parsedDate && parsedDate.getTime()
    }

    const extractedQuery = query
        .replace(BEFORE_REGEX, '')
        .replace(AFTER_REGEX, '')
        .trim()

    return {
        startDate,
        endDate,
        query: extractedQuery,
    }
}

/**
 * Utility function which runs on the output of `extractTimeFiltersFromQuery` and returns the values for
 * display. Now only used for analytics.
 *
 * @param {QueryFilters} The extracted query parameters.
 * @returns {string}
 */
export function queryFiltersDisplay({ startDate, endDate, query }) {
    let val = ''

    if (query && query.length) {
        val += 'T'
    }

    if (startDate) {
        val += ' SD'
    }

    if (endDate) {
        val += ' ED'
    }

    return val
}
