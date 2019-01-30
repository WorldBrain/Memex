import { FeatureStorage } from 'src/search/storage'

export default class TagStorage extends FeatureStorage {
    static TAGS_COLL = 'tags'

    constructor({ storageManager }) {
        super(storageManager)
    }

    /**
     * Returns all the tags of a page.
     *
     * @param {Object} obj
     * @param {string} obj.url
     * @returns
     * @memberof TagStorage
     */
    async fetchPageTags({ url }: { url: string }) {
        const tags = await this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .findObjects({
                url,
            })
        return tags.map(({ name }) => name)
    }

    /**
     * Returns all the pages containing a certain tag.
     * @param {Object} obj
     * @param {string} obj.name
     * @returns
     * @memberof TagStorage
     */
    async fetchPages({ name }: { name: string }) {
        return this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .findObjects({ name })
    }

    /**
     * Returns boolean if page has a tag.
     *
     * @param {object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns {boolean}
     */
    async pageHasTag({ name, url }: { name: string; url: string }) {
        const tags = await this.fetchPageTags({ url })
        return tags.includes(name)
    }

    /**
     * Adds tag to a page
     *
     * @param {object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns
     * @memberof TagStorage
     */
    async addTag({ name, url }: { name: string; url: string }) {
        const tagExists = await this.pageHasTag({ name, url })
        if (!tagExists) {
            return this.storageManager
                .collection(TagStorage.TAGS_COLL)
                .createObject({ name, url })
        }
    }

    /**
     * Deletes tag from page.
     *
     * @param {object} obj
     * @param {string} obj.name
     * @param {string} obj.url
     * @returns
     * @memberof TagStorage
     */
    async delTag({ name, url }: { name: string; url: string }) {
        const tagExists = await this.pageHasTag({ name, url })
        if (tagExists) {
            return this.storageManager
                .collection(TagStorage.TAGS_COLL)
                .deleteObjects({ name, url })
        }
    }

    /**
     * Adds tags to all opened tabs.
     *
     * @param {Object} obj
     * @param {string} obj.name
     * @param {Array<string>} obj.urls
     * @returns
     * @memberof TagStorage
     */
    async addTagsToOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls: Array<string>
    }) {
        for (const url of urls) {
            await this.addTag({ name, url })
        }
    }

    /**
     * Deletes tags from all opened tabs.
     *
     * @param {Object} obj
     * @param {string} obj.name
     * @param {Array<string>} obj.urls
     * @returns
     * @memberof TagStorage
     */
    async delTagsFromOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls: Array<string>
    }) {
        for (const url of urls) {
            await this.delTag({ name, url })
        }
    }
}
