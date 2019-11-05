export interface PageDataResult {
    content: PageContent
    favIconURI?: string
}

export interface PageContent {
    canonicalUrl?: string
    description?: string
    keywords?: string[]
    fullText?: string
    title?: string
    lang?: string
}
