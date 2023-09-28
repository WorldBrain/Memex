import type Storex from '@worldbrain/storex'
import type { Windows, Tabs, Storage } from 'webextension-polyfill'
import { isFullUrl } from '@worldbrain/memex-url-utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

import CustomListStorage from './storage'
import type { SearchIndex } from 'src/search'
import type {
    RemoteCollectionsInterface,
    CollectionsSettings,
    PageList,
    PageListEntry,
} from './types'
import { maybeIndexTabs } from 'src/page-indexing/utils'
import type { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '@worldbrain/memex-common/lib/utils/suggestions-cache'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import type TabManagementBackground from 'src/tab-management/background'
import type { ServerStorageModules } from 'src/storage/types'
import type { AuthServices } from 'src/services/types'
import type { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import { isExtensionTab } from 'src/tab-management/utils'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { PersonalList } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type ContentSharingBackground from 'src/content-sharing/background'
import type { PkmSyncInterface } from 'src/pkm-integrations/background/types'

const limitSuggestionsStorageLength = 25

export default class CustomListBackground {
    storage: CustomListStorage
    remoteFunctions: RemoteCollectionsInterface

    private localStorage: BrowserSettingsStore<CollectionsSettings>

    constructor(
        private options: {
            storageManager: Storex
            searchIndex: SearchIndex
            analyticsBG: AnalyticsCoreInterface
            contentSharing: ContentSharingBackground
            pages: PageIndexingBackground
            tabManagement: TabManagementBackground
            analytics: Analytics
            queryTabs?: Tabs.Static['query']
            windows?: Windows.Static
            localBrowserStorage: Storage.LocalStorageArea
            authServices: Pick<AuthServices, 'auth'>
            // TODO: the fact this needs to be passed down tells me this ideally should be done at a higher level (content sharing BG?)
            removeChildAnnotationsFromList: (
                normalizedPageUrl: string,
                listId: number,
            ) => Promise<void>
            serverStorage: Pick<
                ServerStorageModules,
                'activityFollows' | 'contentSharing'
            >
            pkmSyncBG?: PkmSyncInterface
        },
    ) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage({
            storageManager: options.storageManager,
            pkmSyncBG: options.pkmSyncBG,
        })

        this.remoteFunctions = {
            createCustomList: this.createCustomList,
            insertPageToList: async (params) => {
                const currentTab = await this.options.queryTabs?.({
                    active: true,
                    currentWindow: true,
                })
                params.tabId = currentTab?.[0]?.id
                return this.insertPageToList(params)
            },
            updateListName: this.updateList,
            removeList: this.removeList,
            removePageFromList: this.removePageFromList,
            fetchAllLists: this.fetchAllLists,
            fetchListById: this.fetchListById,
            fetchAnnotationRefsForRemoteListsOnPage: this
                .fetchAnnotationRefsForRemoteListsOnPage,
            fetchSharedListDataWithPageAnnotations: this
                .fetchSharedListDataWithPageAnnotations,
            fetchSharedListDataWithOwnership: this
                .fetchSharedListDataWithOwnership,
            fetchListPagesByUrl: this.fetchListPagesByUrl,
            fetchPageListEntriesByUrl: this.fetchPageListEntriesByUrl,
            fetchPageLists: this.fetchPageLists,
            addOpenTabsToList: this.addOpenTabsToList,
            removeOpenTabsFromList: this.removeOpenTabsFromList,
            updateListForPage: this.updateListForPage,
            fetchListDescriptions: this.fetchListDescriptions,
            updateListDescription: this.updateListDescription,
            getInboxUnreadCount: this.getInboxUnreadCount,
            fetchLocalDataForRemoteListEntryFromServer: this
                .fetchLocalDataForRemoteListEntryFromServer,
        }

        this.localStorage = new BrowserSettingsStore(
            options.localBrowserStorage,
            { prefix: 'custom-lists_' },
        )
    }

    generateListId() {
        return Date.now()
    }

    fetchAnnotationRefsForRemoteListsOnPage: RemoteCollectionsInterface['fetchAnnotationRefsForRemoteListsOnPage'] = async ({
        sharedListIds,
        normalizedPageUrl,
    }) => {
        const response = await this.options.contentSharing.options.backend.loadPageAnnotationRefsForLists(
            {
                listIds: sharedListIds,
                normalizedPageUrl,
            },
        )
        return response
    }

    fetchLocalDataForRemoteListEntryFromServer: RemoteCollectionsInterface['fetchLocalDataForRemoteListEntryFromServer'] = async ({
        normalizedPageUrl,
        remoteListId,
        opts,
    }) => {
        const response = await this.options.contentSharing.options.backend.loadLocalDataForListEntry(
            {
                listId: remoteListId,
                normalizedPageUrl,
                opts,
            },
        )
        if (response.status === 'permission-denied') {
            throw new Error(
                'Cannot get user data from server when unauthorized',
            )
        }
        if (response.status === 'not-found') {
            return null
        }
        return response.data
    }

    fetchSharedListDataWithPageAnnotations: RemoteCollectionsInterface['fetchSharedListDataWithPageAnnotations'] = async ({
        normalizedPageUrl,
        remoteListId,
    }) => {
        const { contentSharing } = this.options.serverStorage
        const listReference: SharedListReference = {
            id: remoteListId,
            type: 'shared-list-reference',
        }
        const sharedList = await contentSharing.getListByReference(
            listReference,
        )

        if (sharedList == null) {
            return null
        }

        const {
            [normalizedPageUrl]: annotations,
        } = await contentSharing.getAnnotationsForPagesInList({
            listReference,
            normalizedPageUrls: [normalizedPageUrl],
        })

        if (!annotations) {
            return {
                ...sharedList,
                sharedAnnotations: undefined,
            }
        }

        return {
            ...sharedList,
            sharedAnnotations: annotations.map(({ annotation }) => ({
                ...annotation,
                creator: { type: 'user-reference', id: annotation.creator },
                reference: {
                    type: 'shared-annotation-reference',
                    id: annotation.id,
                },
            })),
        }
    }

    fetchSharedListDataWithOwnership: RemoteCollectionsInterface['fetchSharedListDataWithOwnership'] = async ({
        remoteListId,
    }) => {
        const currentUser = await this.options.authServices.auth.getCurrentUser()
        if (!currentUser) {
            return null
        }

        const { contentSharing } = this.options.serverStorage
        const sharedList = await contentSharing.getListByReference({
            id: remoteListId,
            type: 'shared-list-reference',
        })
        if (sharedList == null) {
            return null
        }

        return {
            name: sharedList.title,
            id: sharedList.createdWhen,
            remoteId: sharedList.reference.id as string,
            createdAt: new Date(sharedList.createdWhen),
            isOwned: sharedList.creator.id === currentUser.id,
        }
    }

    fetchAllLists: RemoteCollectionsInterface['fetchAllLists'] = async ({
        skip = 0,
        limit = 2000,
        skipSpecialLists = false,
        includeDescriptions,
    }): Promise<PageList[]> => {
        return this.storage.fetchAllLists({
            includeDescriptions,
            skipSpecialLists,
            limit,
            skip,
        })
    }

    fetchListById = async ({ id }: { id: number }) => {
        return this.storage.fetchListWithPagesById(id)
    }

    fetchListByName = async ({ name }: { name: string }) => {
        return this.storage.fetchListIgnoreCase({ name })
    }

    createCustomLists = async ({ names }: { names: string[] }) => {
        const existingLists = new Map<string, number>()

        for (const name of names) {
            const list = await this.fetchListByName({ name })

            if (list) {
                existingLists.set(list.name, list.id)
            }
        }

        const missing = names.filter((name) => !existingLists.has(name))

        const missingEntries = new Map<string, number>()
        for (const name of missing) {
            const id = Date.now()
            missingEntries.set(name, id)
            await this.createCustomList({ name, id })
        }

        const listIds = new Map([...existingLists, ...missingEntries])

        return names.map((name) => listIds.get(name))
    }

    fetchListPagesById = async ({ id }: { id: number }) => {
        return this.storage.fetchListPagesById({
            listId: id,
        })
    }

    fetchListPagesByUrl = async ({ url }: { url: string }) => {
        return this.storage.fetchListPagesByUrl({
            url: normalizeUrl(url),
        })
    }
    fetchPageListEntriesByUrl = async ({ url }: { url: string }) => {
        return this.storage.fetchPageListEntriesByUrl({
            normalizedPageUrl: normalizeUrl(url),
        })
    }

    fetchPageLists = async ({ url }: { url: string }): Promise<number[]> => {
        const lists = await this.fetchListPagesByUrl({ url })

        return lists.map(({ id }) => id)
    }

    updateListSuggestionsCache = async (args: {
        added?: number
        removed?: number
    }) => {
        return updateSuggestionsCache({
            ...args,
            suggestionLimit: limitSuggestionsStorageLength,
            getCache: async () => {
                const suggestions = await this.localStorage.get('suggestionIds')
                return suggestions ?? []
            },
            setCache: (suggestions) =>
                this.localStorage.set('suggestionIds', suggestions),
        })
    }

    createInboxListIfAbsent({
        createdAt = new Date(),
    }: {
        createdAt?: Date
    } = {}): Promise<number> {
        return this.storage.createInboxListIfAbsent({ createdAt })
    }

    async createInboxListEntry({
        fullUrl,
        createdAt = new Date(),
    }: {
        fullUrl: string
        createdAt?: Date
    }): Promise<void> {
        const listId = await this.createInboxListIfAbsent({ createdAt })

        return this.storage.insertPageToList({
            listId,
            fullUrl,
            createdAt,
            pageUrl: normalizeUrl(fullUrl),
        })
    }

    getInboxUnreadCount = () => {
        return this.storage.countInboxUnread()
    }

    createCustomList: RemoteCollectionsInterface['createCustomList'] = async ({
        name,
        id: _id,
        type,
        createdAt,
        dontTrack,
    }) => {
        const id = _id ?? this.generateListId()
        const inserted = await this.storage.insertCustomList({
            id,
            type,
            name,
            createdAt,
            analyticsBG: this.options.analyticsBG,
            dontTrack,
        })
        await this.updateListSuggestionsCache({ added: id })

        return inserted
    }

    updateList = async ({
        id,
        oldName,
        newName,
    }: {
        id: number
        oldName: string
        newName: string
    }) => {
        return this.storage.updateListName({
            id,
            name: newName,
        })
    }

    insertPageToList = async (
        params: ({ url: string } | { contentIdentifier: ContentIdentifier }) & {
            id: number
            tabId?: number
            createdAt?: Date
            skipPageIndexing?: boolean
            suppressVisitCreation?: boolean
            suppressInboxEntry?: boolean
            pageTitle?: string
            dontTrack?: boolean
        },
    ): Promise<{ object: PageListEntry }> => {
        const { id } = params
        const url =
            'contentIdentifier' in params
                ? params.contentIdentifier?.fullUrl
                : params.url

        if (!isFullUrl(url)) {
            throw new Error(
                'Tried to insert page to list with a normalized, instead of a full URL',
            )
        }

        await this.updateListSuggestionsCache({ added: id })
        if (!params.skipPageIndexing) {
            await this.options.pages.indexPage(
                {
                    tabId: params.tabId,
                    fullUrl: url,
                    visitTime: !params.suppressVisitCreation
                        ? '$now'
                        : undefined,
                    metaData: {
                        pageTitle: params.pageTitle,
                    },
                },
                { addInboxEntryOnCreate: !params.suppressInboxEntry },
            )
        }

        const pageUrl = normalizeUrl(url)
        const existing = await this.storage.fetchListEntry(id, pageUrl)
        let remoteID = null
        try {
            remoteID = await this.options.contentSharing.storage.getRemoteListId(
                {
                    localId: id,
                },
            )
        } catch (error) {
            console.error(error)
        }

        if (existing != null) {
            return { object: existing }
        }

        const retVal = await this.storage.insertPageToList({
            pageUrl,
            listId: id,
            fullUrl: url,
            createdAt: params.createdAt,
            pageTitle: params.pageTitle,
            analyticsBG: this.options.analyticsBG,
            isShared: remoteID != null ?? false,
            dontTrack: params.dontTrack,
        })

        return retVal
    }

    removeList = async ({ id }: { id: number }) => {
        return this.storage.removeList({
            id,
        })
    }

    removePageFromList = async ({ id, url }: { id: number; url: string }) => {
        await this.options.removeChildAnnotationsFromList(url, id)

        return this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    addOpenTabsToList = async (args: {
        listId: number
        time?: number
        pageTitle?: string
    }) => {
        if (!(await this.fetchListById({ id: args.listId }))) {
            throw new Error('No list found for ID:' + args.listId)
        }
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        // Ensure content scripts are injected into each tab, so they can init page content identifier
        await Promise.all(
            tabs
                .filter((tab) => !isExtensionTab(tab))
                .map(async (tab) => {
                    await this.options.tabManagement.injectContentScriptsIfNeeded(
                        tab.id,
                    )
                }),
        )

        const indexed = await maybeIndexTabs(tabs, {
            createPage: this.options.pages.indexPage,
            waitForContentIdentifier: this.options.pages
                .waitForContentIdentifier,
            time: args.time ?? '$now',
        })

        const existingListEntries = await this.storage.fetchListPageEntriesByUrls(
            {
                listId: args.listId,
                normalizedPageUrls: indexed.map(({ fullUrl }) =>
                    normalizeUrl(fullUrl),
                ),
            },
        )
        const existingEntryUrls = new Set(
            existingListEntries.map((entry) => entry.fullUrl),
        )

        await Promise.all(
            indexed
                .filter(({ fullUrl }) => !existingEntryUrls.has(fullUrl))
                .map(({ fullUrl }) => {
                    this.storage.insertPageToList({
                        listId: args.listId,
                        fullUrl,
                        pageUrl: normalizeUrl(fullUrl),
                        pageTitle: args.pageTitle,
                        analyticsBG: this.options.analyticsBG,
                    })
                }),
        )

        await this.updateListSuggestionsCache({ added: args.listId })
    }

    removeOpenTabsFromList = async ({ listId }: { listId: number }) => {
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        await Promise.all(
            tabs.map((tab) =>
                this.storage.removePageFromList({
                    listId,
                    pageUrl: normalizeUrl(tab.url),
                }),
            ),
        )
    }

    fetchListDescriptions: RemoteCollectionsInterface['fetchListDescriptions'] = async ({
        listIds,
    }) => {
        const descriptions = await this.storage.fetchListDescriptionsByLists(
            listIds,
        )
        return descriptions.reduce(
            (acc, curr) => ({ ...acc, [curr.listId]: curr.description }),
            {},
        )
    }

    updateListDescription: RemoteCollectionsInterface['updateListDescription'] = async ({
        description,
        listId,
    }) => {
        await this.storage.createOrUpdateListDescription({
            description,
            listId,
        })
    }

    updateListForPage: RemoteCollectionsInterface['updateListForPage'] = async ({
        added,
        deleted,
        url,
        tabId,
        skipPageIndexing,
        pageTitle,
    }) => {
        const listId = added ?? deleted

        if (added) {
            await this.insertPageToList({
                id: listId,
                url,
                tabId,
                skipPageIndexing,
                pageTitle,
            })
        }

        if (deleted) {
            await this.removePageFromList({ id: listId, url })
        }
    }
}
