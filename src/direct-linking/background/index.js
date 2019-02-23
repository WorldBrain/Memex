import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import DirectLinkingStorage, { AnnotationStorage } from './storage'
import normalize from '../../util/encode-url-for-id'
import { getPdfFingerprintForURL } from 'src/activity-logger/background/pdffingerprint'

export default class DirectLinkingBackground {
    constructor({ storageManager, getDb }) {
        this.backend = new DirectLinkingBackend()
        this.directLinkingStorage = new DirectLinkingStorage({
            storageManager,
            getDb,
        })
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
                followAnnotationRequest: (...params) => {
                    this.followAnnotationRequest(...params)
                },
                createDirectLink: (...params) => {
                    return this.createDirectLink(...params)
                },
                getAllAnnotationsByUrl: (...params) => {
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
                toggleSidebarOverlay: (...params) => {
                    return this.toggleSidebarOverlay(...params)
                },
                getTagsByAnnotationUrl: (...params) => {
                    return this.getTagsByAnnotationUrl(...params)
                },
                addAnnotationTag: (...params) => {
                    return this.addTagForAnnotation(...params)
                },
                delAnnotationTag: (...params) => {
                    return this.delTagForAnnotation(...params)
                },
                editAnnotationTags: (...params) => {
                    return this.editAnnotationTags(...params)
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

    async _triggerSidebar(functionName, ...args) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        await remoteFunction(functionName, { tabId: currentTab.id })(...args)
    }

    async toggleSidebarOverlay({ tab }, { anchor, override } = {}) {
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
        let annotations
        if (pageUrl.endsWith('.pdf')) {
            const pdfFingerprint = await getPdfFingerprintForURL(pageUrl)
            annotations = await this.annotationStorage.getAnnotationsByFingerprint(
                pdfFingerprint,
            )
        } else {
            annotations = await this.annotationStorage.getAnnotationsByUrl(
                pageUrl,
            )
        }
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
        let pdfFingerprint = null
        if (pageUrl.endsWith('.pdf')) {
            pdfFingerprint = await getPdfFingerprintForURL(normalize(pageUrl))
        }
        const pageTitle = title === null ? tab.title : title
        const uniqueUrl = `${pageUrl}/#${new Date().getTime()}`

        await this.annotationStorage.createAnnotation({
            pageUrl,
            url: uniqueUrl,
            pdfFingerprint,
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

    async editAnnotationTags({ tab }, { tagsToBeAdded, tagsToBeDeleted, url }) {
        return this.annotationStorage.editAnnotationTags(
            tagsToBeAdded,
            tagsToBeDeleted,
            url,
        )
    }
}
