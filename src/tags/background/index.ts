import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { StorageManager } from 'src/search/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'
import { Windows } from 'webextension-polyfill-ts'

export default class TagsBackground {
    private storage: TagStorage
    private tabMan: TabManager
    private windows: Windows.Static

    constructor({
        storageManager,
        tabMan,
        windows,
    }: {
        storageManager: StorageManager
        tabMan?: TabManager
        windows?: Windows.Static
    }) {
        this.storage = new TagStorage({ storageManager })
        this.tabMan = tabMan
        this.windows = windows
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTagsToOpenTabs: this.addTagsToOpenTabs.bind(this),
            delTagsFromOpenTabs: this.delTagsFromOpenTabs.bind(this),
        })
    }

    async addTagsToOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls?: Array<string>
    }) {
        if (!urls) {
            const currentWindow = await this.windows.getCurrent()
            urls = this.tabMan.getTabUrls(currentWindow.id)
        }

        return this.storage.addTagsToOpenTabs({
            name,
            urls: urls.map(url => normalizeUrl(url)),
        })
    }

    async delTagsFromOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls?: Array<string>
    }) {
        if (!urls) {
            const currentWindow = await this.windows.getCurrent()
            urls = this.tabMan.getTabUrls(currentWindow.id)
        }

        return this.storage.delTagsFromOpenTabs({
            name,
            urls: urls.map(url => normalizeUrl(url)),
        })
    }

    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url: normalizeUrl(url) })
    }

    async addTag({ name, url }: { name: string; url: string }) {
        return this.storage.addTag({ name, url: normalizeUrl(url) })
    }

    async delTag({ name, url }: { name: string; url: string }) {
        return this.storage.delTag({ name, url: normalizeUrl(url) })
    }

    async fetchPages({ name }: { name: string }) {
        return this.storage.fetchPages({ name })
    }
}
