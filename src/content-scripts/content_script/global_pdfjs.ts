import * as Global from './global'
import {
    FingerprintSchemeType,
    ContentFingerprint,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { GetContentFingerprints } from './types'

const waitForDocument = async () => {
    while (true) {
        const pdfViewer = (window as any)['PDFViewerApplication'].pdfViewer
        const pdfDocument: { fingerprint?: string; fingerprints?: string[] } =
            pdfViewer?.pdfDocument
        if (pdfDocument) {
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
    (inPageUI) => {
        inPageUI.events.on('stateChanged', (event) => {
            const sidebarState = event?.changes?.sidebar

            if (sidebarState === true) {
                document.body.classList.add('memexSidebarOpen')
            } else if (sidebarState === false) {
                document.body.classList.remove('memexSidebarOpen')
            }
        })
    },
)
