import { PipelineRes } from 'src/search'

export type PageContent = PipelineRes

export interface PageDataResult {
    favIconURI?: string
    content: {
        canonicalUrl?: string
        description?: string
        keywords?: string[]
        fullText?: string
        title?: string
        lang?: string
    }
}

export interface FetchPageProcessor {
    process(url: string): Promise<PageContent>
}
