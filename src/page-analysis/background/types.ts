import { PipelineRes } from 'src/search'

export type PageContent = PipelineRes

export interface PageDataResult {
    favIconURI?: string
    htmlBody?: string
    pdfFingerprints?: string[]
    content?: {
        canonicalUrl?: string
        description?: string
        keywords?: string[]
        fullText?: string
        title?: string
        lang?: string
    }
}

export interface FetchPageProcessor {
    process(
        url: string,
    ): Promise<{
        content: PageContent
        htmlBody?: string
        pdfFingerprints?: string[]
    }>
}
