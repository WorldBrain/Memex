import * as PDFJS from 'pdfjs-dist'
import type { TypedArray } from 'pdfjs-dist/types/display/api'
import type { RawPdfPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'
import { extractDataFromPDFDocument } from 'src/pdf/util'
import type { ExtractedPDFData } from './types'

// NOTE: This is the old mv2 logic where PDF data got fetched then processed in the BG.
//  It moved to happen in the content script as PDFJS's getDocument no longer works in BG Service Worker

// NOTE: old extension workerSrc was gotten via: browser.runtime.getURL('/build/pdf.worker.js')

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function fetchPdfContent(
    { url, title }: Pick<RawPdfPageContent, 'url' | 'title'>,
    opts: {
        fetch: typeof fetch
        pdfJSWorkerSrc?: string
    },
): Promise<ExtractedPDFData> {
    const response = await opts.fetch(url)
    if (!response.ok) {
        throw new Error(
            `PDF fetch failed with HTTP status ${response.status}: ${response.statusText}`,
        )
    }
    const blob = await response.blob()
    const pdfData = await new Promise<ArrayBuffer>(function (resolve, reject) {
        const fileReader = new FileReader()
        fileReader.onload = async (event) => {
            resolve(event.target.result as ArrayBuffer)
        }
        fileReader.onerror = (event) => reject(event.target.error)
        fileReader.readAsArrayBuffer(blob)
    })

    if (opts.pdfJSWorkerSrc) {
        PDFJS.GlobalWorkerOptions.workerSrc = opts.pdfJSWorkerSrc
    }

    const pdf = await PDFJS.getDocument(pdfData as TypedArray).promise
    return extractDataFromPDFDocument(pdf, title)
}
