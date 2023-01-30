import { transformPageText } from '@worldbrain/memex-stemmer/lib/transform-page-text'
import type { PDFDocumentProxy } from 'pdfjs-dist/types/display/api'
import type {
    ExtractedPDFData,
    MemexPDFMetadata,
} from 'src/page-analysis/background/content-extraction/types'
import type { Runtime } from 'webextension-polyfill'
import { PDF_RAW_TEXT_SIZE_LIMIT, PDF_VIEWER_HTML } from './constants'

export const constructPDFViewerUrl = (
    urlToPdf: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): string =>
    args.runtimeAPI.getURL(PDF_VIEWER_HTML) +
    '?file=' +
    encodeURIComponent(urlToPdf)

export const isUrlPDFViewerUrl = (
    url: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): boolean => {
    const pdfViewerUrl = args.runtimeAPI.getURL(PDF_VIEWER_HTML)
    return url.includes(pdfViewerUrl)
}

export const extractDataFromPDFDocument = async (
    pdf: PDFDocumentProxy,
    defaultTitle = 'Unknown PDF Document',
): Promise<ExtractedPDFData> => {
    // Read text from pages one by one (in parallel may be too heavy).
    const pageTexts = []
    let textSize = 0
    let truncated = false
    let pageIndex = 0
    for (pageIndex = 0; pageIndex < pdf.numPages; ++pageIndex) {
        const page = await pdf.getPage(pageIndex + 1) // starts at page number 1, not 0
        // wait for object containing items array with text pieces
        const pageItems = await page.getTextContent()
        const pageText = pageItems.items.map((item) => item.str).join(' ')

        textSize += pageText.length
        if (textSize > PDF_RAW_TEXT_SIZE_LIMIT) {
            truncated = true
            break
        }

        pageTexts.push(pageText)
    }

    // Run the joined texts through our pipeline
    const { text: processedText } = transformPageText(pageTexts.join(' '), {})

    const metadata = await pdf.getMetadata()
    const downloadInfo = await pdf.getDownloadInfo()

    const pdfMetadata: MemexPDFMetadata = {
        memexTotalPages: pdf.numPages,
        memexIncludedPages: pageIndex,
        memexDocumentBytes: downloadInfo?.length ?? null,
        memexOutline: (await pdf.getOutline()) ?? null,
        documentInformationDict: metadata?.info ?? null,
        metadataMap: metadata?.metadata?.getAll() ?? null,
        fingerprints: (pdf as any).fingerprints
            ? (pdf as any).fingerprints
            : [pdf.fingerprint],
    }

    return {
        pdfMetadata,
        pdfPageTexts: pageTexts,
        fullText: processedText,
        author: metadata.info['Author'],
        title: metadata.info['Title'] || defaultTitle,
        keywords: metadata.info['Keywords'],
    }
}
