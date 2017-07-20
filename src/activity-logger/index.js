// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import randomString from 'src/util/random-string'

export const visitKeyPrefix = 'visit/'

export const visitDocsSelector = { _id: { $gte: visitKeyPrefix, $lte: `${visitKeyPrefix}\uffff` } }

export const PAUSE_STORAGE_KEY = 'is-logging-paused';

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
