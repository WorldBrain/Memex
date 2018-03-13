// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'
import { normalizeAndEncode } from 'src/util/encode-url-for-id'

export const visitKeyPrefix = 'visit/'

export const visitDocsSelector = {
    _id: { $gte: visitKeyPrefix, $lte: `${visitKeyPrefix}\uffff` },
}

export const PAUSE_STORAGE_KEY = 'is-logging-paused'

export function isLoggable({ url }) {
    // Just remember http(s) pages, ignoring data uris, newtab, ...
    const loggableUrlPattern = /^https?:\/\//
    const urlEndings = ['.svg', '.jpg', '.png', '.jpeg', '.gif']

    // Ignore all pages that are image files
    for (let i = 0; i < urlEndings.length; i++) {
        if (url.endsWith(urlEndings[i])) {
            return false
        }
    }
    return loggableUrlPattern.test(url)
}

export const getPauseState = async () => {
    const state = (await browser.storage.local.get(PAUSE_STORAGE_KEY))[
        PAUSE_STORAGE_KEY
    ]

    switch (state) {
        case 0:
        case 1:
            return true
        case 2:
        default:
            return false
    }
}

// Creates an _id string given the variables, or vice versa parses such strings
// We simply use the creation time for the id, for easy chronological sorting.
// We add a random string we call a 'nonce' to prevent accidental collisions.
export const convertVisitDocId = docuri.route(
    `${visitKeyPrefix}:url/:timestamp`,
)

export const convertMetaDocId = docuri.route(':type/:url/:timestamp')

export const getTimestamp = doc =>
    Number.parseInt(convertMetaDocId(doc._id).timestamp)

// NOTE: truncates any decimal part of the `timestamp` arg
export const generateVisitDocId = ({ url, timestamp = Date.now() }) =>
    convertVisitDocId({
        url: normalizeAndEncode(url, false),
        timestamp: Math.floor(timestamp),
    })
