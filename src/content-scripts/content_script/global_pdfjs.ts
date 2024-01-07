import type { PDFDocumentProxy } from 'pdfjs-dist/types/display/api'
import html2canvas from 'html2canvas'
import * as Global from './global'
import {
    FingerprintSchemeType,
    ContentFingerprint,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { InPDFPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { GetContentFingerprints } from './types'
import { makeRemotelyCallableType } from 'src/util/webextensionRPC'
import { extractDataFromPDFDocument } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-pdf-content'
import { getPDFTitle } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/get-title'

const waitForDocument = async () => {
    while (true) {
        const pdfApplication = (globalThis as any)['PDFViewerApplication']
        const pdfViewer = pdfApplication?.pdfViewer
        const pdfDocument: {
            fingerprint?: string
            fingerprints?: string[]
            getData(): Promise<Uint8Array>
        } = pdfViewer?.pdfDocument
        if (pdfDocument) {
            const searchParams = new URLSearchParams(location.search)
            const filePath = searchParams.get('file')

            if (!filePath?.length) {
                return null
            }

            const pdf: PDFDocumentProxy = await (globalThis as any)[
                'pdfjsLib'
            ].getDocument(filePath).promise

            const title = await getPDFTitle(pdf)

            document.title = title

            globalThis['__setDarkMode'] = (isDark: boolean) =>
                (pdfViewer.viewer.style.filter = `invert(${
                    isDark ? 1 : 0
                }) contrast(75%)`)

            return { pdfDocument, pdfApplication }
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
    }
}

const getContentFingerprints: GetContentFingerprints = async () => {
    const { pdfDocument } = await waitForDocument()
    const fingerprintsStrings =
        pdfDocument.fingerprints ??
        (pdfDocument.fingerprint ? [pdfDocument.fingerprint] : [])
    const contentFingerprints = fingerprintsStrings
        .filter((fingerprint) => fingerprint != null)
        .map(
            (fingerprint): ContentFingerprint => ({
                fingerprintScheme: FingerprintSchemeType.PdfV1,
                fingerprint,
            }),
        )
    return contentFingerprints
}

Global.main({
    loadRemotely: false,
    getContentFingerprints,
    htmlElToCanvasEl: (el) => html2canvas(el),
}).then(async ({ inPageUI, pdfBG }) => {
    // DEBUG: Use this in console to debug screenshot UX
    // ;(window as any)['promptPdfScreenshot'] = promptPdfScreenshot
    // // DEBUG: Uncomment to trigger screenshot as soon as PDF is loaded
    // setTimeout(() => {
    //     promptPdfScreenshot()
    // }, 0)
    // ;(window as any)['testPdfScreenshotAnchoring'] = () => {
    //     const anchor: PdfScreenshotAnchor = {
    //         pageNumber: 2,
    //         position: [91.19998168945312, 122.19999694824219],
    //         dimensions: [634, 388],
    //     }
    //     return anchorPdfScreenshot(anchor)
    // }

    makeRemotelyCallableType<InPDFPageUIContentScriptRemoteInterface>({
        extractPDFContents: async () => {
            const searchParams = new URLSearchParams(location.search)
            const filePath = searchParams.get('file')

            if (!filePath?.length) {
                return null
            }

            const pdf: PDFDocumentProxy = await (globalThis as any)[
                'pdfjsLib'
            ].getDocument(filePath).promise
            return extractDataFromPDFDocument(pdf)
        },
        getObjectUrlForPdf: async () => {
            const { pdfDocument } = await waitForDocument()
            const content = await pdfDocument.getData()
            const blob = new Blob([content])
            return { objectUrl: URL.createObjectURL(blob) }
        },
        setPdfUploadState: async (isUploading) => {
            // TODO: Do something with uploading state
        },
    })
    await inPageUI.showSidebar()
})
