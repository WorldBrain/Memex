import { Tabs } from 'webextension-polyfill-ts'

export interface PDFData extends Metadata {
    text: string
}

export interface Metadata {
    author: string
    title: string
    keywords: string[]
}

interface TabArg {
    tab: Tabs.Tab
}

export interface PdfRemoteFunctionsInterface {
    getPdfFingerprint(_: any, url: string): Promise<string>
    getPdfUrl(_: any, print: string): Promise<string | null>
    getPdfData(_: any, url: string): Promise<PDFData>
    openPdfViewer({ tab }: TabArg, url?: string): Promise<any>
}
