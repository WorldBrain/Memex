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
    const text = {
        bodyInnerText: doc.body.innerText,
    }
    // Metadata of web page
    const metadata = getMetadata(doc, url, metadataRules)

    return {
        text,
        metadata,
    }
}
