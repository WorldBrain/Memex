import { getMetadata } from 'page-metadata-parser'

import PAGE_METADATA_RULES from '../page-metadata-rules'
import { ExtractRawPageContent, RawPageContent } from '../types'
import { getUrl, isFullUrlPDF } from 'src/util/uri-utils'

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
        url = getUrl(location.href)
    }
    if (isFullUrlPDF(url)) {
        const rawContent: RawPageContent = {
            type: 'pdf',
            url,
        }
        return rawContent
    } else {
        const rawContent: RawPageContent = {
            type: 'html',
            url,
            body: doc.body.innerHTML,
            lang: doc.documentElement.lang || DEF_LANG,
            metadata: getMetadata(doc, url, PAGE_METADATA_RULES),
        }
        return rawContent
    }
}

export default extractRawPageContent
