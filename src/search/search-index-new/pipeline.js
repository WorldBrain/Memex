import normalizeUrl from 'src/util/encode-url-for-id'

import { extractTerms, transformUrl } from '../search-index-old/pipeline'

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
