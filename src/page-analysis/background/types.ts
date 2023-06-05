import { PipelineRes } from 'src/search'

export type PageContent = PipelineRes

export interface FetchPageProcessor {
    process(
        url: string,
    ): Promise<{
        content: PageContent
        htmlBody?: string
        pdfFingerprints?: string[]
    }>
}
