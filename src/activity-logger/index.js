// Stuff that is to be accessible from other modules (folders)

import docuri from 'docuri'

export const visitKeyPrefix = 'visit/'
export const pageKeyPrefix = 'page/'

// Creates an _id string given the variables, or vice versa parses such strings
// We simply use the creation time for the id, for easy chronological sorting.
export const convertVisitDocId = docuri.route(`${visitKeyPrefix}:timestamp/:nonce`)
export const convertPageDocId = docuri.route(`${pageKeyPrefix}:timestamp/:nonce`)
