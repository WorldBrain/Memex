import normalizeUrl from 'normalize-url'

import transformPageText from 'src/util/transform-page-text'
import { convertMetaDocId } from 'src/activity-logger'
import { getLatestMeta, extractContent, keyGen } from './util'
import { DEFAULT_TERM_SEPARATOR, URL_SEPARATOR } from '.'

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
export const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

// Meant to match domain + TLD + optional ccTLD of a URL without leading `protocol://www.`.
//   It end-delimits the domain by either a forward-slash or end-of-input.
//   From a `String.prototype.match` call, it should output 5 groups with group 2 containing
//   `domain.tld.cctld` and group 5 containing the rest of the URL after domain.
// TODO: This needs proper scrutinyy
const DOMAIN_TLD_PATTERN = /(\w{2,}\.\w{2,3}(\.\w{2})?)(\/|$)(.*)/
const PROTOCOL_WWW_PATTERN = /(^\w+:|^)\/\//

const urlNormalizationOpts = {
    normalizeProtocol: true, // Prepend `http://` if URL is protocol-relative
    stripFragment: true, // Remove trailing hash fragment
    stripWWW: true, // Remove any leading `www.`
    removeTrailingSlash: true,
    removeQueryParameters: [/.+/], // Remove all query params from terms indexing
    removeDirectoryIndex: [/^(default|index)\.\w{2,4}$/], // Remove things like tralining `/index.js` or `/default.php`
}

/**
 * @param {string} url A raw URL string to attempt to extract parts from.
 * @returns {any} Object containing `domain` and `remainingUrl` keys. Values should be the `domain.tld.cctld` part and
 *  everything after, respectively. If regex matching failed on given URL, error will be logged and simply
 *  the URL with protocol and opt. `www` parts removed will be returned for both values.
 */
function transformUrl(url) {
    let normalized = normalizeUrl(url, urlNormalizationOpts)
    normalized = url.replace(PROTOCOL_WWW_PATTERN, '')
    const matchResult = normalized.match(DOMAIN_TLD_PATTERN)

    if (matchResult == null) {
        console.error(`cannot split URL: ${url}`)
        return { remainingUrl: normalized, domain: normalized }
    }

    const { 1: domain, 4: remainingUrl } = matchResult

    // Fallback to normalized URL if match groups don't exist
    return {
        remainingUrl: remainingUrl || normalized,
        domain: domain || normalized,
    }
}

/**
 * @typedef IndexLookupDoc
 * @type {Object}
 * @property {string} latest Latest visit/bookmark timestamp time for easy scoring.
 * @property {string} type Enum of either 'bookmark' or 'visit'.
 * @property {string} domain Filter term extracted from page URL.
 * @property {Set} urlTerms Set of searchable terms extracted from page URL.
 * @property {Set} terms Set of searchable terms extracted from page content.
 * @property {Set} visits Set of visit index doc IDs, extracted from visit docs.
 * @property {Set} bookmarks Set of bookmark index doc IDs, extracted from bookmark docs.
 */

/**
 * Function version of "pipeline" logic. Applies transformation logic
 * on a given doc.
 *
 * @param {IndexRequest} req Page doc + assoc. meta event docs.
 * @returns {IndexLookupDoc} Doc structured for indexing.
 */
export default function pipeline({
    pageDoc: { _id: id, content, url },
    visitDocs = [],
    bookmarkDocs = [],
}) {
    // First apply transformations to the URL
    const { remainingUrl, domain } = transformUrl(url)

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (!content || !content.fullText || !content.fullText.length === 0) {
        throw new Error('Page has no searchable content')
    }

    // Run the searchable content through our text transformations, attempting to discard useless data.
    const { text: transformedContent } = transformPageText({
        text: content.fullText,
    })

    // Extract all terms out of processed content
    const terms = new Set(
        extractContent(transformedContent, {
            separator: DEFAULT_TERM_SEPARATOR,
            key: 'term',
        }),
    )

    // Extract all terms out of processed URL
    const urlTerms = new Set(
        extractContent(remainingUrl, {
            separator: URL_SEPARATOR,
            key: 'url',
        }).filter(term => !term.endsWith('/')),
    )

    // Create timestamps to be indexed as Sets
    const visits = visitDocs.map(transformMetaDoc)
    const bookmarks = bookmarkDocs.map(transformMetaDoc)

    return {
        id,
        ...getLatestMeta(visits, bookmarks),
        terms,
        urlTerms,
        domain: keyGen.domain(domain),
        title: content.title,
        visits: new Set(visits.map(keyGen.visit)),
        bookmarks: new Set(bookmarks.map(keyGen.bookmark)),
    }
}
