import StorageManager from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'

import PageStorage from './storage'
import {
    PageAddRequest,
    PipelineReq,
    VisitInteraction,
    PipelineRes,
} from 'src/search/types'
import pipeline, { transformUrl } from 'src/search/pipeline'
import { initErrHandler } from 'src/search/storage'
import { Page, PageCreationProps, PageCreationOpts } from 'src/search'
import { DexieUtilsPlugin } from 'src/search/plugins'
import analysePage from 'src/page-analysis/background/analyse-page'
import { FetchPageProcessor } from 'src/page-analysis/background/types'
import TabManagementBackground from 'src/tab-management/background'

export class PageIndexingBackground {
    storage: PageStorage

    // Remember which pages are already indexed in which tab, so we only add one visit per page + tab
    indexedTabPages: { [tabId: number]: { [fullPageUrl: string]: true } } = {}

    constructor(
        private options: {
            tabManagement: TabManagementBackground
            storageManager: StorageManager
            fetchPageData?: FetchPageProcessor
            createInboxEntry: (normalizedPageUrl: string) => Promise<void>
            getNow: () => number
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
        pageDoc,
        rejectNoContent,
    }: Partial<PageAddRequest>): Promise<void> {
        const { favIconURI, ...pageData } = await pipeline({
            pageDoc,
            rejectNoContent,
        })

        await this.createOrUpdatePage(pageData)

        // Create Visits for each specified time, or a single Visit for "now" if no assoc event
        visits = !visits.length ? [Date.now()] : visits
        await this.storage.createVisitsIfNeeded(pageData.url, visits)

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
        await this.createOrUpdatePage(pageData)
    }

    async _deletePages(query: object) {
        const pages = await this.options.storageManager
            .collection('pages')
            .findObjects<PipelineRes>(query)

        return Promise.all(
            pages.map((page) =>
                new Page(this.options.storageManager, page).delete(),
            ),
        ).catch(initErrHandler())
    }

    async delPages(urls: string[]): Promise<{ info: any }[]> {
        const normalizedUrls: string[] = urls.map((url) => normalizeUrl(url))

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

    async domainHasFavIcon(ambiguousUrl: string) {
        const db = this.options.storageManager
        const { hostname } = transformUrl(ambiguousUrl)

        const res = await db
            .collection('favIcons')
            .findOneObject({ hostname })
            .catch(initErrHandler())
        return res != null
    }

    private removeAnyUnregisteredFields(pageData: PipelineRes): PipelineRes {
        const clonedData = { ...pageData }

        for (const field in clonedData) {
            if (
                !this.storage.collections['pages'].fields[field] &&
                !isTermsField({ collection: 'pages', field })
            ) {
                delete clonedData[field]
            }
        }

        return clonedData
    }

    async createOrUpdatePage(
        pageData: PipelineRes,
        opts: PageCreationOpts = {},
    ) {
        pageData = this.removeAnyUnregisteredFields(pageData)

        const existingPage = await this.storage.getPage(pageData.url)
        if (existingPage) {
            return this.storage.updatePage(pageData, existingPage)
        }

        await this.storage.createPage(pageData)

        if (opts.addInboxEntryOnCreate) {
            await this.options.createInboxEntry(pageData.fullUrl)
        }
    }

    private async processPageDataFromTab(
        props: PageCreationProps,
    ): Promise<PipelineRes | null> {
        if (!props.tabId) {
            throw new Error(
                `No tabID provided to extract content: ${props.fullUrl}`,
            )
        }

        const needsIndexing = !this.isTabPageIndexed({
            tabId: props.tabId,
            fullPageUrl: props.fullUrl,
        })
        if (!needsIndexing) {
            return null
        }

        const includeFavIcon = !(await this.domainHasFavIcon(props.fullUrl))
        const analysisRes = await analysePage({
            tabId: props.tabId,
            tabManagement: this.options.tabManagement,
            includeContent: props.stubOnly
                ? 'metadata-only'
                : 'metadata-with-full-text',
            includeFavIcon,
        })

        const pageData = await pipeline({
            pageDoc: { ...analysisRes, url: props.fullUrl },
            rejectNoContent: !props.stubOnly,
        })

        if (analysisRes.favIconURI) {
            await this.storage.createFavIconIfNeeded(
                pageData.hostname,
                analysisRes.favIconURI,
            )
        }

        return pageData
    }

    private async processPageDataFromUrl(
        props: PageCreationProps,
    ): Promise<PipelineRes | null> {
        if (!this.options.fetchPageData) {
            throw new Error(
                'Instantiation error: fetch-page-data implementation was not given to constructor',
            )
        }

        const pageData = await this.options.fetchPageData.process(props.fullUrl)

        if (props.stubOnly && pageData.text && pageData.terms?.length) {
            delete pageData.text
            delete pageData.terms
        }

        return pageData
    }

    indexPage = async (
        props: PageCreationProps,
        opts: PageCreationOpts = {},
    ) => {
        props.tabId =
            props.tabId ??
            (await this.options.tabManagement.findTabIdByFullUrl(props.fullUrl))

        const pageData = props.tabId
            ? await this.processPageDataFromTab(props)
            : await this.processPageDataFromUrl(props)

        if (pageData === null) {
            return
        }

        await this.createOrUpdatePage(pageData, opts)

        if (props.visitTime) {
            await this.storage.addPageVisit(
                pageData.url,
                this._getTime(props.visitTime),
            )
            await this.markTabPageAsIndexed({
                tabId: props.tabId,
                fullPageUrl: pageData.fullUrl,
            })
        }
    }

    async indexTestPage(props: PageCreationProps) {
        const pageData = await pipeline({
            pageDoc: { url: props.fullUrl, content: {} },
            rejectNoContent: false,
        })

        await this.storage.createPageIfNotExists(pageData)

        if (props.visitTime) {
            await this.storage.addPageVisit(
                pageData.url,
                this._getTime(props.visitTime),
            )
        }
    }

    private isTabPageIndexed(params: { tabId: number; fullPageUrl: string }) {
        return this.indexedTabPages[params.tabId]?.[params.fullPageUrl] ?? false
    }

    private markTabPageAsIndexed({
        tabId,
        fullPageUrl,
    }: {
        tabId?: number
        fullPageUrl: string
    }) {
        if (!tabId) {
            return
        }

        this.indexedTabPages[tabId] = this.indexedTabPages[tabId] || {}
        this.indexedTabPages[tabId][fullPageUrl] = true
    }

    handleTabClose(event: { tabId: number }) {
        delete this.indexedTabPages[event.tabId]
    }

    _getTime(time?: number | '$now') {
        if (!time && time !== 0) {
            return
        }
        return time !== '$now' ? time : this.options.getNow()
    }
}
