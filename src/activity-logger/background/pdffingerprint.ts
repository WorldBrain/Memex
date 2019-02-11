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
