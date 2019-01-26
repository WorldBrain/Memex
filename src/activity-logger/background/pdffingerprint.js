/* eslint eqeqeq: 0 */
export default function getPDFFingerprint(pdfURL) {
    const PDFJS = require('pdfjs-dist')
    PDFJS.workerSrc = browser.extension.getURL('/lib/pdf.worker.min.js')
    return new Promise((resolve, reject) => {
        PDFJS.getDocument(pdfURL)
            .then(pdf => resolve(pdf.fingerprint))
            .catch(err => reject(err))
    })
}
