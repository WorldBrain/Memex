import docuri from 'docuri'

import { normalizeAndEncode } from 'src/util/encode-url-for-id'

// Bookmarks related utility functions
export const bookmarkKeyPrefix = 'bookmark/'
export const bookmarkDocsSelector = {
    _id: { $gte: bookmarkKeyPrefix, $lte: `${bookmarkKeyPrefix}\uffff` },
}
export const convertBookmarkDocId = docuri.route(
    `${bookmarkKeyPrefix}:url/:timestamp`,
)

// NOTE: truncates any decimal part of the `timestamp` arg
export const generateBookmarkDocId = ({ url, timestamp = Date.now() }) =>
    convertBookmarkDocId({
        url: normalizeAndEncode(url, false),
        timestamp: Math.floor(timestamp),
    })
