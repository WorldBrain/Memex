import { Dexie } from 'dexie'
import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

import { AnnotSearchParams } from 'src/search/background/types'
import { Annotation } from 'src/direct-linking/types'
import AnnotsStorage from 'src/direct-linking/background/storage'

export class AnnotationsListPlugin extends StorageBackendPlugin<
    DexieStorageBackend
> {
    static LIST_OP_ID = 'memex:dexie.listAnnotations'
    static LIST_BY_PAGE_OP_ID = 'memex:dexie.listAnnotationsByPage'
    static DEF_INNER_LIMIT_MULTI = 2

    install(backend: DexieStorageBackend) {
        super.install(backend)

        backend.registerOperation(
            AnnotationsListPlugin.LIST_OP_ID,
            this.listAnnots.bind(this),
        )

        backend.registerOperation(
            AnnotationsListPlugin.LIST_BY_PAGE_OP_ID,
            this.listAnnotsByPage.bind(this),
        )
    }

    private listWithoutTimeBounds = (params: Partial<AnnotSearchParams>) =>
        this.backend.dexieInstance
            .table<any, string>(AnnotsStorage.ANNOTS_COLL)
            .orderBy('createdWhen')
            .reverse()

    private listWithTimeBounds = ({
        startDate = 0,
        endDate = Date.now(),
    }: Partial<AnnotSearchParams>) =>
        this.backend.dexieInstance
            .table<any, string>(AnnotsStorage.ANNOTS_COLL)
            .where('createdWhen')
            .between(new Date(startDate), new Date(endDate), true, true)
            .reverse()

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

        return coll.filter(({ createdWhen }) => {
            const time = createdWhen.getTime()
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

    // The main logic
    private async list(
        { limit = 10, skip = 0, ...params }: AnnotSearchParams,
        {
            innerLimitMultiplier,
            listQuery,
            terminateLoopOnPageCount,
            isUrlBased,
        }: {
            innerLimitMultiplier: number
            terminateLoopOnPageCount?: boolean
            isUrlBased?: boolean
            listQuery: (
                params: AnnotSearchParams,
            ) => Dexie.Collection<Annotation, string>
        },
    ): Promise<Annotation[]> {
        const innerLimit = limit * innerLimitMultiplier

        // Page count version implements a much more inefficient algo,
        //  going from the first result all the way to the skip amount
        let innerSkip = terminateLoopOnPageCount
            ? 0
            : skip * innerLimitMultiplier

        let seenPages = new Set()
        let results: string[] = []
        let continueLookup: boolean

        const queryAnnots = (offset = innerSkip) =>
            listQuery(params)
                .offset(offset)
                .limit(innerLimit)

        do {
            // The results found in this iteration
            let innerResults: string[] = []

            if (terminateLoopOnPageCount) {
                let cancelEverything = false
                const innerSeenPages = new Set()

                do {
                    const queryResults: string[] = []

                    await queryAnnots().each(annot => {
                        queryResults.push(annot.url)
                        innerSeenPages.add(annot.pageUrl)
                    })

                    // If we've completely exhausted the results, don't attempt to find anymore
                    if (queryResults.length === 0) {
                        cancelEverything = true
                        break
                    }

                    innerResults.push(...queryResults)
                    innerSkip += innerLimit
                } while (innerSeenPages.size < limit) // Keep querying annots until we've seen our desired # of pages

                seenPages = new Set(...seenPages, ...innerSeenPages)

                continueLookup =
                    !cancelEverything && seenPages.size < limit + skip
            } else {
                innerResults = await queryAnnots(
                    isUrlBased ? 0 : innerSkip,
                ).primaryKeys()
                continueLookup = innerResults.length >= innerLimit
                innerSkip += innerLimit
            }

            if (params.bookmarksOnly) {
                innerResults = await this.filterByBookmarks(innerResults)
            }

            if (
                (params.tagsInc && params.tagsInc.length) ||
                (params.tagsExc && params.tagsExc.length)
            ) {
                innerResults = await this.filterByTags(innerResults, params)
            }

            if (params.collections && params.collections.length) {
                innerResults = await this.filterByCollections(
                    innerResults,
                    params,
                )
            }

            results = [...results, ...innerResults]
        } while (continueLookup)

        return this.mapUrlsToAnnots(results)
    }

    async listAnnots(
        params: AnnotSearchParams,
        innerLimitMultiplier = AnnotationsListPlugin.DEF_INNER_LIMIT_MULTI,
    ): Promise<Annotation[]> {
        const listQuery =
            params.endDate || params.startDate
                ? this.listWithTimeBounds
                : this.listWithoutTimeBounds

        return this.list(params, {
            innerLimitMultiplier,
            listQuery,
            terminateLoopOnPageCount: true,
        })
    }

    async listAnnotsByPage(
        params: AnnotSearchParams,
        innerLimitMultiplier = AnnotationsListPlugin.DEF_INNER_LIMIT_MULTI,
    ): Promise<Annotation[]> {
        return this.list(params, {
            innerLimitMultiplier,
            listQuery: this.listWithUrl,
            isUrlBased: true,
        })
    }
}
