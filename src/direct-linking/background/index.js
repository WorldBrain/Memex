import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import DirectLinkingStorage, { AnnotationStorage } from './storage'
import normalize from '../../util/encode-url-for-id'

export default class DirectLinkingBackground {
    constructor({ storageManager }) {
        this.backend = new DirectLinkingBackend()
        this.directLinkingStorage = new DirectLinkingStorage({ storageManager })
        this.annotationStorage = new AnnotationStorage({ storageManager })
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
                followAnnotationRequest: (...params) => {
                    this.followAnnotationRequest(...params)
                },
                createDirectLink: (...params) => {
                    return this.createDirectLink(...params)
                },
                getAllAnnotations: (...params) => {
                    return this.getAllAnnotationsByUrl(...params)
                },
                createAnnotation: (...params) => {
                    return this.createAnnotation(...params)
                },
                editAnnotation: (...params) => {
                    return this.editAnnotation(...params)
                },
                deleteAnnotation: (...params) => {
                    return this.deleteAnnotation(...params)
                },
                openSidebarWithHighlight: (...params) => {
                    return this.openSidebarWithHighlight(...params)
                },
                toggleSidebar: () => {
                    return this.toggleSidebar()
                },
                getAnnotationTags: (...params) => {
                    return this.getTagsByAnnotationUrl(...params)
                },
                addAnnotationTag: (...params) => {
                    return this.addTagForAnnotation(...params)
                },
                delAnnotationTag: (...params) => {
                    return this.delTagForAnnotation(...params)
                },
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
        this.triggerSidebar('openSidebarAndSendAnchor', anchor)
    }

    followAnnotationRequest({ tab }) {
        this.requests.followAnnotationRequest(tab.id)
    }

    async createDirectLink({ tab }, request) {
        const pageTitle = tab.title
        const result = await this.backend.createDirectLink(request)
        await this.annotationStorage.insertDirectLink({
            pageTitle,
            pageUrl: tab.url,
            body: request.anchor.quote,
            url: result.url,
            selector: request.anchor,
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
        const uniqueUrl = `${pageUrl}/#${new Date().getTime()}`

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
