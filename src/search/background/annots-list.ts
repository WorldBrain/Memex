import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { AnnotSearchParams } from './types'
import { transformUrl } from '../pipeline'
import { Annotation } from 'src/direct-linking/types'
import AnnotsStorage from 'src/direct-linking/background/storage'
const moment = require('moment-timezone')

export class AnnotationsListPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static TERMS_SEARCH_OP_ID = 'memex:dexie.searchAnnotations'
    static LIST_BY_PAGE_OP_ID = 'memex:dexie.listAnnotationsByPage'
    static LIST_BY_DAY_OP_ID = 'memex:dexie.listAnnotationsByDay'
    static DEF_INNER_LIMIT_MULTI = 2

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            AnnotationsListPlugin.TERMS_SEARCH_OP_ID,
            this.searchAnnots.bind(this),
        )

        backend.registerOperation(
            AnnotationsListPlugin.LIST_BY_PAGE_OP_ID,
            this.listAnnotsByPage.bind(this),
        )

        backend.registerOperation(
            AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
            this.listAnnotsByDay.bind(this),
        )
    }

    private listWithUrl = ({
        url,
        endDate,
        startDate,
    }: Partial<AnnotSearchParams>) => {
        if (!url) {
            throw new Error('URL must be supplied to list annotations.')
        }

        const coll = this.backend.dexieInstance
            .table<Annotation, string>(AnnotsStorage.ANNOTS_COLL)
            .where('pageUrl')
            .equals(url)

        if (!startDate && !endDate) {
            return coll
        }
        // Set defaults
        startDate = startDate || 0
        endDate = endDate || Date.now()

        // Ensure ms extracted from any Date instances
        startDate = startDate instanceof Date ? startDate.getTime() : startDate
        endDate = endDate instanceof Date ? endDate.getTime() : endDate

        return coll.filter(({ lastEdited }) => {
            const time = lastEdited.getTime()
            return time >= startDate && time <= endDate
        })
    }

    private async filterByBookmarks(urls: string[]) {
        return this.backend.dexieInstance
            .table<any, string>(AnnotsStorage.BMS_COLL)
            .where('url')
            .anyOf(urls)
            .primaryKeys()
    }

    private async filterByTags(urls: string[], params: AnnotSearchParams) {
        const tagsExc =
            params.tagsExc && params.tagsExc.length
                ? new Set(params.tagsExc)
                : null
        const tagsInc =
            params.tagsInc && params.tagsInc.length
                ? new Set(params.tagsInc)
                : null

        let tagsForUrls = new Map<string, string[]>()

        await this.backend.dexieInstance
            .table<any, [string, string]>(AnnotsStorage.TAGS_COLL)
            .where('url')
            .anyOf(urls)
            .eachPrimaryKey(([tag, url]) => {
                const curr = tagsForUrls.get(url) || []
                tagsForUrls.set(url, [...curr, tag])
            })

        if (tagsExc) {
            tagsForUrls = new Map(
                [...tagsForUrls].filter(([, tags]) =>
                    tags.some(tag => !tagsExc.has(tag)),
                ),
            )
        }

        if (tagsInc) {
            tagsForUrls = new Map(
                [...tagsForUrls].filter(([, tags]) =>
                    tags.some(tag => tagsInc.has(tag)),
                ),
            )
        }

        return urls.filter(url => {
            if (!tagsInc) {
                // Make sure current url doesn't have any excluded tag
                const urlTags = tagsForUrls.get(url) || []
                return urlTags.some(tag => !tagsExc.has(tag))
            }

            return tagsForUrls.has(url)
        })
    }

    private async filterByCollections(
        urls: string[],
        params: AnnotSearchParams,
    ) {
        const ids = params.collections.map(id => Number(id))

        const pageEntries = await this.backend.dexieInstance
            .table('pageListEntries')
            .where('listId')
            .anyOf(ids)
            .primaryKeys()

        const pageUrls = new Set(pageEntries.map(pk => pk[1]))

        return this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .where('url')
            .anyOf(urls)
            .and(annot => pageUrls.has(annot.pageUrl))
            .primaryKeys() as Promise<string[]>

        // IMPLEMENTATION FOR ANNOTS COLLECTIONS
        // const [listIds, entries] = await Promise.all([
        //     this.backend.dexieInstance
        //         .table<any, number>(AnnotsStorage.LISTS_COLL)
        //         .where('name')
        //         .anyOf(params.collections)
        //         .primaryKeys(),
        //     this.backend.dexieInstance
        //         .table<any, [number, string]>(AnnotsStorage.LIST_ENTRIES_COLL)
        //         .where('url')
        //         .anyOf(urls)
        //         .primaryKeys(),
        // ])

        // const lists = new Set(listIds)
        // const entryUrls = new Set(
        //     entries
        //         .filter(([listId]) => lists.has(listId))
        //         .map(([, url]) => url),
        // ))
    }

    private async filterByDomains(
        urls: string[],
        { domainsInc, domainsExc }: AnnotSearchParams,
    ) {
        const inc = domainsInc && domainsInc.length ? new Set(domainsInc) : null
        const exc = new Set(domainsExc)

        return urls.filter(url => {
            const { domain } = transformUrl(url)

            if (!inc) {
                return !exc.has(domain)
            }

            return inc.has(domain) && !exc.has(domain)
        })
    }

    private async mapUrlsToAnnots(urls: string[]): Promise<Annotation[]> {
        const annotUrlMap = new Map<string, Annotation>()

        await this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .where('url')
            .anyOf(urls)
            .each(annot => annotUrlMap.set(annot.url, annot))

        // Ensure original order of input is kept
        return urls.map(url => annotUrlMap.get(url))
    }

    private async filterResults(results: string[], params: AnnotSearchParams) {
        if (params.bookmarksOnly) {
            results = await this.filterByBookmarks(results)
        }

        if (
            (params.tagsInc && params.tagsInc.length) ||
            (params.tagsExc && params.tagsExc.length)
        ) {
            results = await this.filterByTags(results, params)
        }

        if (params.collections && params.collections.length) {
            results = await this.filterByCollections(results, params)
        }

        if (
            (params.domainsExc && params.domainsInc.length) ||
            (params.domainsExc && params.domainsExc.length)
        ) {
            results = await this.filterByDomains(results, params)
        }

        return results
    }

    private async calcHardLowerTimeBound({ startDate }: AnnotSearchParams) {
        const earliestAnnot: Annotation = await this.backend.dexieInstance
            .table(AnnotsStorage.ANNOTS_COLL)
            .orderBy('lastEdited')
            .first()

        if (
            earliestAnnot &&
            moment(earliestAnnot.lastEdited).isAfter(startDate || 0)
        ) {
            return moment(earliestAnnot.lastEdited)
        }

        return startDate ? moment(new Date(startDate)) : moment('2018-06-01') // The date annots feature was released
    }

    private mergeResults(
        a: Map<number, Map<string, Annotation[]>>,
        b: Map<number, Map<string, Annotation[]>>,
    ) {
        for (const [date, pagesB] of b) {
            const pagesA = a.get(date) || new Map()

            for (const [page, annotsB] of pagesB) {
                const existing = pagesA.get(page) || []
                pagesA.set(page, [...existing, ...annotsB])
            }

            a.set(date, pagesA)
        }
    }

    private clusterAnnotsByDays(
        annots: Annotation[],
    ): Map<number, Annotation[]> {
        const annotsByDays = new Map<number, Annotation[]>()

        for (const annot of annots.sort(
            (a, b) => b.lastEdited.getTime() - a.lastEdited.getTime(),
        )) {
            const date = moment(annot.lastEdited)
                .startOf('day')
                .toDate()
            const existing = annotsByDays.get(date.getTime()) || []
            annotsByDays.set(date.getTime(), [...existing, annot])
        }

        return annotsByDays
    }

    private clusterAnnotsByPage(
        annots: Annotation[],
    ): Map<number, Map<string, Annotation[]>> {
        const annotsByPage = new Map<number, Map<string, Annotation[]>>()

        for (const [date, matching] of this.clusterAnnotsByDays(annots)) {
            const pageMap = new Map<string, Annotation[]>()

            for (const annot of matching) {
                const existing = pageMap.get(annot.pageUrl) || []
                pageMap.set(annot.pageUrl, [...existing, annot])
            }

            annotsByPage.set(date, pageMap)
        }

        return annotsByPage
    }

    private async queryAnnotsByDay(startDate: Date, endDate: Date) {
        const collection = this.backend.dexieInstance
            .table<Annotation>(AnnotsStorage.ANNOTS_COLL)
            .where('lastEdited')
            .between(startDate, endDate, true, true)
            .reverse()

        return collection.toArray()
    }

    private async queryTermsField(
        args: {
            field: string
            term: string
        },
        { startDate, endDate }: AnnotSearchParams,
    ): Promise<string[]> {
        let coll = this.backend.dexieInstance
            .table<Annotation>(AnnotsStorage.ANNOTS_COLL)
            .where(args.field)
            .equals(args.term)

        if (startDate || endDate) {
            coll = coll.filter(
                annot =>
                    annot.lastEdited >= new Date(startDate || 0) &&
                    annot.lastEdited <= new Date(endDate || Date.now()),
            )
        }

        return coll.primaryKeys() as Promise<string[]>
    }

    private async lookupTerms({
        termsInc,
        includeHighlights,
        includeNotes,
        ...params
    }: AnnotSearchParams) {
        const fields = []

        if (includeHighlights) {
            fields.push('_body_terms')
        }
        if (includeNotes) {
            fields.push('_comment_terms')
        }

        const results = new Map<string, string[]>()

        // Run all needed queries for each term and on each field concurrently
        for (const term of termsInc) {
            const termRes = await Promise.all(
                fields.map(field =>
                    this.queryTermsField({ field, term }, params),
                ),
            )

            // Collect all results from each field for this term
            results.set(term, [...new Set([].concat(...termRes))])
        }

        // Get intersection of results for all terms (all terms must match)
        const intersected = [...results.values()].reduce((a, b) => {
            const bSet = new Set(b)
            return a.filter(res => bSet.has(res))
        })

        return intersected
    }

    private async paginateAnnotsResults(
        results: string[],
        { skip, limit }: AnnotSearchParams,
    ) {
        const internalPageSize = limit * 2
        const annotsByPage = new Map<string, Annotation[]>()
        const seenPages = new Set<string>()
        let internalSkip = 0

        while (annotsByPage.size < limit) {
            const resSlice = results.slice(
                internalSkip,
                internalSkip + internalPageSize,
            )

            if (!resSlice.length) {
                break
            }

            const annots = await this.mapUrlsToAnnots(resSlice)

            annots.forEach(annot => {
                seenPages.add(annot.pageUrl)
                const prev = annotsByPage.get(annot.pageUrl) || []

                if (annotsByPage.size !== limit && seenPages.size > skip) {
                    annotsByPage.set(annot.pageUrl, [...prev, annot])
                }
            })

            internalSkip += internalPageSize
        }

        return annotsByPage
    }

    async searchAnnots(params: AnnotSearchParams) {
        const termsSearchResults = await this.lookupTerms(params)

        const filteredResults = await this.filterResults(
            termsSearchResults,
            params,
        )

        const annotsByPage = await this.paginateAnnotsResults(
            filteredResults,
            params,
        )

        return annotsByPage
    }

    /**
     * Don't use `params.skip` for pagination. Instead, as results
     *  are ordered by day, use `params.endDate`.
     */
    async listAnnotsByDay(params: AnnotSearchParams) {
        const hardLowerLimit = await this.calcHardLowerTimeBound(params)
        let dateCursor = params.endDate
            ? moment(params.endDate)
            : moment().endOf('day')

        let results = new Map<number, Map<string, Annotation[]>>()

        while (
            results.size < params.limit &&
            dateCursor.isAfter(hardLowerLimit)
        ) {
            const upperBound = dateCursor.clone()

            // Keep going back `limit` days until enough results, or until hard lower limit hit
            if (dateCursor.diff(hardLowerLimit, 'days') < params.limit) {
                dateCursor = hardLowerLimit
            } else {
                dateCursor.subtract(params.limit, 'days')
            }

            let annots = await this.queryAnnotsByDay(
                dateCursor.toDate(),
                upperBound.toDate(),
            )

            const filteredPks = new Set(
                await this.filterResults(
                    annots.map(a => a.url),
                    params,
                ),
            )
            annots = annots.filter(annot => filteredPks.has(annot.url))

            this.mergeResults(results, this.clusterAnnotsByPage(annots))
        }

        // Cut off any excess
        if (results.size > params.limit) {
            results = new Map(
                [...results].slice(params.skip, params.skip + params.limit),
            )
        }

        return results
    }

    async listAnnotsByPage(
        { limit = 10, skip = 0, ...params }: AnnotSearchParams,
        innerLimitMultiplier = AnnotationsListPlugin.DEF_INNER_LIMIT_MULTI,
    ): Promise<Annotation[]> {
        const innerLimit = limit * innerLimitMultiplier

        let results: string[] = []
        let continueLookup: boolean

        do {
            // The results found in this iteration
            let innerResults: string[] = []

            innerResults = await this.listWithUrl(params)
                .limit(innerLimit)
                .primaryKeys()

            continueLookup = innerResults.length >= innerLimit

            innerResults = await this.filterResults(innerResults, params)

            results = [...results, ...innerResults]
        } while (continueLookup)

        // Cut off any excess
        if (results.length > limit) {
            results = [...results].slice(skip, skip + limit)
        }

        return this.mapUrlsToAnnots(results)
    }
}
