// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import randomString from 'src/util/random-string'

export const visitKeyPrefix = 'visit/'

// Creates an _id string given the variables, or vice versa parses such strings
// We simply use the creation time for the id, for easy chronological sorting.
// We add a random string we call a 'nonce' to prevent accidental collisions.
export const convertVisitDocId = docuri.route(`${visitKeyPrefix}:timestamp/:nonce`)

const convertAnyTimestampedDocId = docuri.route(':type/:timestamp/:nonce')
export const getTimestamp = doc =>
    Number.parseInt(convertAnyTimestampedDocId(doc._id).timestamp)

export function generateVisitDocId({timestamp, nonce} = {}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertVisitDocId({
        timestamp: date.getTime(),
        nonce: nonce || randomString(),
    })
}

/**
 * Given a URL and user's blacklist, checks the URL against the blacklist expressions to see if any
 * rule matches it.
 *
 * @param {string} url The URL to check against the blacklist.
 * @param {Array<any>} blacklist Blacklist data to check URL against.
 * @return {boolean} Denotes whether or not the given URL matches any blacklist expressions.
 */
function isURLBlacklisted(url = '', blacklist = []) {
    // Main checking logic between a given blacklist expression and current URL
    //   TODO: make this more "smart" (maybe check parts of the URL instead of match all, for e.g.)
    const doesExpressionMatchURL = (expression = '') => url.includes(expression)

    // Reduces blacklist to a bool by running main checking logic against each blacklist expression
    // (returns true if a single match is found in entire blacklist)
    return blacklist.reduce((prev, curr) => doesExpressionMatchURL(curr.expression) || prev, false)
}

function isURLProtocolValid(url = '') {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    return loggableUrlPattern.test(url)
}

/**
 * Checks given URL against all "worth remembering" conditions.
 *
 * @param {string} url The URL to check all conditions against.
 * @param {Array<any>} blacklist Blacklist data to pass in to avoid expensive processing of blacklist
 *      local storage access every call
 * @returns {boolean} Denotes whether or not URL should be remembered.
 */
export function shouldBeRemembered(url = '', blacklist = []) {
    // "worth remembering" conditions
    const isProtocolValid = isURLProtocolValid(url)
    const isNotBlacklisted = !isURLBlacklisted(url, blacklist)

    return isProtocolValid && isNotBlacklisted
}
