export interface PageAnalyzerInterface {
    extractPageContent: ExtractPageContent
}

export type ExtractPageContent = (doc, url: string) => any
