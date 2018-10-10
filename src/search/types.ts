import Storex, { StorageCollection } from 'storex'
import { FindManyOptions } from 'storex/types'
import DexieOrig from 'dexie'
import { FilterQuery } from 'dexie-mongoify'

import { Page, Visit, Bookmark, Tag, FavIcon } from './models'

export type SuggestOptions = FindManyOptions & { includePks?: boolean }
export type SuggestResult<S, P> = Array<{
    collection: string
    suggestion: S
    pk: P
}>

interface MemexCollection extends StorageCollection {
    suggestObjects<S, P = any>(
        query,
        options?: SuggestOptions,
    ): Promise<SuggestResult<S, P>>
}

export interface StorageManager extends Storex {
    collection(name: string): MemexCollection
    deleteDB(name: string): IDBOpenDBRequest
}

export interface Dexie extends DexieOrig {
    /**
     * Represents page data - our main data type.
     */
    pages: DexieOrig.Table<Page, string>

    /**
     * Represents page visit timestamp and activity data.
     */
    visits: DexieOrig.Table<Visit, [number, string]>

    /**
     * Represents page visit timestamp and activity data.
     */
    bookmarks: DexieOrig.Table<Bookmark, string>

    /**
     * Represents tags associated with Pages.
     */
    tags: DexieOrig.Table<Tag, [string, string]>

    /**
     * Represents fav-icons associated with hostnames.
     */
    favIcons: DexieOrig.Table<FavIcon, string>
    // Quick typings as `dexie-mongoify` doesn't contain any
    collection: <T>(
        name: string,
    ) => {
        find(query: FilterQuery<T>): DexieOrig.Collection<T, any>
        count(query: FilterQuery<T>): Promise<number>
        update(
            query: FilterQuery<T>,
            update,
        ): Promise<{ modifiedCount: number }>
        remove(query: FilterQuery<T>): Promise<{ deletedCount: number }>
    }
}

export type VisitInput = number
export type BookmarkInput = number
export type PageID = string
export type PageScore = number
export type SearchResult = [PageID, PageScore]
export type TermsIndexName = 'terms' | 'urlTerms' | 'titleTerms'
export type PageResultsMap = Map<PageID, PageScore>

export interface SearchParams {
    domains: string[]
    domainsExclude: string[]
    tags: string[]
    terms: string[]
    termsExclude: string[]
    bookmarks: boolean
    endDate?: number
    startDate?: number
    skip?: number
    limit?: number
    lists: string[]
}

export interface FilteredURLs {
    include: Set<string>
    exclude: Set<string>
    isDataFiltered: boolean
    isAllowed(url: string): boolean
}

/**
 * @typedef {Object} VisitInteraction
 * @property {number} duration Time user was active during visit (ms).
 * @property {number} scrollPx Y-axis pixel scrolled to at point in time.
 * @property {number} scrollPerc
 * @property {number} scrollMaxPx Furthest y-axis pixel scrolled to during visit.
 * @property {number} scrollMaxPerc
 */
export interface VisitInteraction {
    duration: number
    scrollPx: number
    scrollPerc: number
    scrollMaxPx: number
    scrollMaxPerc: number
}

/**
 * @typedef {Object} PageAddRequest
 * @property {any} pageData TODO: type
 * @property {number[]} [visits=[]] Opt. visit times to assoc. with Page.
 * @property {number} [bookmark] Opt. bookmark time to assoc. with Page.
 */
export interface PageAddRequest {
    pageDoc: PageDoc
    visits: VisitInput[]
    bookmark: BookmarkInput
    rejectNoContent?: boolean
}

export interface PageDoc {
    content: Partial<PageContent>
    url: string
    favIconURI?: string
    screenshotURI?: string
    [extra: string]: any
}

export interface PageContent {
    fullText: string
    title: string
    lang?: string
    canonicalUrl?: string
    description?: string
    keywords?: string[]
}

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
    favIconURI?: string
    screenshotURI?: string
    text: string
}
