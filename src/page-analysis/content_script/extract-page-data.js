import { getMetadata, metadataRules } from 'page-metadata-parser'
import extractPdfData from './extract-pdf-data'
import getText from './extract-page-data'

// Extract the 'main text' from web pages (esp. news article, blog post, ...) and PDFs.
async function extractPageDataSync({
    // By default, use the globals window and document.
    loc = window.location,
    url = window.location.href,
    doc = document,
} = {}) {
    // Check URL for PDF
    if (url.endsWith('.pdf')) {
        return extractPdfData({url})
    }

    // Text content in web page
    const pageText = getText(doc, loc)
    // MetaData of web page
    const pageMetadata = getMetadata(doc, url, metadataRules)

    return {
        pageText: pageText,
        pageMetaData: pageMetadata,
    }
}

// Wrap it in a promise.
export default function extractPageDataAsync(...args) {
    return new Promise(function (resolve, reject) {
        const run = () => resolve(extractPageDataSync(...args))
        window.setTimeout(run, 0)
    })
}
