import Storex from '@worldbrain/storex'
import { Windows, Tabs, Storage } from 'webextension-polyfill-ts'

import TagStorage from './storage'
import { SearchIndex } from 'src/search'
import { pageIsStub, maybeIndexTabs } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import { TagTab, RemoteTagsInterface, TagsSettings } from './types'
import { bindMethod } from 'src/util/functions'
import { initErrHandler } from 'src/search/storage'
import SearchBackground from 'src/search/background'
import { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '../utils'
import { STORAGE_KEYS as IDXING_PREF_KEYS } from 'src/options/settings/constants'
import { PageIndexingBackground } from 'src/page-indexing/background'
import TabManagementBackground from 'src/tab-management/background'

export const limitSuggestionsReturnLength = 20
export const limitSuggestionsStorageLength = 40

export default class TagsBackground {
    storage: TagStorage
    remoteFunctions: RemoteTagsInterface

    private windows: Windows.Static
    private localStorage: BrowserSettingsStore<TagsSettings>

    constructor(
        private options: {
            storageManager: Storex
            pages: PageIndexingBackground
            analytics: Analytics
            tabManagement: TabManagementBackground
            queryTabs?: Tabs.Static['query']
            windows?: Windows.Static
            searchBackgroundModule: SearchBackground
            localBrowserStorage: Storage.LocalStorageArea
        },
    ) {
        this.storage = new TagStorage({
            storageManager: options.storageManager,
        })
        this.remoteFunctions = {
            addTagToExistingUrl: bindMethod(this, 'addTagToExistingUrl'),
            delTag: bindMethod(this, 'delTag'),
            addTagToPage: bindMethod(this, 'addTagToPage'),
            updateTagForPage: bindMethod(this, 'updateTagForPage'),
            setTagsForAnnotation: bindMethod(this, 'setTagsForAnnotation'),
            fetchPageTags: bindMethod(this, 'fetchPageTags'),
            addTagsToOpenTabs: bindMethod(this, 'addTagsToOpenTabs'),
            delTagsFromOpenTabs: bindMethod(this, 'delTagsFromOpenTabs'),
            searchForTagSuggestions: bindMethod(
                this,
                'searchForTagSuggestions',
            ),
            fetchInitialTagSuggestions: bindMethod(
                this,
                'fetchInitialTagSuggestions',
            ),
        }
        this.windows = options.windows
        this.localStorage = new BrowserSettingsStore<TagsSettings>(
            options.localBrowserStorage,
            { prefix: 'tags_' },
        )
    }

    async searchForTagSuggestions(args: { query: string; limit?: number }) {
        return this.options.searchBackgroundModule.storage.suggest({
            type: 'tag',
            ...args,
        })
    }

    async fetchInitialTagSuggestions(
        { limit }: { limit?: number } = { limit: limitSuggestionsReturnLength },
    ) {
        let suggestions = await this.localStorage.get('suggestions')

        if (!suggestions) {
            // Populate first time suggestions for old users installing this version
            suggestions =
                (await this.options.searchBackgroundModule.storage.suggestExtended(
                    { type: 'tag' },
                )) ?? []
            console['info'](
                'No cached tag suggestions found so loaded suggestions from DB:',
                suggestions,
            )
            await this.localStorage.set('suggestions', suggestions)
        }

        return suggestions.slice(0, limit)
    }

    async addTagsToOpenTabs(params: { name: string; time?: number }) {
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        const indexed = await maybeIndexTabs(tabs, {
            pageStorage: this.options.pages.storage,
            createPage: this.options.pages.createPageFromTab,
            time: params.time || Date.now(),
        })

        await this.storage.addTags({
            name: params.name,
            urls: indexed.map((tab) => tab.fullUrl),
        })

        this._updateTagSuggestionsCache({ added: params.name })
    }

    async delTagsFromOpenTabs({ name }: { name: string }) {
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        return this.storage.delTags({
            name,
            urls: tabs.map((tab) => tab.url),
        })
    }

    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url })
    }

    async fetchAnnotationTags({ url }: { url: string }) {
        return this.storage.fetchAnnotationTags({ url })
    }

    async addTagToExistingUrl({ tag, url }: { tag: string; url: string }) {
        this.options.analytics.trackEvent({
            category: 'Tags',
            action: 'createForPageViaOverview',
        })
        await this._updateTagSuggestionsCache({ added: tag })
        return this.storage.addTag({ name: tag, url })
    }

    async addTagsToExistingAnnotationUrl({
        tags,
        url,
    }: {
        tags: string[]
        url: string
    }) {
        for (const tag of tags) {
            await this._updateTagSuggestionsCache({ added: tag })
            await this.storage.addAnnotationTag({ name: tag, url })
        }
    }

    async addTagsToExistingUrl({ tags, url }: { tags: string[]; url: string }) {
        for (const tag of tags) {
            await this._updateTagSuggestionsCache({ added: tag })
            await this.storage.addTag({ name: tag, url })
        }
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

    async delTag({ tag, url }: { tag: string; url: string }) {
        return this.storage.delTag({ name: tag, url })
    }

    // Makes sure the page exists first, creating it if it doesn't, before tagging.
    async addTagToPage({
        url,
        tag,
        tabId,
    }: {
        url: string
        tag: string
        tabId?: number
    }) {
        let page = await this.options.pages.storage.getPage(url)

        const {
            [IDXING_PREF_KEYS.BOOKMARKS]: shouldFullyIndex,
        } = await this.options.localBrowserStorage.get(
            IDXING_PREF_KEYS.BOOKMARKS,
        )

        if (page == null || (shouldFullyIndex && pageIsStub(page))) {
            page = await this.options.pages.createPageViaBmTagActs({
                fullUrl: url,
                tabId,
                stubOnly: !shouldFullyIndex,
            })
            if (page == null) {
                throw new Error(
                    'Tried to addTagToPage, but could not create the page.',
                )
            }
        }

        // Add new visit if none, else page won't appear in results
        await this.options.pages.storage.addPageVisitIfHasNone(
            page.url,
            Date.now(),
        )
        await this.storage.addTag({ url, name: tag }).catch(initErrHandler())
        await this._updateTagSuggestionsCache({ added: tag })
    }

    // Sugar for the Tag picking UI component
    async updateTagForPage({
        added,
        deleted,
        url,
        tabId,
    }: {
        added: string
        deleted: string
        url: string
        tabId?: number
    }) {
        if (added) {
            await this.addTagToPage({ url, tag: added, tabId })
        }
        if (deleted) {
            await this.delTag({ url, tag: deleted })
        }
    }

    async deleteAllTagsForPage({ url }: { url: string }) {
        return this.storage.deleteAllTagsForPage({ url })
    }

    async deleteTagsForPage({ url, tags }: { url: string; tags: string[] }) {
        return this.storage.deleteTagsForPage({ url, tags })
    }

    async setTagsForAnnotation({
        url,
        tags: newTags,
    }: {
        url: string
        tags: string[]
    }) {
        const existingTags = await this.fetchAnnotationTags({ url })
        const existingTagsSet = new Set(existingTags)
        const newTagsSet = new Set(newTags)

        const toAdd = newTags.filter((tag) => !existingTagsSet.has(tag))
        const toDelete = existingTags.filter((tag) => !newTagsSet.has(tag))

        await this.addTagsToExistingAnnotationUrl({
            url,
            tags: toAdd,
        })
        await this.deleteTagsForPage({ url, tags: toDelete })
    }
}
