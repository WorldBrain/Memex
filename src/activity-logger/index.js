// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import randomString from 'src/util/random-string'

export const visitKeyPrefix = 'visit/'
export const blacklistStorageKey = 'blacklist'

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
 * Given a URL, checks the URL against the user's stored blacklist expressions to see if any
 * rule matches it.
 *
 * @param {string} url The URL to check against the blacklist.
 * @return {boolean} Denotes whether or not the given URL matches any blacklist expressions.
 */
async function isURLBlacklisted(url = '') {
    // Main checking logic between a given blacklist expression and current URL
    const doesExpressionMatchURL = (expression = '') => url.includes(expression)

    // Reduces blacklist to a bool by running main checking logic against each blacklist expression
    // (returns true if a single match is found in entire blacklist)
    const blacklistMatchesExist = (blacklist = []) => blacklist.reduce(
        (prev, curr) => doesExpressionMatchURL(curr.expression) || prev, false)

    // Do the check against blacklist stored in local storage
    const { blacklist } = await browser.storage.local.get(blacklistStorageKey)
    if (!blacklist) {
        return false // If blacklist isn't found in storage, then URL can't be considered blacklisted
    }

    // Sync parse of serialized blacklist data for programmatic use
    const blacklistArr = JSON.parse(blacklist)
    return blacklistMatchesExist(blacklistArr)
}

/**
 * Checks given URL against all "worth remembering" conditions.
 * TODO: Merge this with `isWorthRemembering`. Now keep separate since `isWorthRemembering`
 * is used in two places:
 *  - history import (synchronous context)
 *  - background page tracker (async context)
 * Access to the blacklist is done async, but the way history is filtered uses a synchronous filter.
 * Need to do an async filter to be able to use this correctly.
 *
 * @param {string} url The URL to check all conditions against.
 * @returns {boolean} Denotes whether or not URL should be remembered.
 */
export async function shouldRemember({url}) {
    // "worth remembering" conditions
    const isProtocolValid = isWorthRemembering({ url })
    const isNotBlacklisted = !(await isURLBlacklisted(url))

    return isProtocolValid && !isNotBlacklisted
}

// Decide whether to remember or ignore a visited page.
export function isWorthRemembering({url}) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    return loggableUrlPattern.test(url)
}
