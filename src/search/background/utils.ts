import type Storex from '@worldbrain/storex'
import type {
    ContentTypes,
    UnifiedBlankSearchResult,
    UnifiedTermsSearchParams,
} from './types'
import type { SearchParams as OldSearchParams } from '../types'
import type {
    Page,
    Visit,
    Bookmark,
    Annotation,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import type Dexie from 'dexie'

export const contentTypeChecks = {
    pagesOnly: (flags: ContentTypes) =>
        flags.pages && !flags.highlights && !flags.notes,
    annotsOnly: (flags: ContentTypes) =>
        !flags.pages && (flags.highlights || flags.notes),
    combined: (flags: ContentTypes) =>
        flags.pages && (flags.highlights || flags.notes),
    noop: (flags: ContentTypes) =>
        !flags.pages && !flags.highlights && !flags.notes,
}

export const reshapeParamsForOldSearch = (params): OldSearchParams => ({
    lists: params.collections,
    bookmarks: params.bookmarksOnly,
    domains: params.domainsInc,
    domainsExclude: params.domainsExc,
    tags: params.tagsInc,
    tagsExc: params.tagsExc,
    terms: params.termsInc,
    termsExclude: params.termsExc,
    limit: params.limit,
    skip: params.skip,
    startDate: Number(params.startDate) || undefined,
    endDate: Number(params.endDate) || undefined,
})

export const reshapeAnnotForDisplay = ({
    url,
    pageUrl,
    body,
    comment,
    createdWhen,
    tags,
    hasBookmark,
}) => ({
    url,
    pageUrl,
    body,
    comment,
    createdWhen,
    tags: tags.map((tag) => tag.name),
    hasBookmark,
})

export const reshapePageForDisplay = (page) => ({
    url: page.url,
    fullUrl: page.fullUrl,
    title: page.fullTitle,
    text: page.text,
    hasBookmark: page.hasBookmark,
    screenshot: page.screenshot,
    favIcon: page.favIcon,
    annotations: page.annotations ?? [],
    tags: page.tags,
    lists: page.lists,
    displayTime: page.displayTime,
    annotsCount: page.annotsCount,
})

export const sortUnifiedBlankSearchResult = ({
    resultDataByPage,
}: UnifiedBlankSearchResult) =>
    [...resultDataByPage].sort(
        ([, a], [, b]) =>
            Math.max(
                b.latestPageTimestamp,
                b.annotations[0]?.lastEdited.valueOf() ?? 0,
            ) -
            Math.max(
                a.latestPageTimestamp,
                a.annotations[0]?.lastEdited.valueOf() ?? 0,
            ),
    )

/** Given separate result sets of the same type, gets the intersection of them / ANDs them together by ID */
const intersectResults = <T extends { url: string }>(results: T[][]): T[] =>
    results.reduce((a, b) => {
        const ids = new Set(b.map((r) => r.url))
        return a.filter((r) => ids.has(r.url))
    })

export const queryAnnotationsByTerms = (
    storageManager: Storex,
): UnifiedTermsSearchParams['queryAnnotations'] => async (terms) => {
    const dexie = (storageManager.backend as DexieStorageBackend).dexieInstance
    const resultsPerTerm = await Promise.all(
        terms.map((term) =>
            dexie
                .table<Annotation>('annotations')
                .where('_body_terms')
                .startsWith(term)
                .or('_comment_terms')
                .startsWith(term)
                .distinct()
                .toArray(),
        ),
    )
    return intersectResults(resultsPerTerm)
}

export const queryPagesByTerms = (
    storageManager: Storex,
): UnifiedTermsSearchParams['queryPages'] => async (terms) => {
    const dexie = (storageManager.backend as DexieStorageBackend).dexieInstance
    const resultsPerTerm = await Promise.all(
        terms.map((term) =>
            dexie
                .table<Page>('pages')
                .where('terms')
                .startsWith(term)
                .or('urlTerms')
                .startsWith(term)
                .or('titleTerms')
                .startsWith(term)
                .distinct()
                .toArray(),
        ),
    )
    const pages = intersectResults(resultsPerTerm)

    // Get latest visit/bm for each page
    const latestTimestampByPageUrl = new Map<string, number>()
    const trackLatestTimestamp = ({ url, time }: Visit | Bookmark) =>
        latestTimestampByPageUrl.set(
            url,
            Math.max(time, latestTimestampByPageUrl.get(url) ?? 0),
        )
    const queryTimestamps = <T>(table: Dexie.Table<T>): Promise<T[]> =>
        table
            .where('url')
            .anyOf(pages.map((p) => p.url))
            .reverse()
            .sortBy('time')

    const [visits, bookmarks] = await Promise.all([
        queryTimestamps(dexie.table<Visit>('visits')),
        queryTimestamps(dexie.table<Bookmark>('bookmarks')),
    ])

    visits.forEach(trackLatestTimestamp)
    bookmarks.forEach(trackLatestTimestamp)

    return pages.map((p) => ({
        ...p,
        latestTimestamp: latestTimestampByPageUrl.get(p.url) ?? 0,
    }))
}
