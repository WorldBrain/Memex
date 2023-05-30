import browser from 'webextension-polyfill'
import * as PDFJS from 'pdfjs-dist'
import { loadBlob } from 'src/imports/background/utils'
import type { RawPdfPageContent } from 'src/page-analysis/types'
import { extractDataFromPDFDocument } from 'src/pdf/util'

// NOTE: This is the old mv2 logic where PDF data got fetched then processed in the BG.
//  It moved to happen in the content script as PDFJS's getDocument no longer works in BG Service Worker

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
    return extractDataFromPDFDocument(pdf, rawContent.title)
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
