import Storex from '@worldbrain/storex'
import { Windows, Tabs, browser } from 'webextension-polyfill-ts'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import CustomListStorage from './storage'
import internalAnalytics from '../../analytics/internal'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { SearchIndex } from 'src/search'
import { Tab, CustomListsInterface } from './types'
import PageStorage from 'src/page-indexing/background/storage'
import { pageIsStub, maybeIndexTabs } from 'src/page-indexing/utils'
import { bindMethod } from 'src/util/functions'
import { getOpenTabsInCurrentWindow } from 'src/activity-logger/background/util'

export default class CustomListBackground {
    storage: CustomListStorage
    _createPage: SearchIndex['createPageViaBmTagActs'] // public so tests can override as a hack
    public remoteFunctions: CustomListsInterface

    constructor(
        private options: {
            storageManager: Storex
            searchIndex: SearchIndex
            pageStorage: PageStorage
            queryTabs?: Tabs.Static['query']
            windows?: Windows.Static
            createPage?: SearchIndex['createPageViaBmTagActs']
        },
    ) {
        // Makes the custom list Table in indexed DB.
        this.storage = new CustomListStorage({
            storageManager: options.storageManager,
        })
        this._createPage =
            options.createPage || options.searchIndex.createPageViaBmTagActs

        this.remoteFunctions = {
            createCustomList: bindMethod(this, 'createCustomList'),
            insertPageToList: bindMethod(this, 'insertPageToList'),
            updateListName: bindMethod(this, 'updateList'),
            removeList: bindMethod(this, 'removeList'),
            removePageFromList: bindMethod(this, 'removePageFromList'),
            fetchAllLists: bindMethod(this, 'fetchAllLists'),
            fetchListById: bindMethod(this, 'fetchListById'),
            fetchListPagesByUrl: bindMethod(this, 'fetchListPagesByUrl'),
            fetchListNameSuggestions: bindMethod(
                this,
                'fetchListNameSuggestions',
            ),
            fetchListPagesById: bindMethod(this, 'fetchListPagesById'),
            fetchListIgnoreCase: bindMethod(this, 'fetchListIgnoreCase'),
            addOpenTabsToList: bindMethod(this, 'addOpenTabsToList'),
            removeOpenTabsFromList: bindMethod(this, 'removeOpenTabsFromList'),
        }
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    generateListId() {
        return Date.now()
    }

    async fetchAllLists({
        excludeIds = [],
        skip = 0,
        limit = 20,
        skipMobileList = false,
    }) {
        return this.storage.fetchAllLists({
            excludedIds: excludeIds,
            skipMobileList,
            limit,
            skip,
        })
    }

    async fetchListById({ id }: { id: number }) {
        return this.storage.fetchListById(id)
    }

    async fetchListByName({ name }: { name: string }) {
        return this.storage.fetchListIgnoreCase({ name })
    }

    async createCustomLists({ names }: { names: string[] }) {
        const existingLists = new Map<string, number>()

        for (const name of names) {
            const list = await this.fetchListByName({ name })

            if (list) {
                existingLists.set(list.name, list.id)
            }
        }

        const missing = names.filter(name => !existingLists.has(name))

        const missingEntries = await Promise.all(
            missing.map(async name => {
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

        return names.map(name => listIds.get(name))
    }

    async fetchListPagesById({ id }: { id: number }) {
        return this.storage.fetchListPagesById({
            listId: id,
        })
    }

    async fetchListPagesByUrl({ url }: { url: string }) {
        return this.storage.fetchListPagesByUrl({
            url: normalizeUrl(url),
        })
    }

    async createCustomList({ name }: { name: string }): Promise<number> {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.CREATE_COLLECTION,
        })

        return this.storage.insertCustomList({
            id: this.generateListId(),
            name,
        })
    }

    async updateList({ id, name }: { id: number; name: string }) {
        return this.storage.updateListName({
            id,
            name,
        })
    }

    private async createPageIfNeeded({ url }: { url: string }) {
        const exists = await this.options.pageStorage.pageExists(url)
        if (!exists) {
            await this._createPage({ url, visitTime: Date.now(), save: true })
        }
    }

    async insertPageToList({ id, url }: { id: number; url: string }) {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.INSERT_PAGE_COLLECTION,
        })

        await this.createPageIfNeeded({ url })

        return this.storage.insertPageToList({
            listId: id,
            pageUrl: normalizeUrl(url),
            fullUrl: url,
        })
    }

    async removeList({ id }: { id: number }) {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.REMOVE_COLLECTION,
        })

        return this.storage.removeList({
            id,
        })
    }

    async removePageFromList({ id, url }: { id: number; url: string }) {
        internalAnalytics.processEvent({
            type: EVENT_NAMES.REMOVE_PAGE_COLLECTION,
        })

        return this.storage.removePageFromList({
            listId: id,
            pageUrl: normalizeUrl(url),
        })
    }

    async fetchListNameSuggestions({
        name,
        url,
    }: {
        name: string
        url: string
    }) {
        return this.storage.fetchListNameSuggestions({
            name,
            url: normalizeUrl(url),
        })
    }

    async fetchListIgnoreCase({ name }: { name: string }) {
        return this.storage.fetchListIgnoreCase({
            name,
        })
    }

    async addOpenTabsToList({
        listId,
        tabs,
    }: {
        listId: number
        tabs?: Array<{ tabId: number; url: string }>
    }) {
        if (!tabs) {
            tabs = await getOpenTabsInCurrentWindow(
                this.options.windows,
                this.options.queryTabs,
            )
        }

        const time = Date.now()

        const indexed = await maybeIndexTabs(tabs, {
            pageStorage: this.options.pageStorage,
            createPage: this._createPage,
            time,
        })

        await Promise.all(
            indexed.map(({ fullUrl }) => {
                this.storage.insertPageToList({
                    listId,
                    fullUrl,
                    pageUrl: normalizeUrl(fullUrl),
                })
            }),
        )
    }

    async removeOpenTabsFromList({
        listId,
        tabs,
    }: {
        listId: number
        tabs?: Array<{ tabId: number; url: string }>
    }) {
        if (!tabs) {
            tabs = await getOpenTabsInCurrentWindow(
                this.options.windows,
                this.options.queryTabs,
            )
        }

        await Promise.all(
            tabs.map(tab =>
                this.storage.removePageFromList({
                    listId,
                    pageUrl: normalizeUrl(tab.url),
                }),
            ),
        )
    }
}
