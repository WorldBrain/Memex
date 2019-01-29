/* eslint eqeqeq: 0 */
export default function getPDFFingerprint(pdfURL) {
    const PDFJS = require('../../build/pdf')
    PDFJS.GlobalWorkerOptions.workerSrc = '../../build/pdf.worker.js'
    return new Promise((resolve, reject) => {
        PDFJS.getDocument(pdfURL)
            .then(pdf => {
                console.log(pdf.fingerprint)
                resolve(pdf.fingerprint)
            })
            .catch(err => reject(err))
    })
}
