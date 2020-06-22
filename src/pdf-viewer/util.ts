import { PDF_VIEWER_ROOT_URL } from './constants'
import PDFJS from 'pdfjs-dist'

export function isUrlToPdf(url: string) {
    return url.endsWith('.pdf')
}

export function isPdfViewer(url = location.href) {
    const pdfViewer = new RegExp(`chrome-extension://.*${PDF_VIEWER_ROOT_URL}`)

    return pdfViewer.test(url) && isUrlToPdf(url)
}

export function getPdfUrlFromViewerUrl(url = location.href) {
    const viewerUrl = new URL(url)
    return viewerUrl.searchParams.get('file')
}

export async function fetchPdfFingerprint(url: string) {
    if (!isUrlToPdf(url)) {
        return null
    }

    const pdf = await PDFJS.getDocument(url)
    return pdf.fingerprint
}
