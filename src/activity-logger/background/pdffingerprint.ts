import { browser } from 'webextension-polyfill-ts'

import { PDF_VIEWER_URL } from 'src/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import normalize from 'src/util/encode-url-for-id'

/* eslint eqeqeq: 0 */
export default async function getPdfFingerprint(pdfURL) {
    const PDFJS = require('pdfjs-dist')
    try {
        const pdf = await PDFJS.getDocument(pdfURL)
        return pdf.fingerprint
    } catch (err) {
        throw err
    }
}

export async function setPdfFingerprintForURL(url, fingerprint) {
    return Promise.all([
        setLocalStorage(normalize(url), fingerprint),
        setLocalStorage(
            normalize(
                browser.extension.getURL(PDF_VIEWER_URL + encodeURI(url)),
            ),
            fingerprint,
        ),
    ])
}

export async function getPdfFingerprintForURL(url) {
    return getLocalStorage(url, null)
}
