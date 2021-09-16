import StorageManager from '@worldbrain/storex'
import { normalizeUrl, isFileUrl } from '@worldbrain/memex-url-utils'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'
import {
    ContentFingerprint,
    ContentLocatorFormat,
    ContentLocatorType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    ContentIdentifier,
    ContentLocator,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import {
    fingerprintInArray,
    fingerprintsEqual,
} from '@worldbrain/memex-common/lib/page-indexing/utils'

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
import analysePage, {
    PageAnalysis,
} from 'src/page-analysis/background/analyse-page'
import { FetchPageProcessor } from 'src/page-analysis/background/types'
import TabManagementBackground from 'src/tab-management/background'
import PersistentPageStorage from './persistent-storage'
import {
    StoredContentType,
    PageIndexingInterface,
    InitContentIdentifierParams,
    InitContentIdentifierReturns,
} from './types'
import { GenerateServerID } from '../../background-script/types'
import {
    remoteFunctionWithExtraArgs,
    registerRemoteFunctions,
} from '../../util/webextensionRPC'

interface ContentInfo {
    locators: Array<ContentLocator>
    primaryIdentifier: ContentIdentifier // this is the one we store in the DB
    aliasIdentifiers: ContentIdentifier[] // these are the ones of the other URLs pointing to the primaryNormalizedUrl
}
export class PageIndexingBackground {
    storage: PageStorage
    persistentStorage: PersistentPageStorage
    fetch?: typeof fetch
    remoteFunctions: PageIndexingInterface<'provider'>

    // Remember which pages are already indexed in which tab, so we only add one visit per page + tab
    indexedTabPages: { [tabId: number]: { [fullPageUrl: string]: true } } = {}

    contentInfo: {
        // will contain multiple entries for the same content info because of multiple normalized URLs pointing to one
        [normalizedUrl: string]: ContentInfo
    } = {}

    constructor(
        public options: {
            tabManagement: TabManagementBackground
            storageManager: StorageManager
            persistentStorageManager: StorageManager
            fetchPageData?: FetchPageProcessor
            createInboxEntry: (normalizedPageUrl: string) => Promise<void>
            getNow: () => number
            generateServerId: GenerateServerID
        },
    ) {
        this.storage = new PageStorage({
            storageManager: options.storageManager,
        })
        this.persistentStorage = new PersistentPageStorage({
            storageManager: options.persistentStorageManager,
        })
        this.remoteFunctions = {
            initContentIdentifier: remoteFunctionWithExtraArgs(
                this.initContentIdentifierRemote,
            ),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    initContentIdentifierRemote: PageIndexingInterface<
        'provider'
    >['initContentIdentifier']['function'] = async (info, params) => {
        return this.initContentIdentifier(params)
    }

    async initContentIdentifier(
        params: InitContentIdentifierParams,
    ): Promise<InitContentIdentifierReturns> {
        const regularNormalizedUrl = normalizeUrl(
            params.locator.originalLocation,
        )
        const regularIdentifier: ContentIdentifier = {
            normalizedUrl: regularNormalizedUrl,
            fullUrl: params.locator.originalLocation,
        }
        if (!params.fingerprints.length) {
            return regularIdentifier
        }
        let contentInfo = this.contentInfo[regularNormalizedUrl]
        let stored: {
            identifier: ContentIdentifier
            locators: ContentLocator[]
        }
        if (!contentInfo) {
            stored = await this.storage.getContentIdentifier({
                regularNormalizedUrl,
                fingerprints: params.fingerprints,
            })
            if (!stored) {
                const generatedNormalizedUrl = `memex.cloud/ct/${this.options.generateServerId(
                    'personalContentMetadata',
                )}.${params.locator.format}`
                const generatedIdentifier: ContentIdentifier = {
                    normalizedUrl: generatedNormalizedUrl,
                    fullUrl: `https://${generatedNormalizedUrl}`,
                }
                contentInfo = {
                    primaryIdentifier: generatedIdentifier,
                    locators: [],
                    aliasIdentifiers: [regularIdentifier],
                }
            } else {
                contentInfo = this.contentInfo[
                    stored.identifier.normalizedUrl
                ] ?? {
                    primaryIdentifier: stored.identifier,
                    locators: stored.locators,
                    aliasIdentifiers: stored.locators.map((locator) => ({
                        normalizedUrl: normalizeUrl(locator.originalLocation),
                        fullUrl: locator.originalLocation,
                    })),
                }
            }
        }
        this.contentInfo[regularNormalizedUrl] = contentInfo
        this.contentInfo[
            contentInfo.primaryIdentifier.normalizedUrl
        ] = contentInfo
        const { primaryIdentifier } = contentInfo

        if (
            !contentInfo.aliasIdentifiers.find(
                (identifier) =>
                    identifier.normalizedUrl === regularNormalizedUrl,
            )
        ) {
            contentInfo.aliasIdentifiers.push(regularIdentifier)
        }

        let hasNewLocators = false
        for (const fingerprint of params.fingerprints) {
            if (
                contentInfo.locators.find(
                    (locator) =>
                        fingerprintsEqual(locator, fingerprint) &&
                        locator.originalLocation ===
                            params.locator.originalLocation,
                )
            ) {
                continue
            }
            hasNewLocators = true

            const isFile = isFileUrl(params.locator.originalLocation)
            const newLocator: ContentLocator = {
                ...params.locator,
                originalLocation: params.locator.originalLocation,
                locationType: isFile
                    ? ContentLocatorType.Local
                    : ContentLocatorType.Remote,
                locationScheme: isFile
                    ? LocationSchemeType.FilesystemPathV1
                    : LocationSchemeType.NormalizedUrlV1,
                location: isFile
                    ? params.locator.originalLocation
                    : primaryIdentifier.normalizedUrl,
                fingerprint: fingerprint.fingerprint,
                format: params.locator.format,
                fingerprintScheme: fingerprint.fingerprintScheme,
                normalizedUrl: primaryIdentifier.normalizedUrl,
                primary: true,
                valid: true,
                version: 0,
                lastVisited: this.options.getNow(),
            }
            contentInfo.locators.push(newLocator)
        }
        if (stored && hasNewLocators) {
            await this.storeLocators(primaryIdentifier)
        }
        return primaryIdentifier
    }

    getContentFingerprints(
        contentIdentifier: Pick<ContentIdentifier, 'normalizedUrl'>,
    ) {
        return this.contentInfo[contentIdentifier.normalizedUrl]?.locators.map(
            (locator): ContentFingerprint => ({
                fingerprintScheme: locator.fingerprintScheme,
                fingerprint: locator.fingerprint,
            }),
        )
    }

    /**
     * Adds/updates a page + associated visit (pages never exist without either an assoc.
     * visit or bookmark in current model).
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

        const contentIdentifier = this.getContentIdentifier(pageData.url)
        if (contentIdentifier) {
            pageData.fullUrl = contentIdentifier.fullUrl
            pageData.url = contentIdentifier.normalizedUrl
        }
        const normalizedUrl = pageData.url

        const existingPage = await this.storage.getPage(normalizedUrl)
        if (existingPage) {
            await this.storage.updatePage(pageData, existingPage)
            await this.storeLocators(contentIdentifier)
        }

        await this.storage.createPage(pageData)
        await this.storeLocators(contentIdentifier)

        if (opts.addInboxEntryOnCreate) {
            await this.options.createInboxEntry(pageData.fullUrl)
        }
    }

    getContentIdentifier(normalizedUrl: string) {
        return this.contentInfo[normalizedUrl]?.primaryIdentifier
    }

    async storeLocators(identifier: ContentIdentifier) {
        if (!identifier) {
            return // there were no fingerprints, so there's no need to use locators
        }

        const contentInfo = this.contentInfo[identifier.normalizedUrl]
        if (!contentInfo) {
            return
        }
        await this.storage.storeLocators({
            identifier: contentInfo.primaryIdentifier,
            locators: contentInfo.locators,
        })
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
        const analysis = await analysePage({
            tabId: props.tabId,
            tabManagement: this.options.tabManagement,
            fetch: this.fetch,
            includeContent: props.stubOnly
                ? 'metadata-only'
                : 'metadata-with-full-text',
            includeFavIcon,
        })

        const pageData = await pipeline({
            pageDoc: { ...analysis, url: props.fullUrl },
            rejectNoContent: !props.stubOnly,
        })
        await this.storeDocContent(normalizeUrl(pageData.url), analysis)

        if (analysis.favIconURI) {
            await this.storage.createFavIconIfNeeded(
                pageData.hostname,
                analysis.favIconURI,
            )
        }

        return pageData
    }

    async storeDocContent(
        normalizedUrl: string,
        analysis: Pick<
            PageAnalysis,
            'htmlBody' | 'pdfMetadata' | 'pdfPageTexts'
        >,
    ) {
        if (analysis.htmlBody) {
            await this.persistentStorage.createOrUpdatePage({
                normalizedUrl,
                storedContentType: StoredContentType.HtmlBody,
                content: analysis.htmlBody,
            })
        } else if (analysis.pdfMetadata && analysis.pdfPageTexts) {
            for (const key of Object.keys(analysis.pdfMetadata)) {
                if (analysis.pdfMetadata[key] === null) {
                    delete analysis.pdfMetadata[key]
                }
            }

            await this.persistentStorage.createOrUpdatePage({
                normalizedUrl,
                storedContentType: StoredContentType.PdfContent,
                content: {
                    metadata: analysis.pdfMetadata,
                    pageTexts: analysis.pdfPageTexts,
                },
            })
        }
    }

    private async processPageDataFromUrl(
        props: PageCreationProps,
    ): Promise<PipelineRes | null> {
        if (!this.options.fetchPageData) {
            throw new Error(
                'Instantiation error: fetch-page-data implementation was not given to constructor',
            )
        }

        const processed = await this.options.fetchPageData.process(
            props.fullUrl,
        )
        const { content: pageData } = processed
        await this.storeDocContent(normalizeUrl(pageData.url), processed)

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
        const pageData = await this._getPageData(props)
        if (!pageData) {
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

    async _findTabId(fullUrl: string) {
        let foundTabId = await this.options.tabManagement.findTabIdByFullUrl(
            fullUrl,
        )
        if (foundTabId) {
            return foundTabId
        }

        const contentInfo = this.contentInfo[normalizeUrl(fullUrl)]
        for (const locator of contentInfo?.locators ?? []) {
            foundTabId = await this.options.tabManagement.findTabIdByFullUrl(
                locator.originalLocation,
            )
            if (foundTabId) {
                return foundTabId
            }
        }
        return null
    }

    async _getPageData(props: PageCreationProps) {
        const foundTabId = await this._findTabId(props.fullUrl)
        if (foundTabId) {
            props.tabId = foundTabId
        } else {
            delete props.tabId
        }

        return props.tabId
            ? this.processPageDataFromTab(props)
            : this.processPageDataFromUrl(props)
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

    isTabPageIndexed(params: { tabId: number; fullPageUrl: string }) {
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
