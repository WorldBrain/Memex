import { browser } from 'webextension-polyfill-ts'

import * as index from '..'
import { AnnotsSearcher } from './annots-search'
import { PageSearcher } from './page-search'
import { Dexie, StorageManager } from '../types'
import SearchStorage from './storage'
import QueryBuilder from '../query-builder'
import { TabManager } from 'src/activity-logger/background'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import AnnotsStorage from 'src/direct-linking/background/storage'
import { PageSearchParams, AnnotSearchParams, AnnotPage } from './types'
import { annotSearchOnly, pageSearchOnly } from './utils'
import { Annotation } from 'src/direct-linking/types'

export default class SearchBackground {
    private backend
    private storage: SearchStorage
    private tabMan: TabManager
    private queryBuilderFactory: () => QueryBuilder
    private getDb: () => Promise<Dexie>
    private annotsSearcher: AnnotsSearcher
    private pageSearcher: PageSearcher

    constructor({
        storageManager,
        getDb,
        queryBuilder = () => new QueryBuilder(),
        tabMan,
        idx = index,
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
        queryBuilder?: () => QueryBuilder
        tabMan: TabManager
        idx?: typeof index
    }) {
        this.tabMan = tabMan
        this.getDb = getDb
        this.queryBuilderFactory = queryBuilder
        this.storage = new SearchStorage({ storageManager })
        this.initBackend(idx)

        this.annotsSearcher = new AnnotsSearcher({
            storageManager,
            listsColl: AnnotsStorage.LISTS_COLL,
            listEntriesColl: AnnotsStorage.LIST_ENTRIES_COLL,
            tagsColl: AnnotsStorage.TAGS_COLL,
            bookmarksColl: AnnotsStorage.BMS_COLL,
            annotsColl: AnnotsStorage.ANNOTS_COLL,
            pagesColl: AnnotsStorage.PAGES_COLL,
        })

        this.pageSearcher = new PageSearcher({
            storageManager,
            legacySearch: idx.fullSearch(this.getDb),
        })

        // Handle any new browser bookmark actions (bookmark mananger or bookmark btn in URL bar)
        browser.bookmarks.onCreated.addListener(
            this.handleBookmarkCreation.bind(this),
        )
        browser.bookmarks.onRemoved.addListener(
            this.handleBookmarkRemoval.bind(this),
        )
    }

