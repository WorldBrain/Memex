// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import randomString from 'src/util/random-string'

export const visitKeyPrefix = 'visit/'

export const visitDocsSelector = { _id: { $gte: visitKeyPrefix, $lte: `${visitKeyPrefix}\uffff` } }

export const PAUSE_STORAGE_KEY = 'is-logging-paused'

export function isLoggable({ url }) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    return loggableUrlPattern.test(url)
}

export const getPauseState = async () => {
    const state = (await browser.storage.local.get(PAUSE_STORAGE_KEY))[PAUSE_STORAGE_KEY]

    switch (state) {
        case 0:
        case 1: return true
        case 2:
        default: return false
    }
}

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
