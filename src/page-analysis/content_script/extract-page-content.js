import pick from 'lodash/fp/pick'
import keys from 'lodash/fp/keys'
import { getMetadata } from 'page-metadata-parser'

import transformPageHTML from 'src/util/transform-page-html'
import PAGE_METADATA_RULES from './page-metadata-rules'
import extractPdfContent from './extract-pdf-content'

export const DEF_LANG = 'en'

/**
 * Extracts content from the DOM, both searchable terms and other metadata.
 *
 * @param {Document} [doc=document] A DOM tree's Document instance.
 * @param {string} [url=location.href]
 * @returns {any} Object containing `fullText` text and other extracted meta content from the input page.
 */
export default async function extractPageContent(
    doc = document,
    url = location.href,
) {
    // If it is a PDF, run code for pdf instead.
    if (url.endsWith('.pdf')) {
        return await extractPdfContent({ url })
    }

    // Apply simple transformations to clean the page's HTML
    const { text: processedHtml } = transformPageHTML({
        html: doc.body.innerHTML,
    })

    const metadata = getMetadata(doc, url, PAGE_METADATA_RULES)

    return {
        fullText: processedHtml,
        lang: doc.documentElement.lang || DEF_LANG,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(keys(PAGE_METADATA_RULES))(metadata),
    }
}
