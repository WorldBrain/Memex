import type {
    PageEntity as _PageEntity,
    PageMetadata as _PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'

const CROSS_REF_API_URL = 'https://api.crossref.org/works/'

type PageEntity = Omit<_PageEntity, 'id' | 'normalizedPageUrl' | 'order'>
type PageMetadata = Omit<_PageMetadata, 'normalizedPageUrl' | 'accessDate'> & {
    entities: PageEntity[]
}

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

function crossRefAuthorsToEntities(
    authors: CrossRefAPIAuthor[] = [],
): PageEntity[] {
    return authors.map((author) => ({
        isPrimary: author.sequence === 'first',
        additionalName: author.given,
        name: author.family,
    }))
}

function crossRefDateToTimestamp(date: CrossRefAPIDate): number | undefined {
    // If year field isn't there, then we can't parse the date
    if (!date?.['date-parts']?.[0]?.[0] == null) {
        return undefined
    }
    const {
        'date-parts': [yearMonthDay],
    } = date
    // Date.UTC constructor expects a 0-indexed month, thus -1 if present
    if (yearMonthDay[1] != null) {
        yearMonthDay[1] -= 1
    }
    return Date.UTC(...yearMonthDay).valueOf()
}

export async function doiToPageMetadata(params: {
    doi: string
    fetch: typeof fetch
}): Promise<PageMetadata | null> {
    const metadata: PageMetadata = { doi: params.doi, entities: [] }
    const response = await params.fetch(CROSS_REF_API_URL + params.doi)
    if (!response.ok) {
        throw new Error(
            `Failed fetching data from Crossref API - DOI: ${params.doi}`,
        )
    }

    const data: CrossRefAPIResponse = await response.json()
    if (!data?.message) {
        throw new Error(
            `Received unexpected data from Crossref API - DOI: ${params.doi}`,
        )
    }

    metadata.title = data.message.title?.[0]
    metadata.journalPage = data.message.page
    metadata.journalVolume = data.message.volume
    metadata.sourceName = data.message.publisher
    metadata.journalName = data.message['container-title']?.[0]
    metadata.journalIssue = data.message['journal-issue']?.issue
    metadata.releaseDate = crossRefDateToTimestamp(data.message.published)
    metadata.entities = crossRefAuthorsToEntities(data.message.author)
    return metadata
}
