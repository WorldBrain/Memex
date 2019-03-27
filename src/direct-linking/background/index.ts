import { browser, Tabs } from 'webextension-polyfill-ts'

import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import { StorageManager, Dexie, search as searchPages } from 'src/search'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import AnnotationStorage from './storage'
import normalize from '../../util/encode-url-for-id'
import { AnnotationSender, AnnotListEntry } from '../types'

interface TabArg {
    tab: Tabs.Tab
}

export default class DirectLinkingBackground {
    private backend: DirectLinkingBackend
    private annotationStorage: AnnotationStorage
    private sendAnnotation: AnnotationSender
    private requests: AnnotationRequests

    constructor({
        storageManager,
        getDb,
    }: {
        storageManager: StorageManager
        getDb: () => Promise<Dexie>
    }) {
        this.backend = new DirectLinkingBackend()

        this.annotationStorage = new AnnotationStorage({
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
                getAnnotationTags: this.getTagsByAnnotationUrl.bind(this),
                addAnnotationTag: this.addTagForAnnotation.bind(this),
                delAnnotationTag: this.delTagForAnnotation.bind(this),
                followAnnotationRequest: this.followAnnotationRequest.bind(
                    this,
                ),
                toggleSidebarOverlay: this.toggleSidebarOverlay.bind(this),
                toggleAnnotBookmark: this.toggleAnnotBookmark.bind(this),
                insertAnnotToList: this.insertAnnotToList.bind(this),
                removeAnnotFromList: this.removeAnnotFromList.bind(this),
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

    async _triggerSidebar(functionName, ...args) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        await remoteFunction(functionName, { tabId: currentTab.id })(...args)
    }

    async toggleSidebarOverlay({ tab }, { anchor, override }) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        const { id: tabId } = currentTab
        // Make sure that the ribbon is inserted before trying to open the
        // sidebar.
        await remoteFunction('insertRibbon', { tabId })({ override })
        await remoteFunction('openSidebar', { tabId })(anchor)
    }

    followAnnotationRequest({ tab }: TabArg) {
        this.requests.followAnnotationRequest(tab.id)
    }

    async createDirectLink({ tab }: TabArg, request) {
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

    async getAllAnnotationsByUrl(
        { tab }: TabArg,
        url: string,
        limit = 10,
        skip = 0,
    ) {
        let pageUrl = url == null ? tab.url : url
        pageUrl = normalize(pageUrl)

        const annotations = await this.annotationStorage.getAnnotationsByUrl({
            pageUrl,
            limit,
            skip,
        })

        return annotations.map(
            ({ createdWhen, lastEdited, ...annotation }) => ({
                ...annotation,
                createdWhen: createdWhen.getTime(),
                lastEdited:
                    lastEdited && lastEdited instanceof Date
                        ? lastEdited.getTime()
                        : undefined,
            }),
        )
    }

    async createAnnotation(
        { tab }: TabArg,
        { url, title, comment, body, selector },
    ) {
        const pageUrl = url == null ? tab.url : url
        const pageTitle = title == null ? tab.title : title
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

    async insertAnnotToList({ tab }: TabArg, params: AnnotListEntry) {
        params.url = params.url == null ? tab.url : params.url

        return this.annotationStorage.insertAnnotToList(params)
    }

    async removeAnnotFromList({ tab }: TabArg, params: AnnotListEntry) {
        params.url = params.url == null ? tab.url : params.url

        return this.annotationStorage.removeAnnotFromList(params)
    }

    async toggleAnnotBookmark({ tab }: TabArg, { url }: { url: string }) {
        url = url == null ? tab.url : url

        return this.annotationStorage.toggleAnnotBookmark({ url })
    }

    async editAnnotation(_, pk, comment) {
        return this.annotationStorage.editAnnotation(pk, comment)
    }

    async deleteAnnotation(_, pk) {
        return this.annotationStorage.deleteAnnotation(pk)
    }

    async getTagsByAnnotationUrl(_, url) {
        return this.annotationStorage.getTagsByAnnotationUrl(url)
    }

    async addTagForAnnotation(_, { tag, url }) {
        return this.annotationStorage.modifyTags(true)(tag, url)
    }

    async delTagForAnnotation(_, { tag, url }) {
        return this.annotationStorage.modifyTags(false)(tag, url)
    }

    async editAnnotationTags({ tab }, { tagsToBeAdded, tagsToBeDeleted, url }) {
        return this.annotationStorage.editAnnotationTags(
            tagsToBeAdded,
            tagsToBeDeleted,
            url,
        )
    }
}
