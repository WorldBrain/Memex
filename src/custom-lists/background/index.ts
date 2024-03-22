import type Storex from '@worldbrain/storex'
import type { Browser } from 'webextension-polyfill'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { isFullUrl } from '@worldbrain/memex-common/lib/url-utils/normalize/utils'
import CustomListStorage from './storage'
import type { SearchIndex } from 'src/search'
import type {
    RemoteCollectionsInterface,
    CollectionsSettings,
    PageListEntry,
} from './types'
import { maybeIndexTabs } from 'src/page-indexing/utils'
import type { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '@worldbrain/memex-common/lib/utils/suggestions-cache'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import type TabManagementBackground from 'src/tab-management/background'
import type { AuthServices } from 'src/services/types'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type ContentSharingBackground from 'src/content-sharing/background'
import type { PKMSyncBackgroundModule } from 'src/pkm-integrations/background'
import type { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import { extractMaterializedPathIds } from 'src/content-sharing/utils'
import { LIST_TREE_OPERATION_ALIASES } from '@worldbrain/memex-common/lib/content-sharing/storage/list-tree-middleware'
import {
    DEFAULT_KEY,
    defaultOrderableSorter,
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import { MemexLocalBackend } from 'src/pkm-integrations/background/backend'
import { LOCAL_SERVER_ROOT } from 'src/backup-restore/ui/backup-pane/constants'

const limitSuggestionsStorageLength = 25

export default class CustomListBackground {
    storage: CustomListStorage
    remoteFunctions: RemoteCollectionsInterface
    serverToTalkTo = LOCAL_SERVER_ROOT

    private localStorage: BrowserSettingsStore<CollectionsSettings>

    constructor(
        private options: {
            storageManager: Storex
            searchIndex: SearchIndex
            analyticsBG: AnalyticsCoreInterface
            contentSharingBackend: ContentSharingBackendInterface
            contentSharing: ContentSharingBackground
            pages: PageIndexingBackground
            tabManagement: TabManagementBackground
            analytics: Analytics
            browserAPIs: Pick<Browser, 'tabs' | 'storage' | 'windows'>
            authServices: Pick<AuthServices, 'auth'>
            // TODO: the fact this needs to be passed down tells me this ideally should be done at a higher level (content sharing BG?)
            removeChildAnnotationsFromList: (
                normalizedPageUrl: string,
                listId: number,
            ) => Promise<void>
            pkmSyncBG: PKMSyncBackgroundModule
        },
    ) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage({
            storageManager: options.storageManager,
            pkmSyncBG: options.pkmSyncBG,
            ___storageAPI: options.browserAPIs.storage,
        })

        this.remoteFunctions = {
            createCustomList: this.createCustomList,
            deleteListTree: this.deleteListTree,
            updateListTreeParent: this.updateListTreeParent,
            updateListTreeOrder: this.updateListTreeOrder,
            insertPageToList: async (params) => {
                if (!params.indexUrl) {
                    const currentTab = await options.browserAPIs.tabs.query({
                        active: true,
                        currentWindow: true,
                    })
                    params.tabId = currentTab?.[0]?.id
                }
                return this.insertPageToList(params)
            },
            updateListName: this.updateList,
            findPageByUrl: this.findPageByUrl,
            removePageFromList: this.removePageFromList,
            removeAllListPages: this.removeAllListPages,
            fetchAllLists: this.fetchAllLists,
            fetchListById: this.fetchListById,
            findSimilarBackground: this.findSimilarBackground,
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
            createTabGroup: this.createTabGroup,
            fetchLocalDataForRemoteListEntryFromServer: this
                .fetchLocalDataForRemoteListEntryFromServer,
        }

        this.localStorage = new BrowserSettingsStore(
            options.browserAPIs.storage.local,
            {
                prefix: 'custom-lists_',
            },
        )
    }

    generateListId() {
        return Date.now()
    }

    fetchAnnotationRefsForRemoteListsOnPage: RemoteCollectionsInterface['fetchAnnotationRefsForRemoteListsOnPage'] = async ({
        sharedListIds,
        normalizedPageUrl,
    }) => {
        const response = await this.options.contentSharingBackend.loadPageAnnotationRefsForLists(
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
        const response = await this.options.contentSharingBackend.loadLocalDataForListEntry(
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
        const response = await this.options.contentSharingBackend.loadCollectionDetails(
            {
                listId: remoteListId,
                normalizedPageUrl,
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
        return {
            ...response.data.retrievedList.sharedList,
            sharedAnnotations: Object.values(response.data.annotations ?? {}),
            order: response.data.retrievedList.sharedListTree?.order ?? 1,
        }
    }

    fetchSharedListDataWithOwnership: RemoteCollectionsInterface['fetchSharedListDataWithOwnership'] = async ({
        remoteListId,
    }) => {
        const currentUser = await this.options.authServices.auth.getCurrentUser()
        if (!currentUser) {
            return null
        }

        const response = await this.options.contentSharingBackend.loadCollectionDetails(
            {
                listId: remoteListId,
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
        const sharedList = response.data.retrievedList.sharedList

        return {
            name: sharedList.title,
            id: sharedList.createdWhen,
            order: response.data.retrievedList.sharedListTree?.order ?? 1,
            remoteId: sharedList.reference.id.toString(),
            createdAt: new Date(sharedList.createdWhen),
            isOwned: sharedList.creator.id === currentUser.id,
            parentListId: null,
            pathListIds: [],
        }
    }

    fetchAllLists: RemoteCollectionsInterface['fetchAllLists'] = async ({
        skip = 0,
        limit = 2000,
        skipSpecialLists = false,
        includeTreeData,
        includeDescriptions,
    }) => {
        const lists = await this.storage.fetchAllLists({
            includeDescriptions,
            skipSpecialLists,
            limit,
            skip,
        })

        const treeDataByList = includeTreeData
            ? await this.storage.getTreeDataForLists({
                  localListIds: lists.map((list) => list.id),
              })
            : {}

        return lists.map((list, i) => ({
            ...list,
            order: treeDataByList[list.id]?.order ?? DEFAULT_KEY + i * 10,
            parentListId: treeDataByList[list.id]?.parentListId ?? null,
            pathListIds: extractMaterializedPathIds(
                treeDataByList[list.id]?.path ?? '',
                'number',
            ) as number[],
        }))
    }

    fetchListById = async ({ id }: { id: number }) => {
        return this.storage.fetchListWithPagesById(id)
    }

    findSimilarBackground = async (
        currentPageContent?: string,
        fullUrl?: string,
    ) => {
        const backend = new MemexLocalBackend({
            url: this.serverToTalkTo,
            storageAPI: this.options.browserAPIs.storage,
        })
        const results = await backend.findSimilar(currentPageContent, fullUrl)

        return results
    }
    findPageByUrl = async (normalizedUrl: string) => {
        const pageData = await this.storage.findPageByUrl(normalizedUrl)

        return pageData
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
    createTabGroup = async (id: number) => {
        const listId = id

        if (listId == null) {
            return false
        }
        const spaceData = await this.fetchListById({ id: listId })
        const spaceEntries = spaceData.pages

        const newWindow = await this.options.browserAPIs.windows.create()
        for (const url of spaceEntries) {
            await this.options.browserAPIs.tabs.create({
                windowId: newWindow.id,
                url,
            })
        }
    }

    createCustomList: RemoteCollectionsInterface['createCustomList'] = async ({
        name,
        id: _id,
        type,
        order,
        createdAt,
        dontTrack,
        parentListId,
        ...preGeneratedIds
    }) => {
        const id = _id ?? this.generateListId()
        const localListId = await this.storage.insertCustomList({
            id,
            type,
            name,
            createdAt,
            analyticsBG: this.options.analyticsBG,
            dontTrack,
        })
        await this.updateListSuggestionsCache({ added: id })
        const listShareResult = await this.options.contentSharing.scheduleListShare(
            {
                localListId,
                isPrivate: type !== 'page-link',
                ...preGeneratedIds,
            },
        )
        await this.createListTree({
            order,
            localListId,
            parentListId,
            now: createdAt?.getTime(),
        })

        return { ...listShareResult, localListId }
    }

    createListTree = async (args: {
        localListId: number
        parentListId?: number
        order?: number
        now?: number
    }): Promise<{ treeId: number }> => {
        const pathIds =
            args.parentListId != null
                ? await this.storage.getMaterializedPathIdsFromTree({
                      id: args.parentListId,
                  })
                : []
        const { id: treeId } = await this.storage.createListTree({
            localListId: args.localListId,
            parentListId: args.parentListId,
            order: args.order,
            now: args.now,
            pathIds,
        })
        return { treeId }
    }

    updateListTreeOrder: RemoteCollectionsInterface['updateListTreeOrder'] = async ({
        localListId,
        siblingListIds,
        intendedIndexAmongSiblings,
        now,
    }) => {
        const siblingListTrees = await this.storage.getTreeDataForLists({
            localListIds: siblingListIds,
        })
        const orderedSiblingItems = Object.values(siblingListTrees)
            .sort(defaultOrderableSorter)
            .map((tree) => ({
                id: tree.id,
                key: tree.order,
            }))

        const changes =
            intendedIndexAmongSiblings === siblingListIds.length
                ? pushOrderedItem(orderedSiblingItems, localListId)
                : insertOrderedItemBeforeIndex(
                      orderedSiblingItems,
                      localListId,
                      intendedIndexAmongSiblings,
                  )

        await this.storage.updateListTreeOrder({
            order: changes.create.key,
            localListId,
            now,
        })
    }

    updateListTreeParent: RemoteCollectionsInterface['updateListTreeParent'] = async ({
        localListId,
        parentListId,
        now,
    }) => {
        if (
            parentListId != null &&
            (await this.storage.isListAAncestorOfListB(
                localListId,
                parentListId,
            ))
        ) {
            throw new Error(
                'Cannot make list a child of a descendent - this would result in a cycle',
            )
        }

        // This will get caught by the ListTreeMiddleware
        await this.options.storageManager.operation(
            LIST_TREE_OPERATION_ALIASES.moveTree,
            CustomListStorage.LIST_TREES_COLL,
            {
                localListId,
                newParentListId: parentListId,
                now,
            },
        )
    }

    deleteListTree: RemoteCollectionsInterface['deleteListTree'] = async ({
        treeId,
    }) => {
        await this.storage.deleteListTree({ treeId })
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

    removePageFromList = async ({ id, url }: { id: number; url: string }) => {
        await this.options.removeChildAnnotationsFromList(url, id)

        return this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }
    removeAllListPages = async (listId: number) => {
        return this.storage.removeAllListPages({
            listId: listId,
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
            tabs.map((tab) =>
                this.options.tabManagement.injectContentScriptsIfNeeded(tab.id),
            ),
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
