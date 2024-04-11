import type Storex from '@worldbrain/storex'
import type { ContentTypes, UnifiedBlankSearchResult } from './types'
import type { SearchParams as OldSearchParams } from '../types'
import type {
    Page,
    Annotation,
    Visit,
    Bookmark,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import Dexie from 'dexie'

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

export const queryAnnotationsByTerms = (storageManager: Storex) => (
    terms: string[],
): Promise<Annotation[]> =>
    (storageManager.backend as DexieStorageBackend).dexieInstance
        .table('annotations')
        .where('_body_terms')
        .anyOf(terms)
        .or('_comment_terms')
        .anyOf(terms)
        .distinct()
        .toArray()

export const queryPagesByTerms = (storageManager: Storex) => async (
    terms: string[],
): Promise<Array<Page & { latestTimestamp: number }>> => {
    const dexie = (storageManager.backend as DexieStorageBackend).dexieInstance
    const pages = (await dexie
        .table('pages')
        .where('terms')
        .anyOf(terms)
        .or('urlTerms')
        .anyOf(terms)
        .or('titleTerms')
        .anyOf(terms)
        .distinct()
        .toArray()) as Page[]

    const pageUrls = pages.map((p) => p.url)

    // Get latest visit/bm for each page
    const latestTimestampByPageUrl = new Map<string, number>()
    const trackLatestTimestamp = ({ url, time }: Visit | Bookmark) =>
        latestTimestampByPageUrl.set(
            url,
            Math.max(time, latestTimestampByPageUrl.get(url) ?? 0),
        )
    const queryTimestamps = <T>(table: Dexie.Table): Promise<T[]> =>
        table.where('url').anyOf(pageUrls).reverse().sortBy('time')

    const [visits, bookmarks] = await Promise.all([
        queryTimestamps<Visit>(dexie.table('visits')),
        queryTimestamps<Bookmark>(dexie.table('bookmarks')),
    ])

    visits.forEach(trackLatestTimestamp)
    bookmarks.forEach(trackLatestTimestamp)

    return pages.map((p) => ({
        ...p,
        latestTimestamp: latestTimestampByPageUrl.get(p.url) ?? 0,
    }))
}
