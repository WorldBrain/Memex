import type { ContentTypes, UnifiedBlankSearchResult } from './types'
import type { SearchParams as OldSearchParams } from '../types'

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
