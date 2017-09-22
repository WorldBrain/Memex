import pick from 'lodash/fp/pick'
import { getMetadata, metadataRules } from 'page-metadata-parser'

import transformPageText from 'src/util/transform-page-text'
import transformPageHTML from 'src/util/transform-page-html'
import extractPdfContent from './extract-pdf-content'


// Extract the text content from web pages and PDFs.
export default async function extractPageContent({
    // By default, use the globals window and document.
    url = window.location.href,
    doc = document,
    isImport = false,
} = {}) {
    // If it is a PDF, run code for pdf instead.
    if (url.endsWith('.pdf')) {
        return await extractPdfContent({url})
    }
    
    const lang = doc.documentElement.lang

    // // Apply simple transformations to clean the page's HTML
    const { text: processedHtml } = transformPageHTML({ html: doc.body.innerHTML })
    const { text: processedText } = transformPageText({ text: processedHtml, lang: lang })

    // Metadata of web page
    const selectedMetadataRules = {
        canonicalUrl: metadataRules.url,
        title: metadataRules.title,
        keywords: metadataRules.keywords,
        description: metadataRules.description,
    }
    const metadata = getMetadata(doc, url, selectedMetadataRules)

    return {
        fullText: processedText,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(Object.keys(selectedMetadataRules))(metadata),
    }
}
