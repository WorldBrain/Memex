import { browser, Tabs, Storage } from 'webextension-polyfill-ts'

import {
    createPageFromTab,
    Tag,
    Page,
    Bookmark,
    Dexie,
    StorageManager,
} from '../../search'
import { FeatureStorage } from '../../search/storage'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from '../../options/settings/constants'
import { Annotation, SearchParams, UrlFilters } from '../types'

const uniqBy = require('lodash/fp/uniqBy')

export interface AnnotationStorageProps {
    storageManager: StorageManager
    getDb: () => Promise<Dexie>
    browserStorageArea?: Storage.StorageArea
    annotationsColl?: string
    pagesColl?: string
    tagsColl?: string
    bookmarksColl?: string
    listsColl?: string
    listEntriesColl?: string
}

// TODO: Move to src/annotations in the future
export default class AnnotationStorage extends FeatureStorage {
    static ANNOTS_COLL = 'annotations'
    static TAGS_COLL = 'tags'
    static PAGES_COLL = 'pages'
    static BMS_COLL = 'annotBookmarks'
    static LISTS_COLL = 'customLists'
    static LIST_ENTRIES_COLL = 'annotListEntries'
    static MEMEX_LINK_PROVIDERS = [
        'http://memex.link',
        'http://staging.memex.link',
    ]

    private _browserStorageArea: Storage.StorageArea
    private _getDb: () => Promise<Dexie>
    private _annotationsColl: string
    private _pagesColl: string
    private _bookmarksColl: string
    private _tagsColl: string
    private _listsColl: string
    private _listEntriesColl: string
    private _uniqAnnots: (annots: Annotation[]) => Annotation[] = uniqBy('url')

