import normalizeUrl from '../util/encode-url-for-id'
import transformPageText from '../util/transform-page-text'
import { DEFAULT_TERM_SEPARATOR, extractContent } from './util'

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
 * @param {string} url A raw URL string to attempt to extract parts from.
 * @returns {any} Object containing `hostname` and `pathname` props. Values should be the `domain.tld.cctld` part and
 *  everything after, respectively. If regex matching failed on given URL, error will be logged and simply
 *  the URL with protocol and opt. `www` parts removed will be returned for both values.
 */
export function transformUrl(url) {
    let parsed, normalized

    try {
        normalized = normalizeUrl(url, { skipProtocolTrim: true })
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
        console.error(`cannot parse URL: ${normalized}`)
        return {
            hostname: normalized,
            pathname: normalized,
            domain: normalized,
        }
    }
}

/**
 *
 * @param {string} text
 * @returns {Set<string>} Set of "words-of-interest" - determined by pre-proc logic in `transformPageText` - extracted from `text`.
 */
export function extractTerms(text) {
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
        }),
    )
}

/**
 * Given some page data, applies some transformations to the text and
 * returns page data ready for creation of new Page model instance.
 *
 * @param {any} args.pageDoc Contains props like content (full text, blobs), url.
 * @param {boolean} [args.rejectNoContent=true] Whether or not to reject if input page data text is empty.
 * @returns {Promise<any>} Resolves to an object containing all data needed for Page model.
 */
export default function pipeline({
    pageDoc: { content = {}, url, ...data },
    rejectNoContent = true,
}) {
    // First apply transformations to the URL
    const { pathname, hostname, domain } = transformUrl(url)

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (
        rejectNoContent &&
        (content == null || !content.fullText || !content.fullText.length)
    ) {
        return Promise.reject(new Error('Page has no searchable content'))
    }

    // Extract all terms out of processed content
    const terms = [...extractTerms(content.fullText)]
    const titleTerms = [...extractTerms(content.title)]
    const urlTerms = [...extractTerms(pathname)]

    return Promise.resolve({
        url: normalizeUrl(url),
        fullUrl: url,
        fullTitle: content.title,
        text: content.fullText,
        terms,
        urlTerms,
        titleTerms,
        domain,
        hostname,
        tags: [],
        ...data,
    })
}
