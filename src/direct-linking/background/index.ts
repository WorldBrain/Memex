import Storex from '@worldbrain/storex'
import { Tabs, Browser } from 'webextension-polyfill-ts'
import { normalizeUrl, URLNormalizer } from '@worldbrain/memex-url-utils'

import {
    makeRemotelyCallable,
    remoteFunction,
    runInTab,
} from 'src/util/webextensionRPC'
import DirectLinkingBackend from './backend'
import { setupRequestInterceptor } from './redirect'
import { AnnotationRequests } from './request'
import AnnotationStorage from './storage'
import { AnnotationSender, AnnotListEntry } from '../types'
import { AnnotSearchParams } from 'src/search/background/types'
import { OpenSidebarArgs } from 'src/sidebar-overlay/types'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import SocialBG from 'src/social-integration/background'
import { buildPostUrlId } from 'src/social-integration/util'
import { RibbonInteractionsInterface } from 'src/sidebar-overlay/ribbon/types'
import { SearchIndex } from 'src/search'
import PageStorage from 'src/page-indexing/background/storage'
import { Annotation } from 'src/annotations/types'

interface TabArg {
    tab: Tabs.Tab
}

export default class DirectLinkingBackground {
    private backend: DirectLinkingBackend
    annotationStorage: AnnotationStorage
    private sendAnnotation: AnnotationSender
    private requests: AnnotationRequests
    private socialBg: SocialBG
    private _normalizeUrl: URLNormalizer

    constructor(
        private options: {
            browserAPIs: Pick<Browser, 'tabs' | 'storage' | 'webRequest'>
            storageManager: Storex
            pageStorage: PageStorage
            socialBg: SocialBG
            searchIndex: SearchIndex
            normalizeUrl?: URLNormalizer
        },
    ) {
        this.socialBg = options.socialBg
        this.backend = new DirectLinkingBackend()

        this.annotationStorage = new AnnotationStorage({
            storageManager: options.storageManager,
            browserStorageArea: options.browserAPIs.storage.local,
            searchIndex: options.searchIndex,
            pageStorage: options.pageStorage,
        })

        this._normalizeUrl = options.normalizeUrl || normalizeUrl

        this.sendAnnotation = ({ tabId, annotation }) => {
            options.browserAPIs.tabs.sendMessage(tabId, {
                type: 'direct-link',
                annotation,
            })
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
            webRequest: this.options.browserAPIs.webRequest,
        })
    }

    async _triggerSidebar(functionName, ...args) {
        const [currentTab] = await this.options.browserAPIs.tabs.query({
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
        const activeTab = await this.options.browserAPIs.tabs.create({
            active: true,
            url,
        })

        const listener = async (tabId, changeInfo) => {
            if (tabId === activeTab.id && changeInfo.status === 'complete') {
                // Necessary to insert the ribbon/sidebar in case the user has turned
                // it off.
                await runInTab<RibbonInteractionsInterface>(
                    tabId,
                ).insertRibbon({ forceExpandRibbon: true })
                await remoteFunction('goToAnnotation', { tabId })(annotation)
                this.options.browserAPIs.tabs.onUpdated.removeListener(listener)
            }
        }
        this.options.browserAPIs.tabs.onUpdated.addListener(listener)
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
        const [currentTab] = await this.options.browserAPIs.tabs.query({
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
        await runInTab<RibbonInteractionsInterface>(tabId).insertRibbon({
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
            pageUrl: this._normalizeUrl(tab.url),
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
        isSocialPost?: boolean,
    ) {
        url = url == null && tab != null ? tab.url : url
        url = isSocialPost
            ? await this.lookupSocialId(url)
            : this._normalizeUrl(url)

        const annotations = await this.annotationStorage.getAllAnnotationsByUrl(
            {
                url,
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
        {
            url,
            title,
            comment,
            body,
            selector,
            bookmarked,
            isSocialPost,
            createdWhen = new Date(),
        },
        { skipPageIndexing }: { skipPageIndexing?: boolean } = {},
    ) {
        let pageUrl = this._normalizeUrl(url == null ? tab.url : url)

        if (isSocialPost) {
            pageUrl = await this.lookupSocialId(pageUrl)
        }

        const pageTitle = title == null ? tab.title : title
        const uniqueUrl = `${pageUrl}/#${Date.now()}`

        await this.annotationStorage.createAnnotation({
            pageUrl,
            url: uniqueUrl,
            pageTitle,
            comment,
            body,
            selector,
            createdWhen,
        })

        // Attempt to (re-)index, if user preference set, but don't wait for it
        if (!skipPageIndexing) {
            this.annotationStorage.indexPageFromTab(tab)
        }

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

    async editAnnotation(_, pk, comment, isSocialPost?: boolean) {
        if (isSocialPost) {
            pk = await this.lookupSocialId(pk)
        }

        return this.annotationStorage.editAnnotation(pk, comment)
    }

    async deleteAnnotation(_, pk, isSocialPost?: boolean) {
        if (isSocialPost) {
            pk = await this.lookupSocialId(pk)
        }

        await this.annotationStorage.deleteTagsByUrl({ url: pk })
        await this.annotationStorage.deleteBookmarkByUrl({ url: pk })
        await this.annotationStorage.deleteListEntriesByUrl({ url: pk })
        await this.annotationStorage.deleteAnnotation(pk)
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

    private async lookupSocialId(id: string): Promise<string> {
        const postId = await this.socialBg.getPostIdFromUrl(id)
        return buildPostUrlId({ postId }).url
    }
}
