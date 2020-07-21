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
import { AnnotSearchParams } from 'src/search/background/types'
import { OpenSidebarArgs } from 'src/sidebar-overlay/types'
import { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import SocialBG from 'src/social-integration/background'
import { buildPostUrlId } from 'src/social-integration/util'
import { SearchIndex } from 'src/search'
import PageStorage from 'src/page-indexing/background/storage'
import {
    Annotation,
    AnnotationSender,
    AnnotListEntry,
} from 'src/annotations/types'
import { AnnotationInterface, CreateAnnotationParams } from './types'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { InPageUIRibbonAction } from 'src/in-page-ui/shared-state/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from 'src/tags/utils'
import { TagsSettings } from 'src/tags/background/types'
import { limitSuggestionsStorageLength } from 'src/tags/background'
import { now } from 'moment'
import { generateUniqueAnnotationUrl } from 'src/annotations/utils'

interface TabArg {
    tab: Tabs.Tab
}

export default class DirectLinkingBackground {
    remoteFunctions: AnnotationInterface<'provider'>
    private backend: DirectLinkingBackend
    annotationStorage: AnnotationStorage
    private sendAnnotation: AnnotationSender
    private requests: AnnotationRequests
    private socialBg: SocialBG
    private _normalizeUrl: URLNormalizer
    private localStorage: BrowserSettingsStore<TagsSettings>

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

        this.remoteFunctions = {
            createDirectLink: this.createDirectLink.bind(this),
            getAllAnnotationsByUrl: this.getAllAnnotationsByUrl.bind(this),
            createAnnotation: this.createAnnotation.bind(this),
            editAnnotation: this.editAnnotation.bind(this),
            editAnnotationTags: this.editAnnotationTags.bind(this),
            updateAnnotationTags: this.updateAnnotationTags.bind(this),
            deleteAnnotation: this.deleteAnnotation.bind(this),
            getAnnotationTags: this.getTagsByAnnotationUrl.bind(this),
            addAnnotationTag: this.addTagForAnnotation.bind(this),
            delAnnotationTag: this.delTagForAnnotation.bind(this),
            followAnnotationRequest: this.followAnnotationRequest.bind(this),
            toggleSidebarOverlay: this.toggleSidebarOverlay.bind(this),
            toggleAnnotBookmark: this.toggleAnnotBookmark.bind(this),
            insertAnnotToList: this.insertAnnotToList.bind(this),
            removeAnnotFromList: this.removeAnnotFromList.bind(this),
            goToAnnotationFromSidebar: this.goToAnnotationFromDashboardSidebar.bind(
                this,
            ),
        }

        this.localStorage = new BrowserSettingsStore<TagsSettings>(
            options.browserAPIs.storage.local,
            { prefix: 'tags_' },
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
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

    async goToAnnotationFromDashboardSidebar(
        { tab }: TabArg,
        {
            url,
            annotation,
        }: {
            url: string
            annotation: Annotation
        },
    ) {
        url = url.startsWith('http') ? url : `https://${url}`

        const activeTab = await this.options.browserAPIs.tabs.create({
            active: true,
            url,
        })

        const pageAnnotations = await this.getAllAnnotationsByUrl(
            { tab },
            { url },
        )
        const highlightables = pageAnnotations.filter((annot) => annot.selector)

        const listener = async (tabId, changeInfo) => {
            // Necessary to insert the ribbon/sidebar in case the user has turned  it off.
            if (tabId === activeTab.id && changeInfo.status === 'complete') {
                try {
                    // TODO: This wait is a hack to mitigate trying to use the remote function `showSidebar` before it's ready
                    // it should be registered in the tab setup, but is not available immediately on this tab onUpdate handler
                    // since it is fired on the page complete, not on our content script setup complete.
                    await new Promise((resolve) => setTimeout(resolve, 500))

                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).showSidebar({
                        annotationUrl: annotation.url,
                        action: 'show_annotation',
                    })
                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).goToHighlight(annotation, highlightables)
                } catch (err) {
                    throw err
                } finally {
                    this.options.browserAPIs.tabs.onUpdated.removeListener(
                        listener,
                    )
                }
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

        if (openSidebar) {
            await runInTab<InPageUIContentScriptRemoteInterface>(
                tabId,
            ).showSidebar(
                activeUrl && {
                    anchor,
                    annotationUrl: activeUrl,
                    action: 'show_annotation',
                },
            )
        } else {
            const actions: { [Action in InPageUIRibbonAction]: boolean } = {
                tag: openToTags,
                comment: openToComment,
                bookmark: openToBookmark,
                list: openToCollections,
            }
            const actionPair = Object.entries(actions).findIndex((pair) => {
                return pair[1]
            })
            const action: InPageUIRibbonAction = actionPair[0]
            await runInTab<InPageUIContentScriptRemoteInterface>(
                tabId,
            ).showRibbon({
                action,
            })
        }
    }

    followAnnotationRequest({ tab }: TabArg) {
        this.requests.followAnnotationRequest(tab.id)
    }

    createDirectLink = async ({ tab }: TabArg, request) => {
        const pageTitle = tab.title
        const result = await this.backend.createDirectLink(request)
        await this.annotationStorage.createAnnotation({
            pageTitle,
            pageUrl: this._normalizeUrl(tab.url),
            body: request.anchor.quote,
            uniqueAnnotationUrl: result.url,
            selector: request.anchor,
            comment: '',
        })

        // Attempt to (re-)index, if user preference set, but don't wait for it
        this.annotationStorage.indexPageFromTab(tab)

        return result
    }

    getAllAnnotationsByPageUrl = async ({ tab }: TabArg, { pageUrl }) => {
        const annotations = this.annotationStorage.getAllAnnotationsByUrl()
    }

    getAllAnnotationsByUrl = async (
        { tab }: TabArg,
        { url, limit = 1000, skip = 0, ...params }: AnnotSearchParams,
        isSocialPost?: boolean,
    ): Promise<
        Array<
            Annotation & {
                hasBookmark: boolean
                createdWhen: number
                lastEdited?: number
            }
        >
    > => {
        console.log('this.annotationStorage.getAllAnnotationsByUrl...', {
            url,
            limit,
            skip,
            ...params,
        })

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

        console.log('this.annotationStorage.getAllAnnotationsByUrl =>', {
            annotations,
        })

        // TODO: performance - Must be a better way than looping through each annotation individually and querying twice?
        const annotResults = (await Promise.all(
            annotations.map(
                async ({ createdWhen, lastEdited, ...annotation }) => {
                    try {
                        const tags = await this.annotationStorage.getTagsByAnnotationUrl(
                            annotation.uniqueAnnotationUrl,
                        )

                        return {
                            ...annotation,
                            hasBookmark: await this.annotationStorage.annotHasBookmark(
                                {
                                    url: annotation.uniqueAnnotationUrl,
                                },
                            ),
                            createdWhen: createdWhen.getTime(),
                            tags: tags.map((t) => t.name),
                            lastEdited:
                                lastEdited && lastEdited instanceof Date
                                    ? lastEdited.getTime()
                                    : undefined,
                        }
                    } catch (e) {
                        console.log('Error getting extra annotation data', e)
                        throw e
                    }
                },
            ),
        )) as any

        console.log('getAllAnnotationsByUrl', { annotResults })

        return annotResults
    }

    async createAnnotation(
        { tab }: TabArg,
        toCreate: CreateAnnotationParams,
        { skipPageIndexing }: { skipPageIndexing?: boolean } = {},
    ) {
        let pageUrl = this._normalizeUrl(
            toCreate.pageUrl == null ? tab.url : toCreate.pageUrl,
        )

        if (toCreate.isSocialPost) {
            pageUrl = await this.lookupSocialId(pageUrl)
        }

        const pageTitle = toCreate.title == null ? tab.title : toCreate.title
        const uniqueAnnotationUrl =
            toCreate.uniqueAnnotationUrl ??
            generateUniqueAnnotationUrl({ pageUrl, now: () => Date.now() })

        await this.annotationStorage.createAnnotation({
            pageUrl,
            uniqueAnnotationUrl,
            pageTitle,
            comment: toCreate.comment,
            body: toCreate.body,
            selector: toCreate.selector,
            createdWhen: toCreate.createdWhen,
        })

        // Attempt to (re-)index, if user preference set, but don't wait for it
        if (!skipPageIndexing) {
            this.annotationStorage.indexPageFromTab(tab)
        }

        if (toCreate.bookmarked) {
            await this.toggleAnnotBookmark(
                { tab },
                { url: uniqueAnnotationUrl },
            )
        }

        return uniqueAnnotationUrl
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

    async _updateTagSuggestionsCache(args: {
        added?: string
        removed?: string
    }) {
        return updateSuggestionsCache({
            ...args,
            suggestionLimit: limitSuggestionsStorageLength,
            getCache: async () => {
                const suggestions = await this.localStorage.get('suggestions')
                return suggestions ?? []
            },
            setCache: (suggestions: string[]) =>
                this.localStorage.set('suggestions', suggestions),
        })
    }

    async addTagForAnnotation(_, { tag, url }) {
        await this._updateTagSuggestionsCache({ added: tag })
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

    async updateAnnotationTags(
        _,
        { tags, url }: { tags: string[]; url: string },
    ) {
        const existingTags = await this.annotationStorage.getTagsByAnnotationUrl(
            url,
        )

        const existingTagsSet = new Set(existingTags.map((tag) => tag.name))
        const incomingTagsSet = new Set(tags)
        const tagsToBeDeleted: string[] = []
        const tagsToBeAdded: string[] = []

        for (const incomingTag of incomingTagsSet) {
            if (!existingTagsSet.has(incomingTag)) {
                tagsToBeAdded.push(incomingTag)
            }
        }

        for (const existingTag of existingTagsSet) {
            if (!incomingTagsSet.has(existingTag)) {
                tagsToBeDeleted.push(existingTag)
            }
        }

        return this.editAnnotationTags(_, {
            url,
            tagsToBeAdded,
            tagsToBeDeleted,
        })
    }

    private async lookupSocialId(id: string): Promise<string> {
        const postId = await this.socialBg.getPostIdFromUrl(id)
        return buildPostUrlId({ postId }).url
    }
}
