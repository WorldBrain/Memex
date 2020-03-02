export interface PageAnalyzerInterface {
    extractRawPageContent: ExtractRawPageContent
}

export type ExtractRawPageContent = (
    doc?: Document,
    url?: string,
) => Promise<RawPageContent>
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
}
