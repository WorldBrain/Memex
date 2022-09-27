import extractHtmlContent from './extract-html-content'
import transformPageHTML from 'src/util/transform-page-html'
import { runInTab } from 'src/util/webextensionRPC'
import type { PageContent } from 'src/search'
import type { RawPageContent } from 'src/page-analysis/types'
import type { InPDFPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'

export default function extractPageMetadataFromRawContent(
    rawContent: RawPageContent,
    options?: { fetch?: typeof fetch; tabId?: number },
): Promise<
    PageContent & {
        pdfMetadata?: { [key: string]: any }
        pdfPageTexts?: string[]
    }
> {
    if (rawContent.type === 'pdf') {
        return runInTab<InPDFPageUIContentScriptRemoteInterface>(
            options!.tabId!,
        ).extractPDFContents()
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
