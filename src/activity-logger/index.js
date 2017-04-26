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
 * Returns a shouldBeRemembered function with blacklist data bound for use.
 * @returns {({ url: string }) => boolean} Ready-to-use shouldBeRemembered function which checks
 *  URL against blacklist data.
 */
export async function checkWithBlacklist() {
    // Fetch and parse blacklist data for page remembering decider predicate to use
    const { blacklist } = await browser.storage.local.get('blacklist')
    const blacklistArr = !blacklist ? [] : JSON.parse(blacklist)

    // Return shouldBeRemembered with blacklist data bound
    return shouldBeRemembered.bind({ blacklist: blacklistArr })
}

/**
 * Checks given URL against all "worth remembering" conditions. For further conditions,
 * bind needed data to `this`. So far can provide blacklist data at `this.blacklist` for
 * blacklist checking.
 *
 * @param {string} url The URL to check all conditions against.
 * @returns {boolean} Denotes whether or not URL should be remembered.
 */
export function shouldBeRemembered({ url = '' }) {
    // "worth remembering" conditions
    const isProtocolValid = isURLProtocolValid(url)
    // If blacklist data available, perform check, else skip this condition (set true)
    const isNotBlacklisted = !this.blacklist ? true : !isURLBlacklisted(url, this.blacklist)

    return isProtocolValid && isNotBlacklisted
}
