import Storex from '@worldbrain/storex'
import { Windows, Tabs, Storage } from 'webextension-polyfill-ts'
import { normalizeUrl, isFullUrl } from '@worldbrain/memex-url-utils'

import CustomListStorage from './storage'
import internalAnalytics from '../../analytics/internal'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { SearchIndex } from 'src/search'
import {
    RemoteCollectionsInterface,
    CollectionsSettings,
    PageList,
    PageListEntry,
    CollectionsCacheInterface,
} from './types'
import { maybeIndexTabs } from 'src/page-indexing/utils'
import { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from 'src/tags/utils'
import { PageIndexingBackground } from 'src/page-indexing/background'
import TabManagementBackground from 'src/tab-management/background'

const limitSuggestionsReturnLength = 10
const limitSuggestionsStorageLength = 20

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
            fetchListById: this.fetchListById,
            fetchListPagesByUrl: this.fetchListPagesByUrl,
            fetchListIdsByUrl: this.fetchListIdsByUrl,
            fetchInitialListSuggestions: this.fetchInitialListSuggestions,
            fetchCollaborativeListNames: this.fetchInitialListSuggestions, // TODO: Implement
            fetchListPagesById: this.fetchListPagesById,
            fetchPageLists: this.fetchPageLists,
            fetchListIgnoreCase: this.fetchListIgnoreCase,
            searchForListSuggestions: this.searchForListSuggestions,
            addOpenTabsToList: this.addOpenTabsToList,
            removeOpenTabsFromList: this.removeOpenTabsFromList,
            updateListForPage: this.updateListForPage,
            getInboxUnreadCount: this.getInboxUnreadCount,
        }

        this.localStorage = new BrowserSettingsStore<CollectionsSettings>(
            options.localBrowserStorage,
            { prefix: 'custom-lists_' },
        )
    }

    generateListId() {
        return Date.now()
    }

    fetchAllLists = async ({
        skip = 0,
        limit = 20,
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

        const missingEntries = await Promise.all(
            missing.map(async (name) => {
                let id: number
                try {
                    id = await this.createCustomList({ name })
                } catch (err) {
                    const list = await this.fetchListByName({ name })
                    id = list.id
                }
                return [name, id] as [string, number]
            }),
        )

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

    fetchPageLists = async ({ url }: { url: string }): Promise<string[]> => {
        const lists = await this.fetchListPagesByUrl({ url })

        return lists.map(({ name }) => name)
    }

    _updateListSuggestionsCache = async (args: {
        added?: string
        removed?: string
        updated?: [string, string]
    }) => {
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

    createCustomList = async ({ name }: { name: string }): Promise<number> => {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.CREATE_COLLECTION,
        })

        const inserted = await this.storage.insertCustomList({
            id: this.generateListId(),
            name,
        })

        await this._updateListSuggestionsCache({ added: name })

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
        await this._updateListSuggestionsCache({ updated: [oldName, newName] })

        return this.storage.updateListName({
            id,
            name: newName,
        })
    }

    insertPageToList = async ({
        id,
        url,
        tabId,
        skipPageIndexing,
        suppressVisitCreation,
    }: {
        id: number
        url: string
        tabId?: number
        skipPageIndexing?: boolean
        suppressVisitCreation?: boolean
    }): Promise<{ object: PageListEntry }> => {
        if (!isFullUrl(url)) {
            throw new Error(
                'Tried to insert page to list with a normalized, instead of a full URL',
            )
        }

        internalAnalytics.processEvent({
            type: EVENT_NAMES.INSERT_PAGE_COLLECTION,
        })

        if (!skipPageIndexing) {
            await this.options.pages.indexPage(
                {
                    tabId,
                    fullUrl: url,
                    visitTime: !suppressVisitCreation ? '$now' : undefined,
                },
                { addInboxEntryOnCreate: true },
            )
        }

        const retVal = await this.storage.insertPageToList({
            listId: id,
            pageUrl: normalizeUrl(url),
            fullUrl: url,
        })

        this.options.analytics.trackEvent({
            category: 'Collections',
            action: 'addPageToList',
        })

        const list = await this.fetchListById({ id })
        await this._updateListSuggestionsCache({ added: list.name })

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
        internalAnalytics.processEvent({
            type: EVENT_NAMES.REMOVE_PAGE_COLLECTION,
        })

        return this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    fetchInitialListSuggestions = async (
        { limit }: { limit?: number } = { limit: limitSuggestionsReturnLength },
    ) => {
        let suggestions = await this.localStorage.get('suggestions')

        if (!suggestions) {
            const lists = await this.fetchAllLists({
                limit,
                skipMobileList: true,
            })
            suggestions = lists.map((l) => l.name)

            console['info'](
                'No cached list suggestions found so loaded suggestions from DB:',
                suggestions,
            )
            await this.localStorage.set('suggestions', suggestions)
        }

        return suggestions.slice(0, limit)
    }

    fetchListIgnoreCase = async ({ name }: { name: string }) => {
        return this.storage.fetchListIgnoreCase({
            name,
        })
    }

    searchForListSuggestions = async (args: {
        query: string
        limit?: number
    }): Promise<string[]> => {
        const suggestions = await this.storage.suggestLists(args)

        return suggestions.map(({ name }) => name)
    }

    addOpenTabsToList = async (args: {
        name: string
        listId?: number
        time?: number
    }) => {
        if (!args.listId) {
            const list = await this.fetchListByName({ name: args.name })

            if (!list) {
                throw new Error('No list found for name:' + args.name)
            }

            args.listId = list.id
        }

        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        const indexed = await maybeIndexTabs(tabs, {
            createPage: this.options.pages.indexPage,
            time: args.time ?? '$now',
        })

        await Promise.all(
            indexed.map(({ fullUrl }) => {
                this.storage.insertPageToList({
                    listId: args.listId,
                    fullUrl,
                    pageUrl: normalizeUrl(fullUrl),
                })
            }),
        )

        await this._updateListSuggestionsCache({ added: args.name })
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

    // Sugar for the List picking UI component
    updateListForPage = async ({
        added,
        deleted,
        url,
        tabId,
        skipPageIndexing,
    }: {
        added?: string
        deleted?: string
        url: string
        tabId?: number
        skipPageIndexing?: boolean
    }) => {
        const name = added ?? deleted
        let list = await this.fetchListByName({ name })

        if (!list) {
            list = { id: await this.createCustomList({ name }) }
        }

        if (added) {
            await this.insertPageToList({
                id: list.id,
                url,
                tabId,
                skipPageIndexing,
            })
        }

        if (deleted) {
            await this.removePageFromList({ id: list.id, url })
        }
    }
}
