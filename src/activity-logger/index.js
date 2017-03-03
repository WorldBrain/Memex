// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import randomString from '../util/random-string'

export const visitKeyPrefix = 'visit/'
export const pageKeyPrefix = 'page/'

// Creates an _id string given the variables, or vice versa parses such strings
// We simply use the creation time for the id, for easy chronological sorting.
// We add a random string we call a 'nonce' to prevent accidental collisions.
export const convertVisitDocId = docuri.route(`${visitKeyPrefix}:timestamp/:nonce`)
export const convertPageDocId = docuri.route(`${pageKeyPrefix}:timestamp/:nonce`)

const convertAnyTimestampedDocId = docuri.route(':type/:timestamp/:nonce')
export const getTimestamp = doc =>
    Number.parseInt(convertAnyTimestampedDocId(doc._id).timestamp)

export function generateVisitDocId({timestamp, nonce}={}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertVisitDocId({
        timestamp: date.getTime(),
        nonce: nonce || randomString(),
    })
}

export function generatePageDocId({timestamp, nonce}={}) {
    const date = timestamp ? new Date(timestamp) : new Date()
    return convertPageDocId({
        timestamp: date.getTime(),
        nonce: nonce || randomString(),
    })
}

// Decide whether to remember or ignore a visited page.
export function isWorthRemembering({url}) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    return loggableUrlPattern.test(url)
}
