import docuri from 'docuri'

import encodeUrl from 'src/util/encode-url-for-id'

// Laterlist related utility functions
export const laterlistKeyPrefix = 'laterlist/'
export const laterlistDocsSelector = {
    _id: { $gte: laterlistKeyPrefix, $lte: `${laterlistKeyPrefix}\uffff` },
}
export const convertLaterlistDocId = docuri.route(
    `${laterlistKeyPrefix}:url/:timestamp`,
)

// NOTE: truncates any decimal part of the `timestamp` arg
export const generateLaterlistDocId = ({ url, timestamp = Date.now() }) =>
    convertLaterlistDocId({
        url: encodeUrl(url, false),
        timestamp: Math.floor(timestamp),
    })
