import normalizeUrl from 'normalize-url'

import transformPageText from 'src/util/transform-page-text'
import { convertMetaDocId } from 'src/activity-logger'
import { extractContent, keyGen } from './util'
import { DEFAULT_TERM_SEPARATOR } from '.'

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
 * @returns {any} Object containing `domain` and `remainingUrl` keys. Values should be the `domain.tld.cctld` part and
 *  everything after, respectively. If regex matching failed on given URL, error will be logged and simply
 *  the URL with protocol and opt. `www` parts removed will be returned for both values.
 */
function transformUrl(url) {
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
    pageDoc: { _id: id, content, url },
    visitDocs = [],
    bookmarkDocs = [],
}) {
    // First apply transformations to the URL
    const { pathname, hostname } = transformUrl(url)

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (!content || !content.fullText || !content.fullText.length) {
        return Promise.reject(new Error('Page has no searchable content'))
    }

    // Run the searchable content through our text transformations, attempting to discard useless data.
    const { text: transformedContent } = transformPageText({
        text: content.fullText,
        lang: content.lang,
    })
    const { text: transformedTitle } = transformPageText({
        text: content.title,
    })
    const { text: transformedUrlTerms } = transformPageText({
        text: pathname,
    })

    // Extract all terms out of processed content
    let titleTerms, urlTerms
    const terms = new Set(
        extractContent(transformedContent, {
            separator: DEFAULT_TERM_SEPARATOR,
            key: 'term',
        }),
    )

    if (transformedTitle && transformedTitle.length) {
        // Extract all terms out of processed title
        titleTerms = new Set(
            extractContent(transformedTitle, {
                separator: DEFAULT_TERM_SEPARATOR,
                key: 'title',
            }),
        )
    }

    if (pathname && pathname.length) {
        // Extract all terms out of processed URL
        urlTerms = new Set(
            extractContent(transformedUrlTerms, {
                separator: DEFAULT_TERM_SEPARATOR,
                key: 'url',
            }),
        )
    }

    // Create timestamps to be indexed as Sets
    const visits = visitDocs.map(transformMetaDoc)
    const bookmarks = bookmarkDocs.map(transformMetaDoc)

    return Promise.resolve({
        id,
        terms,
        urlTerms: urlTerms || new Set(),
        domain: keyGen.domain(hostname),
        titleTerms: titleTerms || new Set(),
        visits: new Set(visits.map(keyGen.visit)),
        bookmarks: new Set(bookmarks.map(keyGen.bookmark)),
        tags: new Set(),
    })
}
