export interface PDFData extends Metadata {
    text: string
}

export interface Metadata {
    author: string
    title: string
    keywords: string[]
}
