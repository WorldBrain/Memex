import type fetch from 'node-fetch'
import type { PageMetadata as _PageMetadata } from '@worldbrain/memex-common/lib/types/core-data-types/client'

const CROSS_REF_API_URL = 'https://api.crossref.org/works/'
type PageMetadata = Omit<_PageMetadata, 'normalizedPageUrl' | 'accessDate'>

interface CrossRefAPIAuthor {
    given: string
    family: string
    sequence: 'first' | 'additional'
}

interface CrossRefAPIDate {
    /** Contains a date of year in an array with 3 members, representing year, month, and day, respectively. */
    'date-parts': [[number, number, number]]
}

interface CrossRefAPIResponse {
    message: {
        type: string
        publisher: string
        /** Paper name */
        title: [string]
        /** Journal volume */
        volume: string
        /** Journal page */
        page: string
        author: CrossRefAPIAuthor[]
        /** Publication */
        'container-title': [string]
        'journal-issue': { issue: string; 'published-print': CrossRefAPIDate }
        published: CrossRefAPIDate
    }
}

function crossRefDateToDate(date: CrossRefAPIDate): Date {
    // TODO
    return null
}

export async function doiToPageMetadata(params: {
    doi: string
    fetch: typeof fetch
}): Promise<PageMetadata | null> {
    let metadata: PageMetadata = { doi: params.doi }
    const error = new Error(
        `Failed fetching data from Crossref API - DOI: ${params.doi}`,
    )
    try {
        const response = await params.fetch(CROSS_REF_API_URL + params.doi)
        if (!response.ok) {
            throw error
        }

        const responseJson: CrossRefAPIResponse = await response.json()
        // TODO: deal with this
    } catch (err) {
        throw error
    }

    return metadata
}
