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
