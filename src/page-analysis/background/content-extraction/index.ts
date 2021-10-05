import { RawPageContent } from 'src/page-analysis/types'
import extractPdfContent from './extract-pdf-content'
import extractHtmlContent from './extract-html-content'
import transformPageHTML from 'src/util/transform-page-html'
import { PageContent } from 'src/search'

export default function extractPageMetadataFromRawContent(
    rawContent: RawPageContent,
    options?: { fetch?: typeof fetch },
): Promise<
    PageContent & {
        pdfMetadata?: { [key: string]: any }
        pdfPageTexts?: string[]
    }
> {
    if (rawContent.type === 'pdf') {
        return extractPdfContent(rawContent, options)
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
