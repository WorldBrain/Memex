import { getMetadata } from 'page-metadata-parser'

import PAGE_METADATA_RULES from '../page-metadata-rules'
import { ExtractRawPageContent } from '../types'

export const DEF_LANG = 'en'

/**
 * Extracts content from the DOM, both searchable terms and other metadata.
 *
 * @param {Document} [doc=document] A DOM tree's Document instance.
 * @param {string} [url=location.href]
 * @returns {any} Object containing `fullText` text and other extracted meta content from the input page.
 */

const extractRawPageContent: ExtractRawPageContent = async (
    doc = document,
    url = location.href,
) => {
    if (url.endsWith('.pdf')) {
        return {
            type: 'pdf',
            url,
        }
    } else {
        return {
            type: 'html',
            url,
            body: doc.body.innerHTML,
            lang: doc.documentElement.lang || DEF_LANG,
            metadata: getMetadata(doc, url, PAGE_METADATA_RULES),
        }
    }
}

export default extractRawPageContent
