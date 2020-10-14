import Storex from '@worldbrain/storex'
import { Tabs, Storage } from 'webextension-polyfill-ts'

import TagStorage from './storage'
import { maybeIndexTabs } from 'src/page-indexing/utils'
import { RemoteTagsInterface, TagsSettings } from './types'
import { initErrHandler } from 'src/search/storage'
import SearchBackground from 'src/search/background'
import { Analytics } from 'src/analytics/types'
import { BrowserSettingsStore } from 'src/util/settings'
import { updateSuggestionsCache } from '../utils'
import { PageIndexingBackground } from 'src/page-indexing/background'
import TabManagementBackground from 'src/tab-management/background'

export const limitSuggestionsReturnLength = 20
export const limitSuggestionsStorageLength = 40

export default class TagsBackground {
    storage: TagStorage
    remoteFunctions: RemoteTagsInterface

    private localStorage: BrowserSettingsStore<TagsSettings>

    constructor(
        private options: {
            storageManager: Storex
            pages: PageIndexingBackground
            analytics: Analytics
            tabManagement: TabManagementBackground
            queryTabs?: Tabs.Static['query']
            searchBackgroundModule: SearchBackground
            localBrowserStorage: Storage.LocalStorageArea
        },
    ) {
        this.storage = new TagStorage({
            storageManager: options.storageManager,
        })
        this.remoteFunctions = {
            addTagToExistingUrl: this.addTagToExistingUrl,
            delTag: this.delTag,
            addTagToPage: this.addTagToPage,
            updateTagForPage: this.updateTagForPage,
            setTagsForAnnotation: this.setTagsForAnnotation,
            fetchPageTags: this.fetchPageTags,
            addTagsToOpenTabs: this.addTagsToOpenTabs,
            delTagsFromOpenTabs: this.delTagsFromOpenTabs,
            searchForTagSuggestions: this.searchForTagSuggestions,
            fetchInitialTagSuggestions: this.fetchInitialTagSuggestions,
        }
        this.localStorage = new BrowserSettingsStore<TagsSettings>(
            options.localBrowserStorage,
            { prefix: 'tags_' },
        )
    }

    searchForTagSuggestions = async (args: {
        query: string
        limit?: number
    }) => {
        return this.options.searchBackgroundModule.storage.suggest({
            type: 'tag',
            ...args,
        })
    }

    fetchInitialTagSuggestions = async (
        { limit }: { limit?: number } = { limit: limitSuggestionsReturnLength },
    ) => {
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

    addTagsToOpenTabs = async (params: { name: string; time?: number }) => {
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        const indexed = await maybeIndexTabs(tabs, {
            createPage: this.options.pages.indexPage,
            time: params.time || '$now',
        })

        await this.storage.addTags({
            name: params.name,
            urls: indexed.map((tab) => tab.fullUrl),
        })

        this._updateTagSuggestionsCache({ added: params.name })
    }

    delTagsFromOpenTabs = async ({ name }: { name: string }) => {
        const tabs = await this.options.tabManagement.getOpenTabsInCurrentWindow()

        return this.storage.delTags({
            name,
            urls: tabs.map((tab) => tab.url),
        })
    }

    fetchPageTags = async ({ url }: { url: string }) => {
        return this.storage.fetchPageTags({ url })
    }

    fetchAnnotationTags = async ({ url }: { url: string }) => {
        return this.storage.fetchAnnotationTags({ url })
    }

    addTagToExistingUrl = async ({
        tag,
        url,
    }: {
        tag: string
        url: string
    }) => {
        this.options.analytics.trackEvent({
            category: 'Tags',
            action: 'createForPageViaOverview',
        })
        await this._updateTagSuggestionsCache({ added: tag })
        return this.storage.addTag({ name: tag, url })
    }

    addTagsToExistingAnnotationUrl = async ({
        tags,
        url,
    }: {
        tags: string[]
        url: string
    }) => {
        for (const tag of tags) {
            await this._updateTagSuggestionsCache({ added: tag })
            await this.storage.addAnnotationTag({ name: tag, url })
        }
    }

    addTagsToExistingUrl = async ({
        tags,
        url,
    }: {
        tags: string[]
        url: string
    }) => {
        for (const tag of tags) {
            await this._updateTagSuggestionsCache({ added: tag })
            await this.storage.addTag({ name: tag, url })
        }
    }

    _updateTagSuggestionsCache = async (args: {
        added?: string
        removed?: string
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

    delTag = async ({ tag, url }: { tag: string; url: string }) => {
        return this.storage.delTag({ name: tag, url })
    }

    // Makes sure the page exists first, creating it if it doesn't, before tagging.
    addTagToPage = async ({
        url,
        tag,
        tabId,
    }: {
        url: string
        tag: string
        tabId?: number
    }) => {
        await this.options.pages.indexPage(
            {
                fullUrl: url,
                tabId,
                visitTime: '$now',
            },
            { addInboxEntryOnCreate: true },
        )

        await this.storage.addTag({ url, name: tag }).catch(initErrHandler())
        await this._updateTagSuggestionsCache({ added: tag })
    }

    // Sugar for the Tag picking UI component
    updateTagForPage = async ({
        added,
        deleted,
        url,
        tabId,
    }: {
        added: string
        deleted: string
        url: string
        tabId?: number
    }) => {
        if (added) {
            await this.addTagToPage({ url, tag: added, tabId })
        }
        if (deleted) {
            await this.delTag({ url, tag: deleted })
        }
    }

    deleteAllTagsForPage = async ({ url }: { url: string }) => {
        return this.storage.deleteAllTagsForPage({ url })
    }

    deleteTagsForPage = async ({
        url,
        tags,
    }: {
        url: string
        tags: string[]
    }) => {
        return this.storage.deleteTagsForPage({ url, tags })
    }

    setTagsForAnnotation = async ({
        url,
        tags: newTags,
    }: {
        url: string
        tags: string[]
    }) => {
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
