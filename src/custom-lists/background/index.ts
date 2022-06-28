import Storex from '@worldbrain/storex'
import { Windows, Tabs, Storage } from 'webextension-polyfill-ts'
import { normalizeUrl, isFullUrl } from '@worldbrain/memex-url-utils'

import CustomListStorage from './storage'
import internalAnalytics from '../../analytics/internal'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { SearchIndex } from 'src/search'
import type {
    RemoteCollectionsInterface,
    CollectionsSettings,
    PageList,
    PageListEntry,
} from './types'
import { maybeIndexTabs } from 'src/page-indexing/utils'
import { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '@worldbrain/memex-common/lib/utils/suggestions-cache'
import { PageIndexingBackground } from 'src/page-indexing/background'
import TabManagementBackground from 'src/tab-management/background'
import { ServerStorageModules } from 'src/storage/types'
import { Services } from 'src/services/types'
import { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import { GetAnnotationListEntriesElement } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import { isExtensionTab } from 'src/tab-management/utils'
import type { SpaceDisplayEntry } from '../ui/CollectionPicker/logic'

const limitSuggestionsReturnLength = 1000
const limitSuggestionsStorageLength = 25

export default class CustomListBackground {
    storage: CustomListStorage
    remoteFunctions: RemoteCollectionsInterface

    private localStorage: BrowserSettingsStore<CollectionsSettings>

    constructor(
        private options: {
            storageManager: Storex
            searchIndex: SearchIndex
            pages: PageIndexingBackground
            tabManagement: TabManagementBackground
            analytics: Analytics
            queryTabs?: Tabs.Static['query']
            windows?: Windows.Static
            localBrowserStorage: Storage.LocalStorageArea
            services: Pick<Services, 'auth'>
            // TODO: the fact this needs to be passed down tells me this ideally should be done at a higher level (content sharing BG?)
            removeChildAnnotationsFromList: (
                normalizedPageUrl: string,
                listId: number,
            ) => Promise<void>
            getServerStorage: () => Promise<
                Pick<ServerStorageModules, 'activityFollows' | 'contentSharing'>
            >
        },
    ) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage({
            storageManager: options.storageManager,
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
            updateListDescription: async () => {},
            removeList: this.removeList,
            removePageFromList: this.removePageFromList,
            fetchAllLists: this.fetchAllLists,
            fetchAllFollowedLists: this.fetchAllFollowedLists,
            fetchCollaborativeLists: this.fetchCollaborativeLists,
            fetchListById: this.fetchListById,
            fetchListByName: this.fetchListByName,
            fetchFollowedListsWithAnnotations: this
                .fetchFollowedListsWithAnnotations,
            fetchSharedListDataWithOwnership: this
                .fetchSharedListDataWithOwnership,
            fetchListPagesByUrl: this.fetchListPagesByUrl,
            fetchListIdsByUrl: this.fetchListIdsByUrl,
            fetchInitialListSuggestions: this.fetchInitialListSuggestions,
            fetchListPagesById: this.fetchListPagesById,
            fetchPageLists: this.fetchPageLists,
            fetchListIgnoreCase: this.fetchListIgnoreCase,
            searchForListSuggestions: this.searchForListSuggestions,
            addOpenTabsToList: this.addOpenTabsToList,
            removeOpenTabsFromList: this.removeOpenTabsFromList,
            updateListForPage: this.updateListForPage,
            getInboxUnreadCount: this.getInboxUnreadCount,
        }

        this.localStorage = new BrowserSettingsStore(
            options.localBrowserStorage,
            { prefix: 'custom-lists_' },
        )
    }

    generateListId() {
        return Date.now()
    }

    private fetchOwnListReferences = async (): Promise<
        SharedListReference[]
    > => {
        const { auth } = this.options.services
        const { contentSharing } = await this.options.getServerStorage()

        const currentUser = await auth.getCurrentUser()
        if (!currentUser) {
            return []
        }

        return contentSharing.getListReferencesByCreator({
            id: currentUser.id,
            type: 'user-reference',
        })
    }

    private fetchFollowedListReferences = async (): Promise<
        SharedListReference[]
    > => {
        const { auth } = this.options.services
        const { activityFollows } = await this.options.getServerStorage()

        const currentUser = await auth.getCurrentUser()
        if (!currentUser) {
            return []
        }

        const follows = await activityFollows.getAllFollowsByCollection({
            collection: 'sharedList',
            userReference: {
                type: 'user-reference',
                id: currentUser.id,
            },
        })

        return follows.map(
            (follow) =>
                ({
                    id: follow.objectId,
                    type: 'shared-list-reference',
                } as SharedListReference),
        )
    }

    private fetchCollaborativeListReferences = async (): Promise<
        SharedListReference[]
    > => {
        const { auth } = this.options.services
        const { contentSharing } = await this.options.getServerStorage()

        const currentUser = await auth.getCurrentUser()
        if (!currentUser) {
            return []
        }

        const seenLists = new Set()
        const listRoles = await contentSharing.getUserListRoles({
            userReference: {
                type: 'user-reference',
                id: currentUser.id,
            },
        })

        for (const { sharedList } of listRoles) {
            if (seenLists.has(sharedList.id)) {
                continue
            }
            seenLists.add(sharedList.id)
        }

        return [...seenLists].map(
            (id) =>
                ({ id, type: 'shared-list-reference' } as SharedListReference),
        )
    }

    fetchFollowedListsWithAnnotations: RemoteCollectionsInterface['fetchFollowedListsWithAnnotations'] = async ({
        normalizedPageUrl,
    }) => {
        const { contentSharing } = await this.options.getServerStorage()
        const seenListIds = new Set()
        const allListReferences = [
            ...(await this.fetchOwnListReferences()),
            ...(await this.fetchFollowedListReferences()),
            ...(await this.fetchCollaborativeListReferences()),
        ]

        const uniqueListReferences = allListReferences.filter((listRef) => {
            if (seenListIds.has(listRef.id)) {
                return false
            }

            seenListIds.add(listRef.id)
            return true
        })

        const fingerprints = this.options.pages.getContentFingerprints({
            normalizedUrl: normalizedPageUrl,
        })

        const sharedFingerprintsByList = fingerprints?.length
            ? await contentSharing.getNormalizedUrlsByFingerprints({
                  fingerprints,
                  listReferences: uniqueListReferences,
              })
            : {}

        const annotListEntriesByList = new Map<
            string | number,
            GetAnnotationListEntriesElement[]
        >()

        const listEntriesByPageByList = await contentSharing.getAnnotationListEntriesForLists(
            { listReferences: uniqueListReferences },
        )

        for (const listReference of uniqueListReferences) {
            let normalizedUrlInList = normalizedPageUrl
            const sharedFingerprint = sharedFingerprintsByList[listReference.id]
            if (sharedFingerprint) {
                normalizedUrlInList = sharedFingerprint.normalizedUrl
            }

            if (
                !listEntriesByPageByList[listReference.id]?.[
                    normalizedUrlInList
                ]?.length
            ) {
                continue
            }
            annotListEntriesByList.set(
                listReference.id,
                listEntriesByPageByList[listReference.id][normalizedUrlInList],
            )
        }

        const sharedLists = await contentSharing.getListsByReferences(
            [...annotListEntriesByList.keys()].map((id) => ({
                id,
                type: 'shared-list-reference',
            })),
        )

        return sharedLists.map((list) => ({
            id: list.reference.id as string,
            name: list.title,
            sharedAnnotationReferences: annotListEntriesByList
                .get(list.reference.id)
                .map((entry) => entry.sharedAnnotation),
        }))
    }

    private fetchListsFromReferences = async (
        references: SharedListReference[],
    ): Promise<PageList[]> => {
        const { auth } = this.options.services
        const { contentSharing } = await this.options.getServerStorage()

        const sharedLists = await contentSharing.getListsByReferences(
            references,
        )
        const currentUser = await auth.getCurrentUser()!

        return sharedLists
            .sort((a, b) => {
                if (a.title < b.title) {
                    return -1
                }
                if (a.title > b.title) {
                    return 1
                }
                return 0
            })
            .map((sharedList) => ({
                isOwned: sharedList.creator.id === currentUser.id,
                remoteId: sharedList.reference.id as string,
                id: sharedList.createdWhen,
                name: sharedList.title,
                isFollowed: true,
                createdAt: new Date(sharedList.createdWhen),
            }))
    }

    fetchSharedListDataWithOwnership: RemoteCollectionsInterface['fetchSharedListDataWithOwnership'] = async ({
        remoteListId,
    }) => {
        const currentUser = await this.options.services.auth.getCurrentUser()
        if (!currentUser) {
            return null
        }

        const { contentSharing } = await this.options.getServerStorage()
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

    fetchAllFollowedLists: RemoteCollectionsInterface['fetchAllFollowedLists'] = async ({
        skip = 0,
        limit = 20,
    }) => {
        const sharedListReferences = await this.fetchFollowedListReferences()
        return this.fetchListsFromReferences(sharedListReferences)
    }

    fetchCollaborativeLists: RemoteCollectionsInterface['fetchAllFollowedLists'] = async ({
        skip = 0,
        limit = 20,
    }) => {
        const collabListReferences = await this.fetchCollaborativeListReferences()
        return this.fetchListsFromReferences(collabListReferences)
    }

    fetchAllLists = async ({
        skip = 0,
        limit = 2000,
        skipMobileList = false,
    }): Promise<PageList[]> => {
        return this.storage.fetchAllLists({
            skipMobileList,
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
            const id = await this.createCustomList({ name })
            missingEntries.set(name, id)
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

    fetchListIdsByUrl = async ({ url }: { url: string }) => {
        return this.storage.fetchListIdsByUrl(normalizeUrl(url))
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

    createCustomList = async ({
        name,
        id: _id,
        createdAt,
    }: {
        name: string
        id?: number
        createdAt?: Date
    }): Promise<number> => {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.CREATE_COLLECTION,
        })
        const id = _id ?? this.generateListId()
        const inserted = await this.storage.insertCustomList({
            id,
            name,
            createdAt,
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
            skipPageIndexing?: boolean
            suppressVisitCreation?: boolean
            suppressInboxEntry?: boolean
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

        internalAnalytics.processEvent({
            type: EVENT_NAMES.INSERT_PAGE_COLLECTION,
        })

        if (!params.skipPageIndexing) {
            await this.options.pages.indexPage(
                {
                    tabId: params.tabId,
                    fullUrl: url,
                    visitTime: !params.suppressVisitCreation
                        ? '$now'
                        : undefined,
                },
                { addInboxEntryOnCreate: !params.suppressInboxEntry },
            )
        }

        const pageUrl = normalizeUrl(url)
        const existing = await this.storage.fetchListEntry(id, pageUrl)
        if (existing != null) {
            return { object: existing }
        }

        const retVal = await this.storage.insertPageToList({
            pageUrl,
            listId: id,
            fullUrl: url,
        })

        this.options.analytics.trackEvent({
            category: 'Collections',
            action: 'addPageToList',
        })

        await this.updateListSuggestionsCache({ added: id })

        return retVal
    }

    removeList = async ({ id }: { id: number }) => {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.REMOVE_COLLECTION,
        })

        return this.storage.removeList({
            id,
        })
    }

    removePageFromList = async ({ id, url }: { id: number; url: string }) => {
        await internalAnalytics.processEvent({
            type: EVENT_NAMES.REMOVE_PAGE_COLLECTION,
        })

        await this.options.removeChildAnnotationsFromList(url, id)

        return this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    fetchInitialListSuggestions = async (
        { limit }: { limit?: number } = { limit: limitSuggestionsReturnLength },
    ): Promise<SpaceDisplayEntry[]> => {
        const suggestionIds = await this.localStorage.get('suggestionIds')
        const listToDisplayEntry = (l: PageList): SpaceDisplayEntry => ({
            localId: l.id,
            name: l.name,
            createdAt: l.createdAt.getTime(),
            focused: false,
            remoteId: null,
        })

        if (!suggestionIds) {
            const lists = await this.fetchAllLists({
                limit,
                skipMobileList: true,
            })
            await this.localStorage.set(
                'suggestionIds',
                lists.map((l) => l.id),
            )
            return lists.map(listToDisplayEntry)
        }

        const lists = await this.storage.fetchListByIds(suggestionIds)
        return lists.map(listToDisplayEntry)
    }

    fetchListIgnoreCase = async ({ name }: { name: string }) => {
        return this.storage.fetchListIgnoreCase({
            name,
        })
    }

    searchForListSuggestions = async (args: {
        query: string
        limit?: number
    }): Promise<Array<Omit<PageList, 'createdAt'> & { createdAt: number }>> => {
        const suggestions = await this.storage.suggestLists(args)

        return suggestions.map((s) => ({
            ...s,
            createdAt: s.createdAt.getTime(),
        }))
    }

    addOpenTabsToList = async (args: { listId: number; time?: number }) => {
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

    updateListForPage: RemoteCollectionsInterface['updateListForPage'] = async ({
        added,
        deleted,
        url,
        tabId,
        skipPageIndexing,
    }) => {
        const listId = added ?? deleted

        if (added) {
            await this.insertPageToList({
                id: listId,
                url,
                tabId,
                skipPageIndexing,
            })
        }

        if (deleted) {
            await this.removePageFromList({ id: listId, url })
        }
    }
}
