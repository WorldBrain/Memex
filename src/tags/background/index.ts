import TagStorage from './storage'
import { TabManager } from 'src/activity-logger/background/tab-manager'
import { StorageManager } from 'src/search/types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import normalizeUrl from 'src/util/encode-url-for-id'

export default class TagsBackground {
    private storage: TagStorage
    private tabMan: TabManager

    constructor({
        storageManager,
        tabMan,
    }: {
        storageManager: StorageManager
        tabMan?: TabManager
    }) {
        this.tabMan = tabMan
        this.storage = new TagStorage({ storageManager })
    }
    setupRemoteFunctions() {
        makeRemotelyCallable({
            addTagsToOpenTabs: tag => {
                const urls = this.tabMan.getUrlsFromOpenTabs()

                return this.addTagsToOpenTabs({ name: tag, urls })
            },
            delTagsFromOpenTabs: tag => {
                const urls = this.tabMan.getUrlsFromOpenTabs()

                return this.delTagsFromOpenTabs({ name: tag, urls })
            },
        })
    }

    /**
     * Adds tags to open tabs
     *
     * @param {Object} obj
     * @param {string} obj.name
     * @param {Array<string>} obj.urls
     * @memberof TagsBackground
     */
    async addTagsToOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls?: Array<string>
    }) {
        urls = urls.map(url => normalizeUrl(url))

        return this.storage.addTagsToOpenTabs({ name, urls })
    }

    /**
     * Adds tags to open tabs
     *
     * @param {Object} obj
     * @param {string} obj.name
     * @param {Array<string>} obj.urls
     * @memberof TagsBackground
     */
    async delTagsFromOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls: Array<string>
    }) {
        urls = urls.map(url => normalizeUrl(url))

        return this.storage.delTagsFromOpenTabs({ name, urls })
    }

    /**
     * Returns all the tags of a page.
     * @param {Object} obj
     * @param {string} obj.url
     * @returns
     * @memberof TagsBackground
     */
    async fetchPageTags({ url }: { url: string }) {
        return this.storage.fetchPageTags({ url: normalizeUrl(url) })
    }

    /**
     * Adds tag to a page.
     * @param {Object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns
     * @memberof TagsBackground
     */
    async addTag({ name, url }: { name: string; url: string }) {
        return this.storage.addTag({ name, url: normalizeUrl(url) })
    }

    /**
     * Deletes tag from a page.
     * @param {Object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns
     * @memberof TagsBackground
     */
    async delTag({ name, url }: { name: string; url: string }) {
        return this.storage.delTag({ name, url: normalizeUrl(url) })
    }

    /**
     * Returns all the pages containing a certain tag.
     * @param {Object} obj
     * @param {string} obj.name
     * @returns
     * @memberof TagsBackground
     */
    async fetchPages({ name }: { name: string }) {
        return this.storage.fetchPages({ name })
    }
}
