import type Storex from '@worldbrain/storex'
import type { Tabs, Browser } from 'webextension-polyfill'
import {
    normalizeUrl,
    isFullUrl,
} from '@worldbrain/memex-common/lib/url-utils/normalize'
import type { URLNormalizer } from '@worldbrain/memex-common/lib/url-utils/normalize/types'

import {
    makeRemotelyCallable,
    remoteFunction,
    runInTab,
} from 'src/util/webextensionRPC'
import AnnotationStorage from './storage'
import type { AnnotSearchParams } from 'src/search/background/types'
import type { KeyboardActions } from 'src/sidebar-overlay/sidebar/types'
import type SocialBG from 'src/social-integration/background'
import { buildPostUrlId } from 'src/social-integration/util'
import type { Annotation } from 'src/annotations/types'
import type { AnnotationInterface, CreateAnnotationParams } from './types'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { InPageUIRibbonAction } from 'src/in-page-ui/shared-state/types'
import { generateAnnotationUrl } from 'src/annotations/utils'
import { PageIndexingBackground } from 'src/page-indexing/background'
import type { Analytics } from 'src/analytics/types'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import { ServerStorageModules } from 'src/storage/types'
import type { GetUsersPublicDetailsResult } from '@worldbrain/memex-common/lib/user-management/types'
import { trackAnnotationCreate } from '@worldbrain/memex-common/lib/analytics/events'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import type { ImageSupportInterface } from '@worldbrain/memex-common/lib/image-support/types'
import type { AuthBackground } from 'src/authentication/background'
import { ImageSupportBackground } from 'src/image-support/background'

interface TabArg {
    tab: Tabs.Tab
}

export default class DirectLinkingBackground {
    remoteFunctions: AnnotationInterface<'provider'>
    annotationStorage: AnnotationStorage
    private socialBg: SocialBG
    private _normalizeUrl: URLNormalizer

