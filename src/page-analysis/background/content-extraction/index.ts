import { RawPageContent } from 'src/page-analysis/types'
import extractPdfContent from './extract-pdf-content'
import extractHtmlContent from './extract-html-content'
import transformPageHTML from 'src/util/transform-page-html'
import { PageContent } from 'src/search'

export default function extractPageMetadataFromRawContent(
    rawContent: RawPageContent,
): Promise<PageContent> {
    if (rawContent.type === 'pdf') {
        return extractPdfContent(rawContent)
    } else {
        return extractHtmlContent(rawContent)
    }
}

export async function getPageFullText(
    rawContent: RawPageContent,
    metadata: PageContent,
) {
    return rawContent.type === 'html'
        ? transformPageHTML({
              html: rawContent.body,
          }).text
        : metadata.fullText
}
