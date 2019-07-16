export interface PageAnalyzerInterface {
    extractPageContent: ExtractPageContent
}

export type ExtractPageContent = (doc?, url?: any) => any
