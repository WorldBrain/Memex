import { RawPageContent } from 'src/page-analysis/types'
import extractPdfContent from './extract-pdf-content'
import extractHtmlContent from './extract-html-content'

export default function extractPageContentFromRawContent(
    rawContent: RawPageContent,
) {
    if (rawContent.type === 'pdf') {
        return extractPdfContent(rawContent)
    } else {
        return extractHtmlContent(rawContent)
    }
}
