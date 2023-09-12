import type Storex from '@worldbrain/storex'
import fromPairs from 'lodash/fromPairs'
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
import { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '@worldbrain/memex-common/lib/utils/suggestions-cache'
import type { PageIndexingBackground } from 'src/page-indexing/background'
import type TabManagementBackground from 'src/tab-management/background'
import type { ServerStorageModules } from 'src/storage/types'
import type { AuthServices } from 'src/services/types'
import type { SharedListReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { GetAnnotationListEntriesElement } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import { isExtensionTab } from 'src/tab-management/utils'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { PersonalList } from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import ContentSharingBackground from 'src/content-sharing/background'

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
            removeList: this.removeList,
            removePageFromList: this.removePageFromList,
            fetchAllLists: this.fetchAllLists,
            fetchAllFollowedLists: this.fetchAllFollowedLists,
            fetchCollaborativeLists: this.fetchCollaborativeLists,
            fetchListById: this.fetchListById,
            fetchListByName: this.fetchListByName,
            fetchAnnotationRefsForRemoteListsOnPage: this
                .fetchAnnotationRefsForRemoteListsOnPage,
            fetchFollowedListsWithAnnotations: this
                .fetchFollowedListsWithAnnotations,
            fetchSharedListDataWithPageAnnotations: this
                .fetchSharedListDataWithPageAnnotations,
            fetchSharedListDataWithOwnership: this
                .fetchSharedListDataWithOwnership,
            fetchListPagesByUrl: this.fetchListPagesByUrl,
            fetchPageListEntriesByUrl: this.fetchPageListEntriesByUrl,
            fetchListIdsByUrl: this.fetchListIdsByUrl,
            fetchInitialListSuggestions: this.fetchInitialListSuggestions,
            fetchListPagesById: this.fetchListPagesById,
            fetchPageLists: this.fetchPageLists,
            fetchListIgnoreCase: this.fetchListIgnoreCase,
            searchForListSuggestions: this.searchForListSuggestions,
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

    private fetchOwnListReferences = async (): Promise<
        SharedListReference[]
    > => {
        const { auth } = this.options.authServices
        const { contentSharing } = this.options.serverStorage

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
        const { auth } = this.options.authServices
        const { activityFollows } = this.options.serverStorage

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
        const { auth } = this.options.authServices
        const { contentSharing } = this.options.serverStorage

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

    fetchAnnotationRefsForRemoteListsOnPage: RemoteCollectionsInterface['fetchAnnotationRefsForRemoteListsOnPage'] = async ({
        sharedListIds,
        normalizedPageUrl,
    }) => {
        const { contentSharing } = this.options.serverStorage

        const listEntriesByPageByList = await contentSharing.getAnnotationListEntriesForListsOnPage(
            {
                listReferences: sharedListIds.map((id) => ({
                    type: 'shared-list-reference',
                    id,
                })),
                normalizedPageUrl,
            },
        )

        return fromPairs(
            Object.entries(listEntriesByPageByList).map(([listId, entries]) => [
                listId,
                entries.map((entry) => entry.sharedAnnotation),
            ]),
        )
    }

    fetchFollowedListsWithAnnotations: RemoteCollectionsInterface['fetchFollowedListsWithAnnotations'] = async ({
        normalizedPageUrl,
    }) => {
        const { contentSharing } = this.options.serverStorage
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

        const fingerprints = await this.options.pages.getContentFingerprints({
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
            creatorReference: list.creator,
            sharedAnnotationReferences: annotListEntriesByList
                .get(list.reference.id)
                .map((entry) => entry.sharedAnnotation),
        }))
    }

    private fetchListsFromReferences = async (
        references: SharedListReference[],
    ): Promise<PageList[]> => {
        const { auth } = this.options.authServices
        const { contentSharing } = this.options.serverStorage

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
                description: sharedList.description,
                id: sharedList.createdWhen,
                name: sharedList.title,
                isFollowed: true,
                createdAt: new Date(sharedList.createdWhen),
            }))
    }

    fetchLocalDataForRemoteListEntryFromServer: RemoteCollectionsInterface['fetchLocalDataForRemoteListEntryFromServer'] = async ({
        normalizedPageUrl,
        remoteListId,
        opts,
    }) => {
        const user = await this.options.authServices.auth.getCurrentUser()
        if (!user) {
            throw new Error(
                'Cannot get user data from server when unauthorized',
            )
        }

        const { contentSharing } = this.options.serverStorage
        const listReference: SharedListReference = {
            type: 'shared-list-reference',
            id: remoteListId,
        }

        const [
            personalList,
            sharedListEntry,
            annotationListEntries,
        ] = await Promise.all([
            opts.needLocalListd
                ? contentSharing.getUserPersonalListBySharedListRef({
                      listReference,
                      userReference: {
                          type: 'user-reference',
                          id: user.id,
                      },
                  })
                : Promise.resolve(),
            contentSharing.getListEntryByListAndUrl({
                listReference,
                normalizedPageUrl,
            }),
            opts.needAnnotsFlag
                ? contentSharing.getAnnotationListEntriesForListsOnPage({
                      listReferences: [listReference],
                      normalizedPageUrl,
                  })
                : Promise.resolve(),
        ])

        if (
            (opts.needLocalListd &&
                (personalList as PersonalList)?.localId == null) ||
            (opts.needAnnotsFlag &&
                !annotationListEntries[remoteListId]?.length) ||
            !sharedListEntry
        ) {
            return null
        }

        return {
            sharedListEntryId: sharedListEntry.reference.id.toString(),
            localListId: opts.needLocalListd
                ? (personalList as PersonalList).localId
                : undefined,
            hasAnnotationsFromOthers: opts.needAnnotsFlag
                ? annotationListEntries[remoteListId].some(
                      (entry) => entry.creator.id !== user.id,
                  )
                : undefined,
        }
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

    fetchAllFollowedLists: RemoteCollectionsInterface['fetchAllFollowedLists'] = async ({
        skip = 0,
        limit = 20,
    }) => {
        const sharedListReferences = await this.fetchFollowedListReferences()
        return this.fetchListsFromReferences(sharedListReferences)
    }

    fetchCollaborativeLists: RemoteCollectionsInterface['fetchCollaborativeLists'] = async ({
        skip = 0,
        limit = 20,
    }) => {
        const collabListReferences = await this.fetchCollaborativeListReferences()
        return this.fetchListsFromReferences(collabListReferences)
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

    fetchInitialListSuggestions: RemoteCollectionsInterface['fetchInitialListSuggestions'] = async ({
        extraListIds,
    } = {}): Promise<Pick<UnifiedList, 'localId' | 'name' | 'remoteId'>[]> => {
        const suggestionIds = await this.localStorage.get('suggestionIds')
        const listToDisplayEntry = (
            l: PageList,
        ): Pick<UnifiedList, 'localId' | 'name' | 'remoteId'> => ({
            localId: l.id,
            name: l.name,
            remoteId: null,
        })

        if (suggestionIds) {
            const lists = await this.storage.fetchListByIds([
                ...suggestionIds,
                ...(extraListIds ?? []),
            ])
            return lists.map(listToDisplayEntry)
        }

        const lists = await this.fetchAllLists({
            limit: limitSuggestionsStorageLength - (extraListIds?.length ?? 0),
            skipSpecialLists: true,
        })

        if (extraListIds?.length) {
            const extraLists = await this.storage.fetchListByIds(extraListIds)
            lists.push(...extraLists)
        }

        await this.localStorage.set(
            'suggestionIds',
            lists.map((l) => l.id),
        )
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
