import type Storex from '@worldbrain/storex'
import type {
    UnifiedTermsSearchParams,
    TermsSearchOpts,
} from '@worldbrain/memex-common/lib/search/types'
import type { SearchParams as OldSearchParams } from '../types'
import type {
    Page,
    Visit,
    Bookmark,
    Annotation,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import type { WhereClause, default as Dexie } from 'dexie'
import { processCJKCharacters } from '@worldbrain/memex-stemmer/lib/transform-page-text'

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

/** Given separate result sets of the same type, gets the intersection of them / ANDs them together by ID */
const intersectResults = (results: string[][]): string[] =>
    !results.length
        ? []
        : results.reduce((a, b) => {
              const ids = new Set(b)
              return a.filter((id) => ids.has(id))
          })

// Handles switching between fuzzy and exact term matching
const queryByTerm = <T, PK>(
    clause: WhereClause<T, PK>,
    term: string,
    opts: Pick<TermsSearchOpts, 'matchTermsFuzzyStartsWith'>,
) =>
    opts.matchTermsFuzzyStartsWith
        ? clause.startsWith(term)
        : clause.equals(term)

export const queryAnnotationsByTerms = (
    storageManager: Storex,
    opts: TermsSearchOpts,
): UnifiedTermsSearchParams['queryAnnotations'] => async (
    terms,
    phrases = [],
) => {
    if (!opts.matchHighlights && !opts.matchNotes) {
        return []
    }

    const dexie = (storageManager.backend as DexieStorageBackend).dexieInstance
    const table = dexie.table<Annotation, string>('annotations')
    const resultsPerTerm = await Promise.all([
        ...terms.map((term) => {
            if (opts.matchHighlights && !opts.matchNotes) {
                return queryByTerm(
                    table.where('_body_terms'),
                    term,
                    opts,
                ).primaryKeys()
            } else if (!opts.matchHighlights && opts.matchNotes) {
                return queryByTerm(
                    table.where('_comment_terms'),
                    term,
                    opts,
                ).primaryKeys()
            }
            const coll = queryByTerm(table.where('_body_terms'), term, opts)
            return queryByTerm(
                coll.or('_comment_terms'),
                term,
                opts,
            ).primaryKeys()
        }),
        ...phrases.map((phrase) =>
            table
                .filter((a) => {
                    const inComment = a.comment
                        ?.toLocaleLowerCase()
                        .includes(phrase)
                    const inHighlight =
                        'body' in a
                            ? a.body?.toLocaleLowerCase().includes(phrase)
                            : false
                    return inComment || inHighlight
                })
                .primaryKeys(),
        ),
    ])
    const matchingIds = intersectResults(resultsPerTerm)
    return table.bulkGet(matchingIds)
}

export const queryPagesByTerms = (
    storageManager: Storex,
    opts: TermsSearchOpts,
): UnifiedTermsSearchParams['queryPages'] => async (terms, phrases = []) => {
    if (!opts.matchPageText && !opts.matchPageTitleUrl) {
        return []
    }

    const dexie = (storageManager.backend as DexieStorageBackend).dexieInstance
    const table = dexie.table<Page, string>('pages')
    const resultsPerTerm = await Promise.all([
        ...terms.map((term) => {
            if (opts.matchPageText && !opts.matchPageTitleUrl) {
                return queryByTerm(
                    table.where('terms'),
                    term,
                    opts,
                ).primaryKeys()
            } else if (!opts.matchPageText && opts.matchPageTitleUrl) {
                const coll = queryByTerm(table.where('urlTerms'), term, opts)
                return queryByTerm(
                    coll.or('titleTerms'),
                    term,
                    opts,
                ).primaryKeys()
            }
            let coll = queryByTerm(table.where('terms'), term, opts)
            coll = queryByTerm(coll.or('urlTerms'), term, opts)
            return queryByTerm(coll.or('titleTerms'), term, opts).primaryKeys()
        }),
        ...phrases.map((phrase) =>
            table
                .filter((page) =>
                    page.text?.toLocaleLowerCase().includes(phrase),
                )
                .primaryKeys(),
        ),
    ])
    const matchingIds = intersectResults(resultsPerTerm)

    // Get latest visit/bm for each page
    const latestTimestampByPageUrl = new Map<string, number>()
    const trackLatestTimestamp = ({ url, time }: Visit | Bookmark) =>
        latestTimestampByPageUrl.set(
            url,
            Math.max(time, latestTimestampByPageUrl.get(url) ?? 0),
        )
    const queryTimestamps = <T>(table: Dexie.Table<T>): Promise<T[]> =>
        table.where('url').anyOf(matchingIds).reverse().sortBy('time')

    const [visits, bookmarks] = await Promise.all([
        queryTimestamps(dexie.table<Visit>('visits')),
        queryTimestamps(dexie.table<Bookmark>('bookmarks')),
    ])

    visits.forEach(trackLatestTimestamp)
    bookmarks.forEach(trackLatestTimestamp)

    return matchingIds.map((id) => ({
        id,
        latestTimestamp: latestTimestampByPageUrl.get(id) ?? 0,
    }))
}
