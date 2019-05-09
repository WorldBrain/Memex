import { PDF_VIEWER_ROOT_URL } from './constants'

export function isPdfViewer(url = location.href) {
    const pdfViewer = new RegExp(`chrome-extension://.*${PDF_VIEWER_ROOT_URL}`)

    return pdfViewer.test(url) && url.endsWith('.pdf')
}

export function getPdfUrlFromViewerUrl(url = location.href) {
    const viewerUrl = new URL(url)
    return viewerUrl.searchParams.get('file')
}
