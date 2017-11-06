import normalizeUrl from 'normalize-url'

import queryParamRules from './query-string-normalization-rules'

export const PROTOCOL_PATTERN = /^\w+:\/\//

const normalizationOpts = {
    normalizeProtocol: true, // Prepend `http://` if URL is protocol-relative
    stripFragment: true, // Remove trailing hash fragment
    stripWWW: true, // Remove any leading `www.`
    removeTrailingSlash: true,
    removeQueryParameters: [/^utm_\w+/i], // Remove each of these query params (default for now)
    removeDirectoryIndex: [/^(default|index)\.\w{2,4}$/], // Remove things like tralining `/index.js` or `/default.php`
}

/**
 * Applies our custom query-param normalization rules for specific sites, removing all
 * but specific params from the query string.
 *
 * @param {string} url
 * @returns {string}
 */
function applyQueryParamsRules(url) {
    const parsed = new URL(url)
    const rules = queryParamRules.get(parsed.hostname)

    // Base case; domain doesn't have any special normalization rules
    if (!rules) {
        return url
    }

    // Remove all query params that don't appear in special rules
    const rulesSet = new Set(rules)
    for (const param of parsed.searchParams.keys()) {
        if (!rulesSet.has(param)) {
            parsed.searchParams.delete(param)
        }
    }

    return parsed.href
}

/**
 * NOTE: once normalized there is no way to recreate original input.
 *
 * @param {string} url
 * @param {any} [customNormalizationOpts={}] Custom options to pass to `normalize-url` package (will override).
 * @returns {string}
 */
function normalize(url, customOpts) {
    let normalized = normalizeUrl(url, {
        ...normalizationOpts,
        ...customOpts,
    })

    normalized = applyQueryParamsRules(normalized)

    // Remove the protocol; we don't need/want it for IDs
    return normalized.replace(PROTOCOL_PATTERN, '')
}

/**
 * Safely encodes a unicode URL to base64 string. More info on the safety with URLs
 * containing unicode chars here:
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_.22Unicode_Problem.22
 *
 * @param {string} url
 * @param {boolean} needsEscaping
 * @returns {string}
 */
function encode(url, needsEscaping) {
    const escaped = encodeURIComponent(url) // Grab percent-encoded unicode chars (`%`)
        .replace(
            /%([0-9A-F]{2})/g, // Convert percentage-encodings into raw bytes
            (_, p1) => String.fromCharCode(`0x${p1}`),
        )

    // Feed in escaped unicode stuff into base64 encoder
    const encoded = btoa(escaped)
    return needsEscaping ? encodeURIComponent(encoded) : encoded
}

/**
 * Essentially goes backwards from the encode function.
 *
 * @param {string} encodedUrl URL that has been encoded via this module.
 * @param {boolean} needsEscaping Essentially the inverse of the same named param on encode method.
 * @returns {string} Original normalized URL.
 */
export function decode(encodedUrl, needsEscaping = true) {
    encodedUrl = needsEscaping ? decodeURIComponent(encodedUrl) : encodedUrl

    const percentageEncoded = atob(encodedUrl)
        .split('')
        .map(char => {
            // For each raw byte char, convert to percentage-encodings
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
 * @param {boolean} needsEscaping Denotes whether or not encoded URL should be run through
 *  final `encodeURIComponent` call. Generally should be done if encoding to perform a lookup,
 *  as generated doc IDs will have been auto-escaped (via `docuri` package).
 * @param {any} [customNormalizationOpts={}] Custom options to pass to `normalize-url` package (will override).
 * @returns {string} Encoded URL ready for use in PouchID.
 */
function normalizeAndEncode(
    url,
    needsEscaping = true,
    customNormalizationOpts = {},
) {
    const normalizedUrl = normalize(url, customNormalizationOpts)
    return encode(normalizedUrl, needsEscaping)
}

export default normalizeAndEncode
