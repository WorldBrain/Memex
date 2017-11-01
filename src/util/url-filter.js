//Remove unnecessary query params from the URL to avoid redundancy
const NORMALIZE_OPTS = {
    'stripWWW': false,
    'removeDirectoryIndex': false,
    'removeTrailingSlash': false,
    'stripFragment': true,
    'normalizeProtocol': false
}
const GSEARCH_SUBSTR = 'www.google'
const FB_SUBSTR = 'www.facebook'
const normalizeUrl = require("normalize-url")
export default function urlFilter(url) {
    const parts = url.split('.')

    if (parts[0] == 'www' && parts[1] == 'google') {
        // Case 1: Google Search
        return normalizeUrl(url.split('&')[0], NORMALIZE_OPTS)
    } else if (parts[0] == 'www' && parts[1] == 'facebook') {
        // Case 2: Facebook
        return normalizeUrl(url.split('?')[0], NORMALIZE_OPTS)
    }
    return normalizeUrl(url, NORMALIZE_OPTS)
}
