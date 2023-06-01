export interface PageAnalyzerInterface {
    extractRawPageContent: () => Promise<RawPageContent>
}

export type ExtractRawPageContent<Ret extends RawPageContent> = (
    doc: Document,
    url: string,
) => Ret

export type RawPageContent = RawHtmlPageContent | RawPdfPageContent
export interface RawHtmlPageContent {
    type: 'html'
    url: string
    body: string
    lang: string
    metadata: { [key: string]: string }
}
export interface RawPdfPageContent {
    type: 'pdf'
    url: string
    title?: string
}
