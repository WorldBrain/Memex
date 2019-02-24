import { browser } from 'webextension-polyfill-ts'

export default function isPDFJSViewer() {
    const pdfViewerURLRegex = RegExp(`^${browser.extension.getURL('')}`)
    return (
        pdfViewerURLRegex.test(window.location.href) &&
        window.location.href.endsWith('.pdf')
    )
}
