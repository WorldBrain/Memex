import { browser } from 'webextension-polyfill-ts'

import * as index from '..'
import { AnnotsSearcher } from './annots-search'
import { Dexie, StorageManager } from '../types'
import SearchStorage from './storage'
import QueryBuilder from 'src/search/query-builder'
import { TabManager } from 'src/activity-logger/background'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import AnnotsStorage from 'src/direct-linking/background/storage'

export default class SearchBackground {
    private backend
    private storage: SearchStorage
    private tabMan: TabManager
    private queryBuilderFactory: () => QueryBuilder
    private getDb: () => Promise<Dexie>
    private annotsSearcher: AnnotsSearcher

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
            listAnnotations: this.storage.listAnnotations.bind(this.storage),
            searchAnnotations: this.searchAnnotations.bind(this),
        })
    }

    async searchAnnotations({ query, ...params }) {
        const qb = this.queryBuilderFactory()
            .searchTerm(query)
            .get()

        if (qb.isBadTerm || qb.isInvalidSearch) {
            return []
        }

        return this.annotsSearcher.search({
            terms: [...qb.query],
            ...params,
        })
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
