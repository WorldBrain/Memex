import { getMetadata, metadataRules } from 'page-metadata-parser'
import extractPdfContent from './extract-pdf-content'
import extractPageText from './extract-page-text'
import extractFavIcon from './extract-fav-icon'

// Extract the text content from web pages and PDFs.
export default async function extractPageContent({
    // By default, use the globals window and document.
    loc = window.location,
    url = window.location.href,
    doc = document,
} = {}) {
    // If it is a PDF, run code for pdf instead.
    if (url.endsWith('.pdf')) {
        return await extractPdfContent({url})
    }

    // Text content in web page
    const text = await extractPageText(doc, loc)
    // Metadata of web page
    const metadata = getMetadata(doc, url, metadataRules)
    // Favicon of web page
    const favIcon = await extractFavIcon(doc)

    return {
        text,
        metadata,
        favIcon,
    }
}
