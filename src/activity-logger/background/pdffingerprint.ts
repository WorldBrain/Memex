import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { browser } from 'webextension-polyfill-ts'
import normalize from 'src/util/encode-url-for-id'

/* eslint eqeqeq: 0 */
export default async function getPdfFingerprint(pdfURL) {
    const PDFJS = require('../../build/pdf')
    PDFJS.GlobalWorkerOptions.workerSrc = '../../build/pdf.worker.js'
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
                browser.extension.getURL(
                    `web/viewer.html?file=${encodeURI(url)}`,
                ),
            ),
            fingerprint,
        ),
    ])
}

export async function getPdfFingerprintForURL(url) {
    return getLocalStorage(url, null)
}
