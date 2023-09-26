import type { PDFDocumentProxy } from 'pdfjs-dist/types/display/api'
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
import { promptPdfScreenshot } from '@worldbrain/memex-common/lib/pdf/screenshots/selection'
import { anchorPdfScreenshot } from '@worldbrain/memex-common/lib/pdf/screenshots/anchoring'
import { PdfScreenshotAnchor } from '@worldbrain/memex-common/lib/annotations/types'

const waitForDocument = async () => {
    while (true) {
        const pdfApplication = (globalThis as any)['PDFViewerApplication']
        const pdfViewer = pdfApplication?.pdfViewer
        const pdfDocument: { fingerprint?: string; fingerprints?: string[] } =
            pdfViewer?.pdfDocument
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

            return pdfDocument
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
    }
}

const getContentFingerprints: GetContentFingerprints = async () => {
    const pdfDocument = await waitForDocument()
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

Global.main({ loadRemotely: false, getContentFingerprints }).then(
    async (inPageUI) => {
        // DEBUG: Use this in console to debug screenshot UX
        ;(window as any)['promptPdfScreenshot'] = promptPdfScreenshot
        // DEBUG: Uncomment to trigger screenshot as soon as PDF is loaded
        // setTimeout(() => {
        //     promptPdfScreenshot()
        // }, 0)
        ;(window as any)['testPdfScreenshotAnchoring'] = () => {
            const anchor: PdfScreenshotAnchor = {
                pageNumber: 2,
                position: [91.19998168945312, 122.19999694824219],
                dimensions: [634, 388],
            }
            return anchorPdfScreenshot(anchor)
        }

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
        })
        await inPageUI.showSidebar()
    },
)
