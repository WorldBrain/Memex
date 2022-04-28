import createResolvable, { Resolvable } from '@josephg/resolvable'
import StorageManager from '@worldbrain/storex'
import { normalizeUrl, isFileUrl } from '@worldbrain/memex-url-utils'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'
import {
    ContentFingerprint,
    ContentLocatorFormat,
    ContentLocatorType,
    LocationSchemeType,
    FingerprintSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import {
    ContentIdentifier,
    ContentLocator,
} from '@worldbrain/memex-common/lib/page-indexing/types'
import {
    fingerprintsEqual,
    isPagePdf,
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
    WaitForContentIdentifierReturns,
} from './types'
import {
    remoteFunctionWithExtraArgs,
    registerRemoteFunctions,
} from '../../util/webextensionRPC'

interface ContentInfo {
    locators: ContentLocator[]
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

    _identifiersForTabPages: {
        [tabId: number]: {
            [fullPageUrl: string]: Resolvable<ContentIdentifier>
        }
    } = {}

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
        },
    ) {
        this.storage = new PageStorage({
            storageManager: options.storageManager,
        })
        this.persistentStorage = new PersistentPageStorage({
            storageManager: options.persistentStorageManager,
        })

        this.remoteFunctions = {
            initContentIdentifier: remoteFunctionWithExtraArgs((info, params) =>
                this.initContentIdentifier({
                    ...params,
                    tabId: params.tabId ?? info.tab?.id,
                }),
            ),
            waitForContentIdentifier: remoteFunctionWithExtraArgs(
                (info, params) =>
                    this.waitForContentIdentifier({
                        ...params,
                        tabId: params.tabId ?? info.tab?.id,
                    }),
            ),
        }
    }

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    async initContentIdentifier(
        params: InitContentIdentifierParams,
    ): Promise<InitContentIdentifierReturns> {
        const resolvable =
            params.tabId &&
            this._resolvableForIdentifierTabPage({
                tabId: params.tabId,
                fullUrl: params.locator.originalLocation,
            })

        const regularNormalizedUrl = normalizeUrl(
            params.locator.originalLocation,
        )
        const regularIdentifier: ContentIdentifier = {
            normalizedUrl: regularNormalizedUrl,
            fullUrl: params.locator.originalLocation,
        }

        if (!params.fingerprints.length) {
            // This is where regular, non-PDF pages leave
            resolvable?.resolve?.(regularIdentifier)
            return regularIdentifier
        }

        let contentInfo = this.contentInfo[regularNormalizedUrl]
        let stored: {
            identifier: ContentIdentifier
            locators: ContentLocator[]
        }

        if (!contentInfo) {
            stored = await this.storage.getContentIdentifier({
                fingerprints: params.fingerprints,
            })

            if (!stored) {
                const generatedNormalizedUrl = `memex.cloud/ct/${params.fingerprints[0].fingerprint}.${params.locator.format}`
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
                // Stored content ID exists for these fingerprints, so attempt grabbing info
                //   from cache using the stored ID, or seed it if miss
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

        // Keep track of the orig ID passed into this function, as an alias ID of the main content info
        if (
            !contentInfo.aliasIdentifiers.find(
                (identifier) =>
                    identifier.normalizedUrl === regularNormalizedUrl,
            )
        ) {
            contentInfo.aliasIdentifiers.push(regularIdentifier)
        }

        // Keep track of new fingerprints as locators on the main content info
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
            contentInfo.locators.push({
                ...params.locator,
                location: normalizeUrl(params.locator.originalLocation),
                locationType: isFile
                    ? ContentLocatorType.Local
                    : ContentLocatorType.Remote,
                locationScheme: isFile
                    ? LocationSchemeType.FilesystemPathV1
                    : LocationSchemeType.NormalizedUrlV1,
                fingerprint: fingerprint.fingerprint,
                fingerprintScheme: fingerprint.fingerprintScheme,
                normalizedUrl: contentInfo.primaryIdentifier.normalizedUrl,
                primary: true,
                valid: true,
                version: 0,
                lastVisited: this.options.getNow(),
            })
        }
        if (stored && hasNewLocators) {
            await this.storeLocators(contentInfo.primaryIdentifier)
        }

        resolvable?.resolve?.(contentInfo.primaryIdentifier)
        return contentInfo.primaryIdentifier
    }

    waitForContentIdentifier = async (params: {
        tabId: number
        fullUrl: string
        timeout?: number
    }): Promise<WaitForContentIdentifierReturns> => {
        // TODO: Try and simplify this logic. Essentially, it was easily possible to get into states where the resolvable would
        //  never get resolved (tab where the content-script doesn't run, and thus doesn't call initContentIdentifier), so solving
        //  that by throwing an error after a timeout.
        let winner: 'resolvable' | 'timeout'

        const resolvable = new Promise<ContentIdentifier>(async (resolve) => {
            const identifier = await this._resolvableForIdentifierTabPage(
                params,
            )
            winner = winner ?? 'resolvable'
            resolve(identifier)
        })

        const timeout = new Promise<ContentIdentifier>((resolve) =>
            setTimeout(() => {
                winner = winner ?? 'timeout'
                resolve()
            }, params.timeout ?? 2500),
        )

        const contentIdentifier = await Promise.race([resolvable, timeout])
        if (winner === 'timeout') {
            throw new Error('Could not resolve identifier in time')
        }
        return contentIdentifier
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
        const { favIconURI } = pageData
        pageData = this.removeAnyUnregisteredFields(pageData)

        const contentIdentifier = this.contentInfo[pageData.url]
            ?.primaryIdentifier
        if (contentIdentifier) {
            pageData.fullUrl = contentIdentifier.fullUrl
            pageData.url = contentIdentifier.normalizedUrl
        }
        const normalizedUrl = pageData.url

        const existingPage = await this.storage.getPage(normalizedUrl)
        if (existingPage) {
            await this.storage.updatePage(pageData, existingPage)
        } else {
            await this.storage.createPage(pageData)
        }

        if (contentIdentifier) {
            await this.storeLocators(contentIdentifier)
        }

        if (opts.addInboxEntryOnCreate && !existingPage) {
            await this.options.createInboxEntry(pageData.fullUrl)
        }

        if (favIconURI != null) {
            await this.addFavIconIfNeeded(pageData.url, favIconURI)
        }
    }

    async storeLocators(identifier: ContentIdentifier) {
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
        if (props.tabId == null) {
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
        if (processed.pdfFingerprints) {
            await this.initContentIdentifier({
                locator: {
                    format: ContentLocatorFormat.PDF,
                    originalLocation: props.fullUrl,
                },
                fingerprints: processed.pdfFingerprints.map(
                    (fingerprint): ContentFingerprint => ({
                        fingerprintScheme: FingerprintSchemeType.PdfV1,
                        fingerprint,
                    }),
                ),
            })
        }
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

    private async _findTabId(fullUrl: string) {
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

    private async _getPageData(props: PageCreationProps) {
        // PDF pages should always have their tab IDs set, so don't fetch them from the tabs API
        //   TODO: have PDF pages pass down their original URLs here, instead of the memex.cloud/ct/ ones,
        //     so we don't have to do this dance
        if (!isPagePdf({ url: props.fullUrl })) {
            const foundTabId = await this._findTabId(props.fullUrl)
            if (foundTabId) {
                props.tabId = foundTabId
            } else {
                delete props.tabId
            }
        }

        return props.tabId != null
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
        delete this._identifiersForTabPages[event.tabId]
    }

    findLocatorsByNormalizedUrl(normalizedUrl: string) {
        return this.storage.findLocatorsByNormalizedUrl(normalizedUrl)
    }

    private _resolvableForIdentifierTabPage(params: {
        tabId: number
        fullUrl: string
    }) {
        const resolvablesForTab =
            this._identifiersForTabPages[params.tabId] ?? {}
        this._identifiersForTabPages[params.tabId] = resolvablesForTab

        const resolvable =
            resolvablesForTab[params.fullUrl] ?? createResolvable()
        resolvablesForTab[params.fullUrl] = resolvable

        return resolvable
    }

    private _getTime(time?: number | '$now') {
        if (!time && time !== 0) {
            return
        }
        return time !== '$now' ? time : this.options.getNow()
    }
}
