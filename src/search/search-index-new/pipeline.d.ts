import { PageDoc } from './types'

export interface PipelineReq {
    pageDoc: PageDoc
    rejectNoContent?: boolean
}

export interface PipelineRes {
    url: string

    // Display data
    fullUrl: string
    fullTitle: string

    // Indexed data
    domain: string
    hostname: string
    tags: string[]
    terms: string[]
    urlTerms: string[]
    titleTerms: string[]

    // Misc.
    favIconURI: string
    screenshotURI: string
    text: string
}

export default function pipeline(props: PipelineReq): Promise<PipelineRes>

export interface URLParts {
    domain: string
    hostname: string
    pathname: string
}

export function transformUrl(url: string): URLParts
export function extractTerms(text: string): Set<string>
