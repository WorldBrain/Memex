import { browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'
import PageStorage from './storage'
import {
    PageAddRequest,
    PipelineReq,
    VisitInteraction,
    PipelineRes,
} from 'src/search/types'
import pipeline, { transformUrl } from 'src/search/pipeline'
import { initErrHandler } from 'src/search/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'
import { Page, PageCreationProps } from 'src/search'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { DexieUtilsPlugin } from 'src/search/plugins'
import analysePage from 'src/page-analysis/background'
import { FetchPageProcessor } from 'src/page-analysis/background/types'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from 'src/options/settings/constants'

export class PageIndexingBackground {
    storage: PageStorage

    constructor(
        private options: {
            bookmarksStorage: BookmarksStorage
            storageManager: StorageManager
            fetchPageData?: FetchPageProcessor
        },
    ) {
        this.storage = new PageStorage({
            storageManager: options.storageManager,
        })
    }

    /**
     * Adds/updates a page + associated visit (pages never exist without either an assoc.
     *  visit or bookmark in current model).
     */
    async addPage({
        visits = [],
        bookmark,
        pageDoc,
        rejectNoContent,
    }: Partial<PageAddRequest>): Promise<void> {
        const { favIconURI, ...pageData } = await pipeline({
            pageDoc,
            rejectNoContent,
        })

        await this.storage.createOrUpdatePage(pageData)

        // Create Visits for each specified time, or a single Visit for "now" if no assoc event
        visits = !visits.length && bookmark == null ? [Date.now()] : visits
        await this.storage.createVisitsIfNeeded(pageData.url, visits)

        if (bookmark != null) {
            await this.options.bookmarksStorage.createBookmarkIfNeeded(
                pageData.url,
                bookmark,
            )
        }

        if (favIconURI != null) {
            await this.storage.createFavIconIfNeeded(
                pageData.hostname,
                favIconURI,
            )
        }
    }

    async addFavIconIfNeeded(url: string, favIcon: string) {
        const { hostname } = transformUrl(url)

        return this.storage.createFavIconIfNeeded(hostname, favIcon)
    }

    async addPageTerms(pipelineReq: PipelineReq): Promise<void> {
        const pageData = await pipeline(pipelineReq)
        await this.storage.createOrUpdatePage(pageData)
    }

    async _deletePages(query: object) {
        const pages = await this.options.storageManager
            .collection('pages')
            .findObjects<PipelineRes>(query)

        return Promise.all(
            pages.map(page =>
                new Page(this.options.storageManager, page).delete(),
            ),
        ).catch(initErrHandler())
    }

    async delPages(urls: string[]): Promise<{ info: any }[]> {
        const normalizedUrls: string[] = urls.map(url => normalizeUrl(url))

        return this._deletePages({ url: { $in: normalizedUrls } })
    }

    async delPagesByDomain(url: string): Promise<void> {
        await this._deletePages({ domain: url })
    }

    // WARNING: Inefficient; goes through entire table
    async delPagesByPattern(pattern: string | RegExp): Promise<void> {
        return this.options.storageManager.operation(
            DexieUtilsPlugin.REGEXP_DELETE_OP,
            {
                collection: 'pages',
                fieldName: 'url',
                pattern,
            },
        )
    }

    async addVisit(url: string, time = Date.now()) {
        const pageExists = await this.storage.pageExists(url)
        if (!pageExists) {
            throw new Error(`Cannot add visit for non-existent page: ${url}`)
        }
        await this.storage.addPageVisit(url, time).catch(initErrHandler())
    }

    /**
     * Updates an existing specified visit with interactions data.
     */
    async updateTimestampMeta(
        url: string,
        time: number,
        data: Partial<VisitInteraction>,
    ) {
        return this.storage.updateVisitMetadata({ url, time }, data)
    }

    async addFavIcon(url: string, favIconURI: string | Blob) {
        const { hostname } = transformUrl(url)

        await this.storage
            .createOrUpdateFavIcon(hostname, favIconURI)
            .catch(initErrHandler())
    }

    async domainHasFavIcon(url: string) {
        const db = this.options.storageManager
        const { hostname } = transformUrl(url)

        const res = await db
            .collection('favIcons')
            .findOneObject({ hostname })
            .catch(initErrHandler())
        return res != null
    }

    async createPageFromTab(props: PageCreationProps) {
        if (!props.tabId) {
            throw new Error(
                `No tabID provided to extract content: ${props.url}`,
            )
        }

        const analysisRes = await analysePage({
            tabId: props.tabId,
            allowFavIcon: false,
            ...props,
        })

        if (props.stubOnly && analysisRes.content) {
            delete analysisRes.content.fullText
        } else if (analysisRes.content) {
            analysisRes.content.fullText = await analysisRes.getFullText()
        }

        const pageData = await pipeline({
            pageDoc: { ...analysisRes, url: props.url },
            rejectNoContent: !props.stubOnly,
        })

        await this.storage.createPageIfNotExists(pageData)
        if (props.visitTime) {
            await this.storage.addPageVisit(pageData.url, props.visitTime)
        }

        return pageData
    }

    async createPageFromUrl(props: PageCreationProps) {
        if (!this.options.fetchPageData) {
            throw new Error(
                'Instantiation error: fetch-page-data implementation was not given to constructor',
            )
        }

        const pageData = await this.options.fetchPageData.process(
            props.fullUrl ?? props.url,
        )

        if (props.stubOnly && pageData.text && pageData.terms?.length) {
            delete pageData.text
            delete pageData.terms
        }

        await this.storage.createPageIfNotExists(pageData)
        if (props.visitTime) {
            await this.storage.addPageVisit(pageData.url, props.visitTime)
        }

        return pageData
    }

    async createTestPage(props: PageCreationProps) {
        const pageData = await pipeline({
            pageDoc: { url: props.url, content: {} },
            rejectNoContent: false,
        })

        await this.storage.createPageIfNotExists(pageData)
        if (props.visitTime) {
            await this.storage.addPageVisit(pageData.url, props.visitTime)
        }
        return pageData
    }

    /**
     * Decides which type of on-demand page indexing logic to run based on given props.
     * Also sets the `stubOnly` option based on user bookmark/tag indexing pref.
     * TODO: Better name?
     */
    async createPageViaBmTagActs(props: PageCreationProps) {
        const {
            [IDXING_PREF_KEYS.BOOKMARKS]: fullyIndex,
        } = await browser.storage.local.get(IDXING_PREF_KEYS.BOOKMARKS)

        if (props.tabId) {
            return this.createPageFromTab({
                stubOnly: !fullyIndex,
                ...props,
            })
        }

        return this.createPageFromUrl({ stubOnly: !fullyIndex, ...props })
    }
}
