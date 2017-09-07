import normalizeUrl from 'normalize-url'

export const PROTOCOL_PATTERN = /^\w+:\/\//

const normalizationOpts = {
    normalizeProtocol: true, // Prepend `http://` if URL is protocol-relative
    stripFragment: true, // Remove trailing hash fragment
    stripWWW: true, // Remove any leading `www.`
    removeTrailingSlash: true,
    removeQueryParameters: [/^utm_\w+/i], // Remove each of these query params (default for now)
    removeDirectoryIndex: [/^(default|index)\.\w{2,3}$/], // Remove things like tralining `/index.js` or `/default.php`
}

/**
 * NOTE: once normalized there is no way to recreate original input.
 * @param {string} url
 * @param {any} [customNormalizationOpts={}] Custom options to pass to `normalize-url` package (will override).
 * @returns {string}
 */
function normalize(url, customOpts) {
    const normalized = normalizeUrl(url, { ...normalizationOpts, ...customOpts })

    // Remove the protocol; we don't need it for IDs (only log http/s anyway)
    return normalized.replace(PROTOCOL_PATTERN, '')
}

/**
 * Safely encodes a unicode URL to base64 string. More info on the safety with URLs
 * containing unicode chars here:
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
 *
 * @param {string} url
 * @returns {string}
 */
function encode(url) {
    const escaped = encodeURIComponent(url) // Grab percent-encoded unicode chars (`%`)
        .replace(/%([0-9A-F]{2})/g,  // Convert percentage-encodings into raw bytes
            (_, p1) => String.fromCharCode(`0x${p1}`))

    // Feed in escaped unicode stuff into base64 encoder
    return btoa(escaped)
}

/**
 * Essentially goes backwards from the encode function.
 *
 * @param {string} encodedUrl URL that has been encoded via this module.
 * @returns {string} Original normalized URL.
 */
export function decode(encodedUrl) {
    const percentageEncoded = atob(encodedUrl)
        .split('')
        .map(char => { // For each raw byte char, convert to percentage-encodings
            const unicodeChar = `00${char.charCodeAt(0).toString(16)}`.slice(-2)
            return `%${unicodeChar}`
        })
        .join('')

    return decodeURIComponent(percentageEncoded)
}


/**
 * Given a URL string, should apply normalization transformations to standardize URLs
 * in a consistent manner, along with encoding to base64 for use in a Pouch doc ID.
 * Base64 encoding should be safe for use with URLs containing unicode chars.
 *
 * Note that there are some normalization schemes proposed in RFC 3986 (describes general
 * syntax for URIs), however this module should contain only those transformations that
 * make sense for the WorldBrain web extension, as Pouch doc IDs.
 *
 * @param {string} url URL string to normalize and encode.
 * @param {any} [customNormalizationOpts={}] Custom options to pass to `normalize-url` package (will override).
 * @returns {string} Encoded URL ready for use in PouchID.
 */
function normalizeAndEncode(url, customNormalizationOpts = {}) {
    const normalizedUrl = normalize(url, customNormalizationOpts)
    return encode(normalizedUrl)
}

export default normalizeAndEncode
