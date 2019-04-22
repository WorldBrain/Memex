import { browser, Tabs } from 'webextension-polyfill-ts'

import { makeRemotelyCallable, remoteFunction } from 'src/util/webextensionRPC'
import { StorageManager, Dexie, search as searchPages } from 'src/search'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import AnnotationStorage from './storage'
import normalize from '../../util/encode-url-for-id'
import { AnnotationSender, AnnotListEntry } from '../types'
import { AnnotSearchParams } from 'src/search/background/types'
import { OpenSidebarArgs } from 'src/sidebar-overlay/types'
import { Annotation, KeyboardActions } from 'src/sidebar-overlay/sidebar/types'

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
                getAllAnnotationsByUrl: this.getAllAnnotationsByUrl.bind(this),
                createAnnotation: this.createAnnotation.bind(this),
                editAnnotation: this.editAnnotation.bind(this),
                editAnnotationTags: this.editAnnotationTags.bind(this),
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
                goToAnnotationFromSidebar: this.goToAnnotationFromSidebar.bind(
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

    async _triggerSidebar(functionName, ...args) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        await remoteFunction(functionName, { tabId: currentTab.id })(...args)
    }

    async goToAnnotationFromSidebar(
        { tab }: TabArg,
        {
            url,
            annotation,
        }: {
            url: string
            annotation: Annotation
        },
    ) {
        const activeTab = await browser.tabs.create({ active: true, url })

        const listener = async (tabId, changeInfo) => {
            if (tabId === activeTab.id && changeInfo.status === 'complete') {
                // Necessary to insert the ribbon/sidebar in case the user has turned
                // it off.
                await remoteFunction('insertRibbon', { tabId })()
                await remoteFunction('goToAnnotation', { tabId })(annotation)
                browser.tabs.onUpdated.removeListener(listener)
            }
        }
        browser.tabs.onUpdated.addListener(listener)
    }

    async toggleSidebarOverlay(
        { tab },
        {
            anchor,
            override,
            activeUrl,
            openSidebar,
            openToTags,
            openToComment,
            openToBookmark,
            openToCollections,
        }: OpenSidebarArgs &
            Partial<KeyboardActions> & {
                anchor?: any
                override?: boolean
                openSidebar?: boolean
            } = {
            anchor: null,
            override: false,
            activeUrl: undefined,
        },
    ) {
        const [currentTab] = await browser.tabs.query({
            active: true,
            currentWindow: true,
        })

        const { id: tabId } = currentTab

        const forceExpandRibbon =
            openToTags ||
            openToComment ||
            openToCollections ||
            openToBookmark ||
            openSidebar

        // Make sure that the ribbon is inserted before trying to open the
        // sidebar.
        await remoteFunction('insertRibbon', { tabId })({
            override,
            forceExpandRibbon,
            openToCollections,
            openToBookmark,
            openToComment,
            openToTags,
        })

        if (!forceExpandRibbon || openSidebar) {
            await remoteFunction('openSidebar', { tabId })({
                anchor,
                activeUrl,
            })
        }
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
        { url, limit = 1000, skip = 0, ...params }: AnnotSearchParams,
    ) {
        url = url == null && tab != null ? tab.url : url

        const annotations = await this.annotationStorage.getAllAnnotationsByUrl(
            {
                url: normalize(url),
                limit,
                skip,
                ...params,
            },
        )

        const annotResults = await Promise.all(
            annotations.map(
                async ({ createdWhen, lastEdited, ...annotation }) => ({
                    ...annotation,
                    hasBookmark: await this.annotationStorage.annotHasBookmark({
                        url: annotation.url,
                    }),
                    createdWhen: createdWhen.getTime(),
                    lastEdited:
                        lastEdited && lastEdited instanceof Date
                            ? lastEdited.getTime()
                            : undefined,
                }),
            ),
        )

        return annotResults
    }

    async createAnnotation(
        { tab }: TabArg,
        { url, title, comment, body, selector, bookmarked },
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

        if (bookmarked) {
            await this.toggleAnnotBookmark({ tab }, { url: uniqueUrl })
        }

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