    private initBackend(idx: typeof index) {
        this.backend = {
            addPage: idx.addPage(this.getDb),
            addPageTerms: idx.addPageTerms(this.getDb),
            updateTimestampMeta: idx.updateTimestampMeta(this.getDb),
            addVisit: idx.addVisit(this.getDb),
            addFavIcon: idx.addFavIcon(this.getDb),
            delPages: idx.delPages(this.getDb),
            delPagesByDomain: idx.delPagesByDomain(this.getDb),
            delPagesByPattern: idx.delPagesByPattern(this.getDb),
            addTag: idx.addTag(this.getDb),
            delTag: idx.delTag(this.getDb),
            fetchPageTags: idx.fetchPageTags(this.getDb),
            addBookmark: idx.addBookmark(this.getDb),
            delBookmark: idx.delBookmark(this.getDb),
            pageHasBookmark: idx.pageHasBookmark(this.getDb),
            getPage: idx.getPage(this.getDb),
            grabExistingKeys: idx.grabExistingKeys(this.getDb),
            search: idx.search(this.getDb),
            suggest: idx.suggest(this.getDb),
            extendedSuggest: idx.extendedSuggest(this.getDb),
            getMatchingPageCount: idx.getMatchingPageCount(this.getDb),
            domainHasFavIcon: idx.domainHasFavIcon(this.getDb),
            createPageFromTab: idx.createPageFromTab(this.getDb),
            createPageFromUrl: idx.createPageFromUrl(this.getDb),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            search: this.backend.search,
            addTag: this.backend.addTag,
            delTag: this.backend.delTag,
            suggest: this.backend.suggest,
            delPages: this.backend.delPages,
            addBookmark: this.backend.addBookmark,
            delBookmark: this.backend.delBookmark,
            fetchPageTags: this.backend.fetchPageTags,
            extendedSuggest: this.backend.extendedSuggest,
            delPagesByDomain: this.backend.delPagesByDomain,
            delPagesByPattern: this.backend.delPagesByPattern,
            getMatchingPageCount: this.backend.getMatchingPageCount,
            searchAnnotations: this.searchAnnotations.bind(this),
            searchPages: this.searchPages.bind(this),
        })
    }

    private processSearchParams({
        query,
        domainsInc,
        domainsExc,
        tagsInc,
        collections,
        contentTypes = { notes: true, highlights: true },
        ...params
    }: any) {
        // Extract query terms and in-query-filters via QueryBuilder
        const qb = this.queryBuilderFactory()
            .searchTerm(query)
            .filterDomains(domainsInc)
            .filterExcDomains(domainsExc)
            .filterTags(tagsInc)
            .filterLists(collections)
            .get()

        return {
            ...params,
            tagsInc: qb.tags,
            termsInc: qb.terms,
            termsExc: qb.termsExclude,
            domainsInc: qb.domains,
            domainsExc: qb.domainsExclude,
            collections: qb.lists,
            includeNotes: contentTypes.notes,
            includeHighlights: contentTypes.highlights,
        }
    }

    private mergeSearchResults(results: Array<AnnotPage[]>): AnnotPage[] {
        const pageMap = new Map<string, [Partial<AnnotPage>, Annotation[]]>()

        // Dedupe and group results by page
        for (const searchRes of results) {
            for (const { annotations, ...page } of searchRes) {
                const entry = pageMap.get(page.url)

                let annots =
                    entry == null ? annotations : [...entry[1], ...annotations]

                const urls = new Set(annots.map(a => a.pageUrl))
                annots = annots.filter(annot => urls.has(annot.pageUrl))

                pageMap.set(page.url, [page, annots])
            }
        }

        // Convert Map back to array of results
        return [...pageMap.values()].map(
            ([page, annotations]) =>
                ({
                    ...page,
                    annotations,
                } as AnnotPage),
        )
    }

    private async combinedSearch(params: AnnotSearchParams) {
        // Manually apply skip post-search
        const skip = params.skip
        delete params.skip

        const results = await Promise.all([
            this.pageSearcher.search(params),
            this.annotsSearcher.search({
                ...params,
                includePageResults: true,
            }),
        ])

        const mergedResults = this.mergeSearchResults(results as Array<
            AnnotPage[]
        >)

        return mergedResults.slice(skip, params.limit)
    }

    private async blankPageSearch(params: AnnotSearchParams) {
        let results = await this.pageSearcher.search(params)

        results = await Promise.all(
            results.map(async page => ({
                ...page,
                annotations: await this.storage.listAnnotations({
                    ...params,
                    limit: params.maxAnnotsPerPage,
                }),
            })),
        )

        return results
    }

    async searchAnnotations(params: AnnotSearchParams): Promise<Annotation[]> {
        const searchParams = this.processSearchParams(params)

        if (searchParams.isBadTerm || searchParams.isInvalidSearch) {
            return []
        }

        // Blank search; just list annots, applying search filters
        if (!searchParams.termsInc.length) {
            return this.storage.listAnnotations(searchParams)
        }

        return this.annotsSearcher.search({
            ...searchParams,
            includePageResults: false,
        }) as any
    }

    async searchPages(params: PageSearchParams): Promise<AnnotPage[]> {
        const searchParams = this.processSearchParams(params)

        if (searchParams.isBadTerm || searchParams.isInvalidSearch) {
            return []
        }

        // Blank search; just list annots, applying search filters
        if (!searchParams.termsInc.length) {
            return this.blankPageSearch(searchParams)
        }

        if (pageSearchOnly(params.contentTypes)) {
            return this.pageSearcher.search(searchParams)
        }

        if (annotSearchOnly(params.contentTypes)) {
            return this.annotsSearcher.search({
                ...searchParams,
                includePageResults: true,
            }) as any
        }

        return this.combinedSearch(searchParams)
    }

    async handleBookmarkRemoval(id, { node }) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        return this.backend.delBookmark(node).catch(console.error)
    }

    async handleBookmarkCreation(id, node) {
        // Created folders won't have `url`; ignore these
        if (!node.url) {
            return
        }

        let tabId
        const activeTab = this.tabMan.getActiveTab()

        if (activeTab != null && activeTab.url === node.url) {
            tabId = activeTab.id
        }

        return this.backend.addBookmark({ url: node.url, tabId })
    }
}
