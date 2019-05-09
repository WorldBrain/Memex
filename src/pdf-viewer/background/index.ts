import { browser, Extension, Storage } from 'webextension-polyfill-ts'
import PDFJS from 'pdfjs-dist'

import normalize from 'src/util/encode-url-for-id'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { PDFJS_WORKER_PATH } from '../constants'
import { Metadata, PDFData } from './types'

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
            getPdfUrl: this.getPdfUrlForFingerprint.bind(this),
            getPdfData: this.getPdfData.bind(this),
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
        const normalized = this.urlNormalizer(url)
        const storage = await this.storageAPI.local.get(normalized)

        if (storage[normalized] == null) {
            const fingerprint = await this.fetchPdfFingerprint(url)
            await this.storageAPI.local.set({
                [normalized]: fingerprint,
                [fingerprint]: normalized,
            })
            return fingerprint
        }

        return storage[normalized]
    }

    private async getPdfText(pdf, pageDelimiter = ' '): Promise<string> {
        // Read text from pages one by one (in parallel may be too heavy)
        const pageTexts: string[] = []

        for (let i = 1; i <= pdf.pdfInfo.numPages; i++) {
            const page = await pdf.getPage(i)
            // wait for object containing items array with text pieces
            const pageItems = await page.getTextContent()
            const pageText = pageItems.items.map(item => item.str).join(' ')
            pageTexts.push(pageText)
        }

        return pageTexts.join(pageDelimiter)
    }

    private async getPdfMetadata(pdf): Promise<Metadata> {
        const metadata = await pdf.getMetadata()

        return {
            author: metadata.info.Author,
            title: metadata.info.Title,
            keywords: metadata.info.Keywords,
        }
    }

    async getPdfData(url: string): Promise<PDFData> {
        const pdf = await this.pdfJs.getDocument(url)

        const metadata = await this.getPdfMetadata(pdf)
        const text = await this.getPdfText(pdf)

        return { ...metadata, text }
    }
}
