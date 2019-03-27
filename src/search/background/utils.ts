import { Annotation } from 'src/direct-linking/types'
import { ContentTypes, AnnotSearchParams, AnnotPage } from './types'
import { Page } from '..'
import { SearchParams as OldSearchParams } from '../types'

export const pageSearchOnly = (flags: ContentTypes) =>
    flags.pages && !flags.highlights && !flags.notes

export const annotSearchOnly = (flags: ContentTypes) =>
    !flags.pages && (flags.highlights || flags.notes)

export const reshapeParamsForOldSearch = (
    params: AnnotSearchParams,
): OldSearchParams => ({
    lists: params.collections,
    bookmarks: params.bookmarksOnly,
    domains: params.domainsInc,
    domainsExclude: params.domainsExc,
    tags: params.tagsInc,
    terms: params.termsInc,
    termsExclude: params.termsExc,
    limit: params.limit,
    skip: params.skip,
    startDate: Number(params.startDate) || undefined,
    endDate: Number(params.endDate) || undefined,
})

export const pageToAnnotPage = (
    page: Page,
    annotations: Annotation[] = [],
): AnnotPage => ({
    url: page.url,
    title: page.fullTitle,
    hasBookmark: page.hasBookmark,
    annotations,
})
