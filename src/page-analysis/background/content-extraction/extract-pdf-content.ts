import { browser } from 'webextension-polyfill-ts'
import * as PDFJS from 'pdfjs-dist'
import transformPageText from 'src/util/transform-page-text'
import { PDF_RAW_TEXT_SIZE_LIMIT } from './constants'
import type { MemexPDFMetadata } from './types'
import { loadBlob } from 'src/imports/background/utils'
import type { RawPdfPageContent } from 'src/page-analysis/types'

// Run PDF.js to extract text from each page and read document metadata.
async function extractContent(
    pdfData: ArrayBuffer,
    rawContent: RawPdfPageContent,
) {
    if (process.env.NODE_ENV !== 'test') {
        // Point PDF.js to its worker code, a static file in the extension.
        PDFJS.GlobalWorkerOptions.workerSrc = browser.runtime.getURL(
            '/build/pdf.worker.js',
        )
    }

    // Load PDF document into PDF.js
    // @ts-ignore
    const pdf = await PDFJS.getDocument(pdfData).promise

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
    const { text: processedText } = transformPageText({
        text: pageTexts.join(' '),
    })

    const metadata = await pdf.getMetadata()
    const downloadInfo = await pdf.getDownloadInfo()

    const pdfMetadata: MemexPDFMetadata = {
        memexTotalPages: pdf.numPages,
        memexIncludedPages: pageIndex,
        memexDocumentBytes: downloadInfo?.length ?? null,
        memexOutline: (await pdf.getOutline()) ?? null,
        documentInformationDict: metadata?.info ?? null,
        metadataMap: metadata?.metadata?.getAll() ?? null,
        fingerprints: pdf.fingerprints ? pdf.fingerprints : [pdf.fingerprint],
    }

    return {
        pdfMetadata,
        pdfPageTexts: pageTexts,
        fullText: processedText,
        author: metadata.info.Author,
        title: metadata.info.Title || rawContent.title,
        keywords: metadata.info.Keywords,
    }
}

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function extractPdfContent(
    rawContent: RawPdfPageContent,
    options?: { fetch?: typeof fetch },
) {
    // TODO: If the PDF is open in a Memex PDF Reader, we should be able to save the content from that tab
    // instead of re-fetching it.
    const blob = await (options.fetch
        ? (await options.fetch(rawContent.url)).blob()
        : loadBlob<Blob>({
              url: rawContent.url,
              timeout: 5000,
              responseType: 'blob',
          }))

    if (!blob) {
        throw new Error(`Could not load PDF from: ${rawContent.url}`)
    }

    const pdfData = await new Promise<ArrayBuffer>(function (resolve, reject) {
        const fileReader = new FileReader()
        fileReader.onload = async (event) => {
            resolve(event.target.result as ArrayBuffer)
        }
        fileReader.onerror = (event) => reject(event.target.error)
        fileReader.readAsArrayBuffer(blob)
    })

    return extractContent(pdfData, rawContent)
}
