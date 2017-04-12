import { getMetadata, metadataRules } from 'page-metadata-parser'
import extractPdfContent from './extract-pdf-content'
import extractPageText from './extract-page-text'

// Extract the 'main text' from web pages (esp. news article, blog post, ...) and PDFs.
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
    const pageText = extractPageText(doc, loc)
    // MetaData of web page
    const pageMetadata = getMetadata(doc, url, metadataRules)

    return {
        pageText: pageText,
        pageMetaData: pageMetadata,
    }
}

// Wrap it in a promise.
export default function extractPageContentAsync(...args) {
    return new Promise(function (resolve, reject) {
        const run = () => resolve(extractPageContentSync(...args))
        window.setTimeout(run, 0)
    })
}
