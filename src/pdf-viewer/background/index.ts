import { browser, Extension, Storage } from 'webextension-polyfill-ts'
import PDFJS from 'pdfjs-dist'

import normalize from 'src/util/encode-url-for-id'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { PDFJS_WORKER_PATH } from '../constants'

export interface Props {
    storageAPI?: Storage.Static
    extAPI?: Extension.Static
    pdfJs?: PDFJS
    pdfJsWorkerPath?: string
    normalizer?: typeof normalize
}

export default class PDFViewerBackground {
    private storageAPI: Storage.Static
    private extAPI: Extension.Static
    private pdfJs: PDFJS
    private pdfJsWorkerPath: string
    private urlNormalizer: typeof normalize

    constructor({
        storageAPI = browser.storage,
        extAPI = browser.extension,
        pdfJs = PDFJS,
        pdfJsWorkerPath = PDFJS_WORKER_PATH,
        normalizer = normalize,
    }: Props) {
        this.storageAPI = storageAPI
        this.extAPI = extAPI
        this.pdfJs = pdfJs
        this.pdfJsWorkerPath = pdfJsWorkerPath
        this.urlNormalizer = normalizer

        this.setupPdfJsWorker()
    }

    private setupPdfJsWorker() {
        if (!this.pdfJsWorkerPath) {
            return
        }

        this.pdfJs.workerSrc = this.extAPI.getURL(this.pdfJsWorkerPath)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            getPdfFingerprint: this.getPdfFingerprintForUrl.bind(this),
        })
    }

    private async fetchPdfFingerprint(url: string) {
        const pdf = await this.pdfJs.getDocument(url)
        return pdf.fingerprint
    }

    async getPdfUrlForFingerprint(fingerprint: string): Promise<string | null> {
        const storage = await this.storageAPI.local.get(fingerprint)

        if (storage[fingerprint] == null) {
            return null
        }

        return storage[fingerprint]
    }

    async getPdfFingerprintForUrl(url: string): Promise<string> {
        url = this.urlNormalizer(url)
        const storage = await this.storageAPI.local.get(url)

        if (storage[url] == null) {
            const fingerprint = await this.fetchPdfFingerprint(url)
            await this.storageAPI.local.set({
                [url]: fingerprint,
                [fingerprint]: url,
            })
            return fingerprint
        }

        return storage[url]
    }
}