    constructor(
        private options: {
            browserAPIs: Pick<Browser, 'tabs' | 'storage'>
            storageManager: Storex
            analyticsBG: AnalyticsCoreInterface
            pages: PageIndexingBackground
            socialBg: SocialBG
            pkmSyncBG: PKMSyncBackgroundModule
            normalizeUrl?: URLNormalizer
            authBG: AuthBackground
            analytics: Analytics
            serverStorage: Pick<
                ServerStorageModules,
                'contentSharing' | 'users'
            >
            preAnnotationDelete(params: {
                annotationUrl: string
            }): Promise<void>
            imageSupport: ImageSupportBackground
        },
    ) {
        this.socialBg = options.socialBg
        this.annotationStorage = new AnnotationStorage({
            storageManager: options.storageManager,
            pkmSyncBG: options.pkmSyncBG,
            imageSupport: options.imageSupport,
            ___storageAPI: options.browserAPIs.storage,
        })

        this._normalizeUrl = options.normalizeUrl || normalizeUrl

        this.remoteFunctions = {
            getAllAnnotationsByUrl: this.getAllAnnotationsByUrl.bind(this),
            listAnnotationsByPageUrl: this.listAnnotationsByPageUrl.bind(this),
            listAnnotationIdsByColor: this.listAnnotationIdsByColor,
            createAnnotation: this.createAnnotation.bind(this),
            editAnnotation: this.editAnnotation.bind(this),
            editAnnotationTags: this.editAnnotationTags.bind(this),
            updateAnnotationTags: this.updateAnnotationTags.bind(this),
            deleteAnnotation: this.deleteAnnotation.bind(this),
            getAnnotationTags: this.getTagsByAnnotationUrl.bind(this),
            addAnnotationTag: this.addTagForAnnotation.bind(this),
            delAnnotationTag: this.delTagForAnnotation.bind(this),
            updateAnnotationBookmark: this.updateAnnotationBookmark.bind(this),
            toggleSidebarOverlay: this.toggleSidebarOverlay.bind(this),
            toggleAnnotBookmark: this.toggleAnnotBookmark.bind(this),
            getAnnotBookmark: this.getAnnotBookmark.bind(this),
            getSharedAnnotations: this.getSharedAnnotations,
            getListIdsForAnnotation: this.getListIdsForAnnotation,
            getAnnotationByPk: this.getAnnotationByPk.bind(this),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
    }

    async _triggerSidebar(functionName, ...args) {
        const [currentTab] = await this.options.browserAPIs.tabs.query({
            active: true,
            currentWindow: true,
        })

        await remoteFunction(functionName, { tabId: currentTab.id })(...args)
    }

    async toggleSidebarOverlay(
        { tab },
        {
            anchor,
            override,
            openSidebar,
            openToTags,
            openToComment,
            openToBookmark,
            openToCollections,
            unifiedAnnotationId,
        }: Partial<KeyboardActions> & {
            anchor?: any
            override?: boolean
            openSidebar?: boolean
            unifiedAnnotationId: string
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
            ).showSidebar({
                action: 'show_annotation',
                annotationLocalId: unifiedAnnotationId,
            })
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

    async removeChildAnnotationsFromList(
        normalizedPageUrl: string,
        listId: number,
    ): Promise<void> {
        const annotations = await this.annotationStorage.listAnnotationsByPageUrl(
            { pageUrl: normalizedPageUrl },
        )

        await Promise.all(
            annotations.map(({ url }) =>
                this.annotationStorage.removeAnnotFromList({ listId, url }),
            ),
        )
    }

    listAnnotationsByPageUrl = async (
        { tab }: TabArg,
        {
            pageUrl,
            ...args
        }: { pageUrl: string; withTags?: boolean; withBookmarks?: boolean },
    ) => {
        const annotations = await this.annotationStorage.listAnnotationsByPageUrl(
            {
                pageUrl,
                ...args,
            },
        )

        return annotations.map((annot) => ({
            ...annot,
            createdWhen: annot.createdWhen?.getTime(),
            lastEdited: (annot.lastEdited ?? annot.createdWhen)?.getTime(),
        }))
    }
    listAnnotationIdsByColor = async (
        info: { tab: { id: number } },
        params: { color: string },
    ) => {
        const annotationIDs = await this.annotationStorage.listAnnotationIdsByColor(
            params.color,
        )

        return annotationIDs
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
        console.warn(
            'DEPRECIATED this.annotationStorage.getAllAnnotationsByUrl...',
            {
                url,
                limit,
                skip,
                ...params,
            },
        )

        url =
            url == null && tab != null ? getUnderlyingResourceUrl(tab.url) : url
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

        // TODO: performance - Must be a better way than looping through each annotation individually and querying twice
        // TODO: Depreciated this and use the above listAnnotationsByPageUrl (implement pagination / or other required search)
        const annotResults = (await Promise.all(
            annotations.map(
                async ({ createdWhen, lastEdited, ...annotation }) => {
                    try {
                        const tags = await this.annotationStorage.getTagsByAnnotationUrl(
                            annotation.url,
                        )

                        return {
                            ...annotation,
                            hasBookmark: await this.annotationStorage.annotHasBookmark(
                                {
                                    url: annotation.url,
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
                        console.error('Error getting extra annotation data', e)
                        throw e
                    }
                },
            ),
        )) as any

        return annotResults
    }

    async createAnnotation(
        { tab }: { tab: Pick<Tabs.Tab, 'id' | 'url' | 'title'> },
        toCreate: CreateAnnotationParams,
        { skipPageIndexing }: { skipPageIndexing?: boolean } = {},
    ) {
        let fullPageUrl = toCreate.pageUrl ?? getUnderlyingResourceUrl(tab?.url)
        if (!isFullUrl(fullPageUrl)) {
            fullPageUrl = getUnderlyingResourceUrl(tab?.url)
            if (!isFullUrl(fullPageUrl)) {
                throw new Error(
                    'Could not get full URL while creating annotation',
                )
            }
        }

        let normalizedPageUrl = this._normalizeUrl(fullPageUrl)

        if (toCreate.isSocialPost) {
            normalizedPageUrl = await this.lookupSocialId(normalizedPageUrl)
        }

        const activeTab = await this.options.browserAPIs.tabs.query({
            active: true,
            currentWindow: true,
        })
        const activeTabTitle = activeTab[0]?.title

        const pageTitle =
            toCreate.title == null ? activeTabTitle : toCreate.title

        if (!skipPageIndexing) {
            await this.options.pages.indexPage(
                {
                    fullUrl: fullPageUrl,
                    visitTime: '$now',
                    tabId: tab?.id,
                    metaData: { pageTitle: pageTitle ?? null },
                },
                { addInboxEntryOnCreate: true },
            )
        }

        const annotationUrl =
            toCreate.url ??
            generateAnnotationUrl({
                pageUrl: normalizedPageUrl,
                now: () => Date.now(),
            })

        if (isFullUrl(annotationUrl)) {
            throw new Error('Annotation ID should not be a full URL')
        }

        const userData = await this.options.authBG.authService.getCurrentUser()
        const userId = userData?.id

        await this.annotationStorage.createAnnotation({
            pageUrl: normalizedPageUrl,
            url: annotationUrl.toString(),
            pageTitle,
            comment: toCreate.comment,
            body: toCreate.body,
            selector: toCreate.selector,
            color: toCreate.color,
            createdWhen: new Date(toCreate.createdWhen ?? Date.now()),
            userId: userId,
        })

        try {
            if (toCreate.comment && !toCreate.body) {
                await trackAnnotationCreate(this.options.analyticsBG, {
                    annotationType: 'note',
                })
            }
        } catch (e) {
            console.error('Error tracking annotation create event', e)
        }

        return annotationUrl.toString()
    }

    async getAnnotationByPk(_, { url }: { url: string }) {
        return this.annotationStorage.getAnnotationByPk({ url })
    }

    async toggleAnnotBookmark(_, { url }: { url: string }) {
        return this.annotationStorage.toggleAnnotBookmark({ url })
    }

    async getAnnotBookmark(_, { url }: { url: string }) {
        return this.annotationStorage.annotHasBookmark({ url })
    }

    getSharedAnnotations: AnnotationInterface<
        'provider'
    >['getSharedAnnotations'] = async (
        _,
        { sharedAnnotationReferences, withCreatorData },
    ) => {
        const { users, contentSharing } = this.options.serverStorage

        const annotationsById = await contentSharing.getAnnotations({
            references: sharedAnnotationReferences,
            skipUserHighlightColors: true,
        })

        let creatorData: GetUsersPublicDetailsResult
        if (withCreatorData) {
            const uniqueCreatorIds = new Set(
                Object.values(annotationsById).map((annot) => annot.creator.id),
            )
            creatorData = await users
                .getUsersPublicDetails(
                    [...uniqueCreatorIds].map((id) => ({
                        type: 'user-reference',
                        id,
                    })),
                )
                .catch((err) => null) // TODO: remove this once user ops are allowed on server
        }

        return sharedAnnotationReferences.map((ref) => ({
            ...annotationsById[ref.id],
            color: annotationsById[ref.id].color,
            creatorReference: annotationsById[ref.id].creator,
            creator: creatorData?.[annotationsById[ref.id].creator.id],
            selector:
                annotationsById[ref.id].selector != null
                    ? JSON.parse(annotationsById[ref.id].selector)
                    : undefined,
        }))
    }

    getListIdsForAnnotation: AnnotationInterface<
        'provider'
    >['getListIdsForAnnotation'] = async (_, { annotationId }) => {
        const listEntries = await this.annotationStorage.findListEntriesByUrl({
            url: annotationId,
        })
        const listIds = new Set<number>()
        listEntries.forEach((entry) => listIds.add(entry.listId))
        return [...listIds]
    }

    async updateAnnotationBookmark(
        _,
        { url, isBookmarked }: { url: string; isBookmarked: boolean },
    ) {
        return this.annotationStorage.updateAnnotationBookmark({
            url,
            isBookmarked,
        })
    }

    async editAnnotation(
        _: any,
        url: string,
        comment: string,
        color: string,
        body: string,
    ) {
        const existingAnnotation = await this.getAnnotationByPk(url, {
            url: url,
        })

        if (!existingAnnotation?.comment?.length) {
            if (this.options.analyticsBG) {
                try {
                    trackAnnotationCreate(this.options.analyticsBG, {
                        annotationType: 'annotation',
                    })
                } catch (error) {
                    console.error(
                        `Error tracking space create event', ${error}`,
                    )
                }
            }
        }

        return this.annotationStorage.editAnnotation(
            url,
            comment != null ? comment : existingAnnotation.comment,
            color != null ? color : existingAnnotation.color,
            body != null ? body : existingAnnotation.body,
        )
    }

    async deleteAnnotation(_, pk, isSocialPost?: boolean) {
        if (isSocialPost) {
            pk = await this.lookupSocialId(pk)
        }
        const isBookmarked = await this.getAnnotBookmark(_, { url: pk })
        const listEntries = await this.annotationStorage.findListEntriesByUrl({
            url: pk,
        })
        const tags = await this.getTagsByAnnotationUrl(_, pk)

        if (isBookmarked) {
            await this.annotationStorage.deleteBookmarkByUrl({ url: pk })
        }

        if (listEntries?.length) {
            await this.annotationStorage.deleteListEntriesByUrl({ url: pk })
        }

        if (tags?.length) {
            await this.annotationStorage.deleteTagsByUrl({ url: pk })
        }

        await this.options.preAnnotationDelete({
            annotationUrl: pk,
        })
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
