import transformPageText from 'src/util/transform-page-text'

// Meant to match domain + TLD + optional ccTLD of a URL without leading `protocol://www.`.
//   It end-delimits the domain by either a forward-slash or end-of-input.
//   From a `String.prototype.match` call, it should output 5 groups with group 2 containing
//   `domain.tld.cctld` and group 5 containing the rest of the URL after domain.
// TODO: This needs proper scrutinyy
const DOMAIN_TLD_PATTERN = /(\w{2,}\.\w{2,3}(\.\w{2})?)(\/|$)(.*)/
const PROTOCOL_WWW_PATTERN = /(^\w+:|^)\/\/(www\.)?/

/**
 * @param {string} url A raw URL string to attempt to extract parts from.
 * @returns {any} Object containing `domain` and `remainingUrl` keys. Values should be the `domain.tld.cctld` part and
 *  everything after, respectively. If regex matching failed on given URL, error will be logged and simply
 *  the URL with protocol and opt. `www` parts removed will be returned for both values.
 */
const transformUrl = url => {
    const normalized = url.replace(PROTOCOL_WWW_PATTERN, '')
    const matchResult = normalized.match(DOMAIN_TLD_PATTERN)

    if (matchResult == null) {
        console.error(`cannot split URL: ${url}`)
        return { remainingUrl: normalized, domain: normalized }
    }

    const { 1: domain, 4: remainingUrl } = matchResult

    // Fallback to normalized URL if match groups don't exist
    return { remainingUrl: remainingUrl || normalized, domain: domain || normalized }
}


/**
 * Function version of "pipeline" logic. Applies transformation logic
 * on a given doc.
 *
 * @param {any} doc A page doc containing `content` field containing various webpage data + `_id`.
 * @returns {any} Doc ready for indexing containing `id` and processed composite `content` string field
 */
export default function pipeline({ _id: id, content, url }) {
    // First apply transformations to the URL
    const { remainingUrl, domain } = transformUrl(url)

    // Short circuit if no searchable content
    //  (not 100% sure what to do in this situation yet; basically means doc is useless for search,
    //    so maybe throw error so index method can skip it?)
    if (!content || !content.fullText || !content.fullText.length === 0) {
        return { id, url: remainingUrl, domain }
    }

    // Run the searchable content through our text transformations, attempting to discard useless data.
    const { text: transformedContent } = transformPageText({ text: content.fullText })

    return { id, content: transformedContent, url: remainingUrl, domain, title: content.title }
}
