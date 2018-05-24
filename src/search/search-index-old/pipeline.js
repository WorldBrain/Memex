import normalizeUrl from 'normalize-url'
import { dataURLToBlob } from 'blob-util'

import db from 'src/pouchdb'
import updateDoc, { setAttachment } from 'src/util/pouchdb-update-doc'
import { generatePageDocId } from 'src/page-storage'
import transformPageText from 'src/util/transform-page-text'
import { convertMetaDocId } from 'src/activity-logger'
import { DEFAULT_TERM_SEPARATOR, extractContent } from '../util'
import { keyGen } from './util'

async function handleAttachment(pageId, attachment, dataUrl) {
    if (dataUrl == null) {
        return
    }
    const blob = await dataURLToBlob(dataUrl)
    await setAttachment(db, pageId, attachment, blob)
}

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
    let parsed, normalized

    try {
        normalized = normalizeUrl(url, urlNormalizationOpts)
    } catch (error) {
        normalized = url
    }

    try {
        parsed = new URL(normalized)

        return {
            hostname: parsed.hostname,
            pathname: parsed.pathname,
            domain: extractRootDomain(parsed.hostname),
        }
    } catch (error) {
        console.error(`cannot parse URL: ${url}`)
        return {
            hostname: normalized,
            pathname: normalized,
            domain: normalized,
        }
    }
}

/**
 * Derived from answer in: https://stackoverflow.com/a/23945027
 *
 * @param {string} hostname
 * @return {string}
 */
function extractRootDomain(hostname) {
    const splitArr = hostname.split('.')
    const len = splitArr.length

    // Extracting the root domain here if there is a subdomain
    if (len > 2) {
        hostname = `${splitArr[len - 2]}.${splitArr[len - 1]}`

        // Check to see if it's using a ccTLD (i.e. ".me.uk")
        if (
            splitArr[len - 1].length === 2 &&
            [2, 3].includes(splitArr[len - 2].length)
        ) {
            hostname = `${splitArr[len - 3]}.${hostname}`
        }
    }

    return hostname
}

/**
 *
 * @param {string} text
 * @param {'term'|'title'|'url'|'_'} key The key under which the extracted terms are categorized.
 * @returns {Set<string>} Set of "words-of-interest" - determined by pre-proc logic in `transformPageText` - extracted from `text`.
 */
export function extractTerms(text, key = '_') {
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
export default async function pipeline({
    pageDoc: { content = {}, url, favIconURI, screenshotURI },
    visits = [],
    bookmark,
    rejectNoContent = true,
    updatePouchTextOnly = false,
}) {
    // First apply transformations to the URL
    const { pathname, hostname } = transformUrl(url)
    const id = generatePageDocId({ url })

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (
        rejectNoContent &&
        (content == null || !content.fullText || !content.fullText.length)
    ) {
        throw new Error('Page has no searchable content')
    }

    // Ensure a pouch page doc exists for current page
    let newPage = false
    await db.get(id).catch(err => {
        if (err.status !== 404) {
            throw err
        }

        newPage = true
        return db.put({ _id: id, url, content })
    })

    if (favIconURI) {
        await handleAttachment(id, 'favIcon', favIconURI)
    }
    if (screenshotURI) {
        await handleAttachment(id, 'screenshot', screenshotURI)
    }

    // Update existing with new data if doesn't yet exist
    if (!newPage) {
        await updateDoc(db, id, doc => ({
            ...doc,
            content: { ...doc.content, ...content },
        }))
    }

    // Extract all terms out of processed content
    const terms = extractTerms(content.fullText, 'term')
    const titleTerms = extractTerms(content.title, 'title')
    const urlTerms = extractTerms(pathname, 'url')

    // Fit into old-index multi-bookmarks model
    const bookmarks =
        bookmark == null ? new Set() : new Set([keyGen.bookmark(bookmark)])

    return {
        id,
        terms,
        urlTerms,
        titleTerms,
        domain: keyGen.domain(hostname),
        visits: new Set(visits.map(keyGen.visit)),
        tags: new Set(),
        bookmarks,
    }
}
