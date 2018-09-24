import { browser } from 'webextension-polyfill-ts'

import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import QueryBuilder from 'src/search/query-builder'
import { StorageManager, Dexie } from 'src/search'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import DirectLinkingStorage, { AnnotationStorage } from './storage'
import normalize from '../../util/encode-url-for-id'
import { AnnotationSender } from '../types'

export default class DirectLinkingBackground {
    private backend: DirectLinkingBackend
    private queryBuilderFactory: () => QueryBuilder
    private annotationStorage: AnnotationStorage
    private directLinkingStorage: DirectLinkingStorage
    private sendAnnotation: AnnotationSender
    private requests: AnnotationRequests

    constructor({
        storageManager,
        getDb,
        queryBuilder = () => new QueryBuilder(),
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
        queryBuilder?: () => QueryBuilder
    }) {
        this.backend = new DirectLinkingBackend()
        this.queryBuilderFactory = queryBuilder

        this.annotationStorage = new AnnotationStorage({
            storageManager,
            getDb,
        })

        this.directLinkingStorage = new DirectLinkingStorage({
            storageManager,
            getDb,
        })

        this.sendAnnotation = ({ tabId, annotation }) => {
            browser.tabs.sendMessage(tabId, { type: 'direct-link', annotation })
        }

        this.requests = new AnnotationRequests(
            this.backend,
            this.sendAnnotation,
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(
            {
                createDirectLink: this.createDirectLink.bind(this),
                getAllAnnotations: this.getAllAnnotationsByUrl.bind(this),
                createAnnotation: this.createAnnotation.bind(this),
                editAnnotation: this.editAnnotation.bind(this),
                deleteAnnotation: this.deleteAnnotation.bind(this),
                searchAnnotations: this.searchAnnotations.bind(this),
                toggleSidebar: this.toggleSidebar.bind(this),
                getAnnotationTags: this.getTagsByAnnotationUrl.bind(this),
                addAnnotationTag: this.addTagForAnnotation.bind(this),
                delAnnotationTag: this.delTagForAnnotation.bind(this),
                followAnnotationRequest: this.followAnnotationRequest.bind(
                    this,
                ),
                openSidebarWithHighlight: this.openSidebarWithHighlight.bind(
                    this,
                ),
            },
            { insertExtraArg: true },
        )
    }

    setupRequestInterceptor() {
        setupRequestInterceptor({
            requests: this.requests,
            webRequest: browser.webRequest,
        })
    }

    async triggerSidebar(functionName, ...args) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        await remoteFunction(functionName, { tabId: currentTab.id })(...args)
    }

    async toggleSidebar() {
        await this.triggerSidebar('toggleSidebarOverlay')
    }

    async openSidebarWithHighlight({ tab }, anchor) {
        // Toggling the sidebar ensures that if the page does not have the
        // ribbon mounted at this point, then it will get inserted before
        // proceeding any further.
        await this.toggleSidebar()
        this.triggerSidebar('openSidebarAndSendAnchor', anchor)
    }

    followAnnotationRequest({ tab }) {
        this.requests.followAnnotationRequest(tab.id)
    }

    async createDirectLink({ tab }, request) {
        const pageTitle = tab.title
        const result = await this.backend.createDirectLink(request)
        await this.annotationStorage.createAnnotation({
            pageTitle,
            pageUrl: tab.url,
            body: request.anchor.quote,
            url: result.url,
            selector: request.anchor,
            comment: '',
        })

        // Attempt to (re-)index, if user preference set, but don't wait for it
        this.annotationStorage.indexPageFromTab(tab)

        return result
    }

    async getAllAnnotationsByUrl({ tab }, url) {
        let pageUrl = url === null ? tab.url : url
        pageUrl = normalize(pageUrl)
        const annotations = await this.annotationStorage.getAnnotationsByUrl(
            pageUrl,
        )
        return annotations.map(
            ({ createdWhen, lastEdited, ...annotation }) => ({
                ...annotation,
                createdWhen: createdWhen.getTime(),
                lastEdited: lastEdited.getTime ? lastEdited.getTime() : null,
            }),
        )
    }

    async createAnnotation({ tab }, { url, title, comment, body, selector }) {
        const pageUrl = url === null ? tab.url : url
        const pageTitle = title === null ? tab.title : title
        const uniqueUrl = `${pageUrl}/#${Date.now()}`

        await this.annotationStorage.createAnnotation({
            pageUrl,
            url: uniqueUrl,
            pageTitle,
            comment,
            body,
            selector,
        })

        return uniqueUrl
    }

    async searchAnnotations(_, { query, ...params }) {
        const qb = this.queryBuilderFactory()
            .searchTerm(query)
            .get()

        if (qb.isBadTerm || qb.isInvalidSearch) {
            return []
        }

        return this.annotationStorage.search({
            terms: [...qb.query],
            ...params,
        })
    }

    async editAnnotation({ tab }, pk, comment) {
        return this.annotationStorage.editAnnotation(pk, comment)
    }

    async deleteAnnotation({ tab }, pk) {
        return this.annotationStorage.deleteAnnotation(pk)
    }

    async getTagsByAnnotationUrl({ tab }, url) {
        return this.annotationStorage.getTagsByAnnotationUrl(url)
    }

    async addTagForAnnotation({ tab }, { tag, url }) {
        return this.annotationStorage.modifyTags(true)(tag, url)
    }

    async delTagForAnnotation({ tab }, { tag, url }) {
        return this.annotationStorage.modifyTags(false)(tag, url)
    }
}
