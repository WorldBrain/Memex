import { getMetadata, metadataRules } from 'page-metadata-parser'
import extractPdfContent from './extract-pdf-content'
import extractPageText from './extract-page-text'

// Extract the text content from web pages and PDFs.
async function extractPageContentSync({
    // By default, use the globals window and document.
    loc = window.location,
    url = window.location.href,
    doc = document,
} = {}) {
    // Check URL for PDF
    if (url.endsWith('.pdf')) {
        return extractPdfContent({url})
    }

    // Text content in web page
    const text = extractPageText(doc, loc)
    // Metadata of web page
    const metadata = getMetadata(doc, url, metadataRules)

    return {
        text,
        metadata,
    }
}

// Wrap it in a promise.
export default function extractPageContentAsync(...args) {
    return new Promise(function (resolve, reject) {
        const run = () => resolve(extractPageContentSync(...args))
        window.setTimeout(run, 0)
    })
}
