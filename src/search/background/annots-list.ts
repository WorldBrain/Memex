import { browser } from 'webextension-polyfill-ts'
import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import diff from 'lodash/difference'

import { INSTALL_TIME_KEY } from 'src/constants'
import { AnnotSearchParams } from 'src/search/background/types'
import { Annotation } from 'src/direct-linking/types'
import AnnotsStorage from 'src/direct-linking/background/storage'
const moment = require('moment-timezone')

export class AnnotationsListPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static LIST_OP_ID = 'memex:dexie.listAnnotations'
    static LIST_BY_PAGE_OP_ID = 'memex:dexie.listAnnotationsByPage'
    static LIST_BY_DAY_OP_ID = 'memex:dexie.listAnnotationsByDay'
    static DEF_INNER_LIMIT_MULTI = 2

    install(backend: DexieStorageBackend) {
        super.install(backend)

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
        let tags = await this.backend.dexieInstance
            .table<any, [string, string]>(AnnotsStorage.TAGS_COLL)
            .where('url')
            .anyOf(urls)
            .primaryKeys()

        if (params.tagsExc && params.tagsExc.length) {
            const tagsExc = new Set(params.tagsExc)
            tags = tags.filter(([name]) => !tagsExc.has(name))
        }

        if (params.tagsInc && params.tagsInc.length) {
            const tagsInc = new Set(params.tagsInc)
            tags = tags.filter(([name]) => tagsInc.has(name))
        }

        const tagUrls = new Set(tags.map(([, url]) => url))
        return urls.filter(url => tagUrls.has(url))
    }

    private async filterByCollections(
        urls: string[],
        params: AnnotSearchParams,
    ) {
        const [listIds, entries] = await Promise.all([
            this.backend.dexieInstance
                .table<any, number>(AnnotsStorage.LISTS_COLL)
                .where('name')
                .anyOf(params.collections)
                .primaryKeys(),
            this.backend.dexieInstance
                .table<any, [number, string]>(AnnotsStorage.LIST_ENTRIES_COLL)
                .where('url')
                .anyOf(urls)
                .primaryKeys(),
        ])

        const lists = new Set(listIds)
        const entryUrls = new Set(
            entries
                .filter(([listId]) => lists.has(listId))
                .map(([, url]) => url),
        )

        return urls.filter(url => entryUrls.has(url))
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

        return results
    }

    private async calcHardLowerTimeBound({ startDate }: AnnotSearchParams) {
        const annotsRelease = startDate
            ? moment(startDate)
            : moment('2018-06-01')

        const {
            [INSTALL_TIME_KEY]: installTime,
        } = await browser.storage.local.get(INSTALL_TIME_KEY)

        return annotsRelease.isAfter(installTime)
            ? annotsRelease
            : moment(installTime)
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

    private termsMatch = ({
        termsInc,
        includeHighlights,
        includeNotes,
    }: AnnotSearchParams) => ({ _body_terms, _comment_terms }: Annotation) => {
        const highlightsMatch = includeHighlights
            ? diff(termsInc, _body_terms).length === 0
            : true

        const notesMatch = includeNotes
            ? diff(termsInc, _comment_terms).length === 0
            : true

        if (includeHighlights && includeNotes) {
            return notesMatch || highlightsMatch
        }

        if (includeHighlights && !includeNotes) {
            return highlightsMatch
        }

        if (!includeHighlights && includeNotes) {
            return notesMatch
        }
    }

    private async queryAnnotsByDay(
        startDate: number,
        endDate: null,
        params: AnnotSearchParams,
    ) {
        const collection = this.backend.dexieInstance
            .table<Annotation>(AnnotsStorage.ANNOTS_COLL)
            .where('lastEdited')
            .between(startDate, endDate, true, true)
            .reverse()

        if (params.termsInc && params.termsInc.length) {
            collection.filter(this.termsMatch(params))
        }

        return collection.toArray()
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
                dateCursor.valueOf(),
                upperBound.toDate(),
                params,
            )

            const filteredPks = new Set(
                await this.filterResults(annots.map(a => a.url), params),
            )
            annots = annots.filter(annot => filteredPks.has(annot.url))

            this.mergeResults(results, this.clusterAnnotsByPage(annots))
        }

        // Cut off any excess
        if (results.size > params.limit) {
            results = new Map([...results].slice(0, params.limit))
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
