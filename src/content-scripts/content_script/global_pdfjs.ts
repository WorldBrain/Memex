import * as Global from './global'
import {
    FingerprintSchemeType,
    ContentFingerprint,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { GetContentFingerprints } from './types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { Browser, browser } from 'webextension-polyfill-ts'
import { SIDEBAR_WIDTH_STORAGE_KEY } from 'src/sidebar/annotations-sidebar/constants'

const waitForDocument = async () => {
    while (true) {
        const pdfApplication = (window as any)['PDFViewerApplication']
        const pdfViewer = pdfApplication?.pdfViewer
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
                setLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY, '450px')

                let SidebarInitialWidth = getLocalStorage(
                    SIDEBAR_WIDTH_STORAGE_KEY,
                ).then((width) => {
                    let SidebarInitialAsInteger = parseFloat(
                        width.toString().replace('px', ''),
                    )
                    let WindowInitialWidth =
                        (
                            window.innerWidth - SidebarInitialAsInteger
                        ).toString() + 'px'
                    document.body.style.width = WindowInitialWidth
                })

                browser.storage.onChanged.addListener((changes) => {
                    let SidebarWidth = changes[
                        SIDEBAR_WIDTH_STORAGE_KEY
                    ].newValue.replace('px', '')
                    SidebarWidth = parseFloat(SidebarWidth)
                    let windowWidth = window.innerWidth
                    let width = (windowWidth - SidebarWidth).toString()
                    width = width + 'px'
                    document.body.style.width = width
                })
            } else if (sidebarState === false) {
                document.body.classList.remove('memexSidebarOpen')
                document.body.style.width = window.innerWidth.toString() + 'px'
            }
        })
    },
)