    constructor({
        storageManager,
        getDb,
        browserStorageArea = browser.storage.local,
        annotationsColl = AnnotationStorage.ANNOTS_COLL,
        pagesColl = AnnotationStorage.PAGES_COLL,
        bookmarksColl = AnnotationStorage.BMS_COLL,
        tagsColl = AnnotationStorage.TAGS_COLL,
        listsColl = AnnotationStorage.LISTS_COLL,
        listEntriesColl = AnnotationStorage.LIST_ENTRIES_COLL,
    }: AnnotationStorageProps) {
        super(storageManager)
        this._annotationsColl = annotationsColl
        this._tagsColl = tagsColl
        this._pagesColl = pagesColl
        this._bookmarksColl = bookmarksColl
        this._listsColl = listsColl
        this._listEntriesColl = listEntriesColl

        this._browserStorageArea = browserStorageArea
        this._getDb = getDb

        this.storageManager.registry.registerCollection(this._annotationsColl, {
            version: new Date(2018, 7, 26),
            fields: {
                pageTitle: { type: 'text' },
                pageUrl: { type: 'url' },
                body: { type: 'text' },
                comment: { type: 'text' },
                selector: { type: 'json' },
                createdWhen: { type: 'datetime' },
                lastEdited: { type: 'datetime' },
                url: { type: 'string' },
            },
            indices: [
                { field: 'url', pk: true },
                { field: 'pageTitle' },
                { field: 'body' },
                { field: 'createdWhen' },
                { field: 'comment' },
            ],
        })

        this.storageManager.registry.registerCollection(this._listEntriesColl, {
            version: new Date(2019, 0, 4),
            fields: {
                listId: { type: 'string' },
                url: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [
                { field: ['listId', 'url'], pk: true },
                { field: 'listId' },
                { field: 'url' },
            ],
        })

        this.storageManager.registry.registerCollection(this._bookmarksColl, {
            version: new Date(2019, 0, 5),
            fields: {
                url: { type: 'string' },
                createdAt: { type: 'datetime' },
            },
            indices: [{ field: 'url', pk: true }, { field: 'createdAt' }],
        })

        // NOTE: This is no longer used; keeping to maintain DB schema sanity
        this.storageManager.registry.registerCollection('directLinks', [
            {
                version: new Date(2018, 5, 31),
                fields: {
                    pageTitle: { type: 'text' },
                    pageUrl: { type: 'url' },
                    body: { type: 'text' },
                    selector: { type: 'json' },
                    createdWhen: { type: 'datetime' },
                    url: { type: 'string' },
                },
                indices: [
                    { field: 'url', pk: true },
                    { field: 'pageTitle' },
                    { field: 'body' },
                    { field: 'createdWhen' },
                ],
            },
            {
                version: new Date(2018, 7, 3),
                fields: {
                    pageTitle: { type: 'text' },
                    pageUrl: { type: 'url' },
                    body: { type: 'text' },
                    comment: { type: 'text' },
                    selector: { type: 'json' },
                    createdWhen: { type: 'datetime' },
                    lastEdited: { type: 'datetime' },
                    url: { type: 'string' },
                },
                indices: [
                    { field: 'url', pk: true },
                    { field: 'pageTitle' },
                    { field: 'pageUrl' },
                    { field: 'body' },
                    { field: 'createdWhen' },
                    { field: 'comment' },
                ],
            },
        ])
    }

    async insertAnnotToList({ listId, url }: { listId: number; url: string }) {
        const list = await this.storageManager
            .collection(this._listsColl)
            .findOneObject({ id: listId })

        if (list == null) {
            throw new Error(`No list exists for ID: ${listId}`)
        }

        return this.storageManager
            .collection(this._listEntriesColl)
            .createObject({ listId, url, createdAt: new Date() })
    }

    /**
     * @returns Promise resolving to a boolean denoting whether or not a bookmark was created.
     */
    async toggleAnnotBookmark({ url }: { url: string }) {
        const coll = this.storageManager.collection(this._bookmarksColl)

        const bookmark = await coll.findOneObject({ url })

        if (bookmark == null) {
            await coll.createObject({ url, createdAt: new Date() })
            return true
        }

        await coll.deleteOneObject({ url })
        return false
    }

    private async fetchIndexingPrefs(): Promise<{ shouldIndexLinks: boolean }> {
        const storage = await this._browserStorageArea.get(
            IDXING_PREF_KEYS.LINKS,
        )

        return {
            shouldIndexLinks: !!storage[IDXING_PREF_KEYS.LINKS],
        }
    }

    async indexPageFromTab({ id, url }: Tabs.Tab) {
        const indexingPrefs = await this.fetchIndexingPrefs()

        const page = await createPageFromTab({
            tabId: id,
            url,
            stubOnly: !indexingPrefs.shouldIndexLinks,
        })

        await page.loadRels(this._getDb)

        // Add new visit if none, else page won't appear in results
        // TODO: remove once search changes to incorporate assoc. page data apart from bookmarks/visits
        if (!page.visits.length) {
            page.addVisit()
        }

        await page.save(this._getDb)
    }

    async getAnnotationByPk(url: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .findOneObject<Annotation>({ url })
    }

    async getAnnotationsByUrl(pageUrl: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .findObjects<Annotation>({ pageUrl })
    }

    // TODO: Find better way of calculating this?
    private isAnnotDirectLink = (annot: Annotation) => {
        let isDirectLink = false

        for (const provider of AnnotationStorage.MEMEX_LINK_PROVIDERS) {
            isDirectLink = isDirectLink || annot.url.startsWith(provider)
        }

        return isDirectLink
    }

    private applyUrlFilters(
        query,
        {
            collUrlsInc,
            domainUrlsInc,
            domainUrlsExc,
            tagUrlsInc,
            tagUrlsExc,
        }: UrlFilters,
    ) {
        let pageUrlInc: string[]

        if (collUrlsInc != null && collUrlsInc.size) {
            pageUrlInc = [...collUrlsInc]

            query.pageUrl = {
                $in: pageUrlInc,
                ...(query.pageUrl || {}),
            }
        }

        if (domainUrlsInc != null && domainUrlsInc.size) {
            // Intersect inc. domain URLs and inc. collection URLs, if both defined
            pageUrlInc =
                pageUrlInc != null
                    ? [
                          ...new Set(
                              pageUrlInc.filter(url => domainUrlsInc.has(url)),
                          ),
                      ]
                    : [...domainUrlsInc]

            query.pageUrl = {
                $in: pageUrlInc,
                ...(query.pageUrl || {}),
            }
        }

        if (domainUrlsExc != null && domainUrlsExc.size) {
            query.pageUrl = {
                $nin: [...domainUrlsExc],
                ...(query.pageUrl || {}),
            }
        }

        if (tagUrlsInc != null && tagUrlsInc.size) {
            query.url = { $in: [...tagUrlsInc], ...(query.url || {}) }
        }

        if (tagUrlsExc != null && tagUrlsExc.size) {
            query.url = { $nin: [...tagUrlsExc], ...(query.url || {}) }
        }
    }

    /**
     * I don't know why this is the only way I can get this working...
     * I originally intended a simpler single query like:
     *  { $or: [_body_terms: term, _comment_terms: term] }
     */
    private termSearch = (
        {
            endDate = Date.now(),
            startDate = 0,
            limit = 5,
            url,
            highlightsOnly = false,
            directLinksOnly = false,
        }: Partial<SearchParams>,
        urlFilters: UrlFilters,
    ) => async (term: string) => {
        const termSearchField = async (field: string) => {
            const query: any = {
                [field]: { $all: [term] },
                createdWhen: {
                    $lte: endDate,
                    $gte: startDate,
                },
            }

            this.applyUrlFilters(query, urlFilters)

            if (url != null && url.length) {
                query.pageUrl = url
            }

            const results = await this.storageManager
                .collection(this._annotationsColl)
                .findObjects<Annotation>(query, { limit })

            return directLinksOnly
                ? results.filter(this.isAnnotDirectLink)
                : results
        }

        const bodyRes = await termSearchField('_body_terms')
        const commentsRes = highlightsOnly
            ? []
            : await termSearchField('_comment_terms')

        return this._uniqAnnots([...bodyRes, ...commentsRes]).slice(0, limit)
    }

    private async collectionSearch(collections: string[]) {
        if (!collections.length) {
            return undefined
        }

        const colls = await this.storageManager
            .collection(this._listsColl)
            .findObjects<any>({ name: { $in: collections } })

        const collEntries = await this.storageManager
            .collection(this._listEntriesColl)
            .findObjects<any>({ listId: { $in: colls.map(coll => coll.id) } })

        return new Set<string>(collEntries.map(coll => coll.pageUrl))
    }

    private async tagSearch(tags: string[]) {
        if (!tags.length) {
            return undefined
        }

        const tagResults = await this.storageManager
            .collection(this._tagsColl)
            .findObjects<Tag>({ name: { $in: tags } })

        return new Set<string>(tagResults.map(tag => tag.url))
    }

    private async domainSearch(domains: string[]) {
        if (!domains.length) {
            return undefined
        }

        const pages = await this.storageManager
            .collection(this._pagesColl)
            .findObjects<Page>({
                $or: [
                    { hostname: { $in: domains } },
                    { domain: { $in: domains } },
                ],
            })

        return new Set<string>(pages.map(page => page.url))
    }

    private async mapSearchResToBookmarks(
        { bookmarksOnly = false }: SearchParams,
        results: Annotation[],
    ) {
        const bookmarks = await this.storageManager
            .collection(this._bookmarksColl)
            .findObjects<Bookmark>({
                url: { $in: results.map(annot => annot.pageUrl) },
            })

        const bmUrlSet = new Set(bookmarks.map(bm => bm.url))

        if (bookmarksOnly) {
            return results.filter(annot => bmUrlSet.has(annot.pageUrl))
        }

        return results.map(annot => ({
            ...annot,
            isBookmarked: bmUrlSet.has(annot.pageUrl),
        }))
    }

    private projectSearchResults(results) {
        return results.map(
            ({
                url,
                pageUrl,
                body,
                comment,
                createdWhen,
                tags,
                isBookmarked,
            }) => ({
                url,
                pageUrl,
                body,
                comment,
                createdWhen,
                tags: tags.map(tag => tag.name),
                isBookmarked,
            }),
        )
    }

    async search({
        terms = [],
        tagsInc = [],
        tagsExc = [],
        domainsInc = [],
        domainsExc = [],
        collections = [],
        limit = 5,
        ...searchParams
    }: SearchParams) {
        const filters: UrlFilters = {
            collUrlsInc: await this.collectionSearch(collections),
            tagUrlsInc: await this.tagSearch(tagsInc),
            tagUrlsExc: await this.tagSearch(tagsExc),
            domainUrlsInc: await this.domainSearch(domainsInc),
            domainUrlsExc: await this.domainSearch(domainsExc),
        }

        // If domains/tags/collections filters were specified but no matches, search fails early
        if (
            (filters.domainUrlsInc != null &&
                filters.domainUrlsInc.size === 0) ||
            (filters.tagUrlsInc != null && filters.tagUrlsInc.size === 0) ||
            (filters.collUrlsInc != null && filters.collUrlsInc.size === 0)
        ) {
            return []
        }

        const termResults = await Promise.all(
            terms.map(this.termSearch({ ...searchParams, limit }, filters)),
        )

        // Flatten out results
        let annotResults = this._uniqAnnots([].concat(...termResults)).slice(
            0,
            limit,
        )

        annotResults = await this.mapSearchResToBookmarks(
            searchParams,
            annotResults,
        )

        // Lookup tags for each annotation
        annotResults = await Promise.all(
            annotResults.map(async annot => ({
                ...annot,
                tags: await this.getTagsByAnnotationUrl(annot.url),
            })),
        )

        // Project out unwanted data
        return this.projectSearchResults(annotResults)
    }

    async createAnnotation({
        pageTitle,
        pageUrl,
        body,
        url,
        comment,
        selector,
    }: Annotation) {
        return this.storageManager
            .collection(this._annotationsColl)
            .createObject({
                pageTitle,
                pageUrl,
                comment,
                body,
                selector,
                createdWhen: new Date(),
                lastEdited: {},
                url,
            })
    }

    async editAnnotation(url: string, comment: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .updateOneObject(
                { url },
                {
                    $set: {
                        comment,
                        lastEdited: new Date(),
                    },
                },
            )
    }

    async deleteAnnotation(url: string) {
        return this.storageManager
            .collection(this._annotationsColl)
            .deleteOneObject({ url })
    }

    async getTagsByAnnotationUrl(url: string) {
        return this.storageManager
            .collection(this._tagsColl)
            .findObjects<Tag>({ url })
    }

    modifyTags = (shouldAdd: boolean) => async (name: string, url: string) => {
        if (shouldAdd) {
            this.storageManager.collection(this._tagsColl).createObject({
                name,
                url,
            })
        } else {
            this.storageManager.collection(this._tagsColl).deleteObjects({
                name,
                url,
            })
        }
    }
}
