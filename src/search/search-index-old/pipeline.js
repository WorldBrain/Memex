import normalizeUrl from 'normalize-url'

import transformPageText from 'src/util/transform-page-text'
import { convertMetaDocId } from 'src/activity-logger'
import { extractContent } from './util'
import { keyGen, DEFAULT_TERM_SEPARATOR } from '../util'

// Simply extracts the timestamp component out the ID of a visit or bookmark doc,
//  which is the only data we want at the moment.
export const transformMetaDoc = doc => convertMetaDocId(doc._id).timestamp

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
 * @returns {any} Object containing `hostname` and `pathname` props. Values should be the `domain.tld.cctld` part and
 *  everything after, respectively. If regex matching failed on given URL, error will be logged and simply
 *  the URL with protocol and opt. `www` parts removed will be returned for both values.
 */
export function transformUrl(url) {
    let parsed
    const normalized = normalizeUrl(url, urlNormalizationOpts)

    try {
        parsed = new URL(normalized)
    } catch (error) {
        console.error(`cannot parse URL: ${url}`)
        return { hostname: normalized, pathname: normalized }
    }

    return {
        hostname: parsed ? parsed.hostname : normalized,
        pathname: parsed ? parsed.pathname : normalized,
    }
}

/**
 *
 * @param {string} text
 * @param {'term'|'title'|'url'} key The key under which the extracted terms are categorized.
 * @returns {Set<string>} Set of "words-of-interest" - determined by pre-proc logic in `transformPageText` - extracted from `text`.
 */
export function extractTerms(text, key) {
    if (!text || !text.length) {
        return new Set()
    }

    const { text: transformedText } = transformPageText({ text })

    if (!transformedText || !transformedText.length) {
        return new Set()
    }

    return new Set(
        extractContent(transformedText, {
            separator: DEFAULT_TERM_SEPARATOR,
            key,
        }),
    )
}

/**
 * @typedef IndexLookupDoc
 * @type {Object}
 * @property {string} latest Latest visit/bookmark timestamp time for easy scoring.
 * @property {string} domain Filter term extracted from page URL.
 * @property {Set} urlTerms Set of searchable terms extracted from page URL.
 * @property {Set} terms Set of searchable terms extracted from page content.
 * @property {Set} visits Set of visit index doc IDs, extracted from visit docs.
 * @property {Set} bookmarks Set of bookmark index doc IDs, extracted from bookmark docs.
 * @property {Set} tags Set of searchable tags - init'd empty.
 */

/**
 * Function version of "pipeline" logic. Applies transformation logic
 * on a given doc.
 *
 * @param {IndexRequest} req Page doc + assoc. meta event docs.
 * @returns {IndexLookupDoc} Doc structured for indexing.
 */
export default function pipeline({
    pageDoc: { _id: id, content = {}, url },
    visits = [],
    bookmarkDocs = [],
    rejectNoContent = true,
}) {
    // First apply transformations to the URL
    const { pathname, hostname } = transformUrl(url)

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (
        rejectNoContent &&
        (content == null || !content.fullText || !content.fullText.length)
    ) {
        return Promise.reject(new Error('Page has no searchable content'))
    }

    // Extract all terms out of processed content
    const terms = extractTerms(content.fullText, 'term')
    const titleTerms = extractTerms(content.title, 'title')
    const urlTerms = extractTerms(pathname, 'url')

    // Create timestamps to be indexed as Sets
    const bookmarks = bookmarkDocs.map(transformMetaDoc)

    return Promise.resolve({
        id,
        terms,
        urlTerms,
        titleTerms,
        domain: keyGen.domain(hostname),
        visits: new Set(visits.map(keyGen.visit)),
        bookmarks: new Set(bookmarks.map(keyGen.bookmark)),
        tags: new Set(),
    })
}
