import pick from 'lodash/fp/pick'
import { getMetadata, metadataRules } from 'page-metadata-parser'

import extractPdfContent from './extract-pdf-content'


// Extract the text content from web pages and PDFs.
export default async function extractPageContent({
    // By default, use the globals window and document.
    url = window.location.href,
    doc = document,
} = {}) {
    // If it is a PDF, run code for pdf instead.
    if (url.endsWith('.pdf')) {
        return await extractPdfContent({url})
    }

    // Text content in web page
    const fullText = doc.body.innerText

    // Metadata of web page
    const selectedMetadataRules = {
        canonicalUrl: metadataRules.url,
        title: metadataRules.title,
        keywords: metadataRules.keywords,
        description: metadataRules.description,
    }
    const metadata = getMetadata(doc, url, selectedMetadataRules)

    return {
        fullText,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(Object.keys(selectedMetadataRules))(metadata),
    }
}
