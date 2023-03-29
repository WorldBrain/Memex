import chrono from 'chrono-node'

const BEFORE_REGEX = /to:[''"](.+)['"]/i
const AFTER_REGEX = /from:['"](.+)['"]/i

/**
 * @typedef QueryFilters
 * @type {Object}
 * @property {string} query The non-date-filter search terms.
 * @property {number} [from] Number of ms representing the start of filter time.
 * @property {number} [to] Number of ms representing the end of filter time.
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

    let from
    let to
    if (matchedBefore) {
        const parsedDate = chrono.parseDate(matchedBefore[1])
        to = parsedDate && parsedDate.getTime()
    }
    if (matchedAfter) {
        const parsedDate = chrono.parseDate(matchedAfter[1])
        from = parsedDate && parsedDate.getTime()
    }

    const extractedQuery = query
        .replace(BEFORE_REGEX, '')
        .replace(AFTER_REGEX, '')
        .trim()

    return {
        from,
        to,
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
export function queryFiltersDisplay({ from, to, query }) {
    let val = ''

    if (query && query.length) {
        val += 'T'
    }

    if (from) {
        val += ' SD'
    }

    if (to) {
        val += ' ED'
    }

    return val
}
