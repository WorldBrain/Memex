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
