export type ReadwiseResponse =
    | ReadwisePostHighlightFailedResponse
    | ReadwiseAuthenticationFailedResponse
export interface ReadwisePostHighlightFailedResponse {
    type: 'post-highlight-failed'
    status: number
}
export interface ReadwiseAuthenticationFailedResponse {
    type: 'authentication-failed'
    status: number
}

export interface ReadwiseSettings {
    apiKey?: string
}
export interface ReadwiseAPI {
    validateKey(key: string): Promise<{ success: boolean }>
    putHighlight(params: {
        highlight: ReadwiseHighlight
        key: string
    }): Promise<{ success: boolean }>
}
export interface ReadwiseHighlight {
    title: string // Page title
    source_url: string // Full URL of the page
    source_type: 'article'
    note: string // annotation comment
    location_type: 'time_offset'
    highlighted_at: Date
    highlight_url: string // Local annotation URL
    text: string // annotation body
}

// https://readwise.io/api/v2/highlights/()
