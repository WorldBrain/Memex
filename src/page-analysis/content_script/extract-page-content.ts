import { getMetadata } from 'page-metadata-parser'
import { runtime } from 'webextension-polyfill'

import PAGE_METADATA_RULES from '../page-metadata-rules'
import { ExtractRawPageContent, RawPageContent } from '../types'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import { isUrlPDFViewerUrl } from 'src/pdf/util'

export const DEF_LANG = 'en'

/**
 * Extracts content from the DOM, both searchable terms and other metadata.
 *
 * @param {Document} [doc=document] A DOM tree's Document instance.
 * @param {string} [url=null]
 * @returns {any} Object containing `fullText` text and other extracted meta content from the input page.
 */

const extractRawPageContent: ExtractRawPageContent = async (
    doc = document,
    url = null,
) => {
    if (url === null) {
        url = location.href
    }
    const underlyingResourceUrl = getUnderlyingResourceUrl(url)
    let rawContent: RawPageContent
    if (isUrlPDFViewerUrl(url, { runtimeAPI: runtime })) {
        rawContent = {
            type: 'pdf',
            title: document.title || undefined,
            url: underlyingResourceUrl,
        }
    } else {
        rawContent = {
            type: 'html',
            url: underlyingResourceUrl,
            body: doc.body.innerHTML,
            lang: doc.documentElement.lang || DEF_LANG,
            metadata: getMetadata(
                doc,
                underlyingResourceUrl,
                PAGE_METADATA_RULES,
            ),
        }
    }
    return rawContent
}

export default extractRawPageContent
