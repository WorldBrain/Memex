import { FeatureStorage } from 'src/search/storage'

export default class TagStorage extends FeatureStorage {
    static TAGS_COLL = 'tags'

    constructor({ storageManager }) {
        super(storageManager)
    }

    async fetchPageTags({ url }: { url: string }) {
        const tags = await this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .findObjects({
                url,
            })
        return tags.map(({ name }) => name)
    }

    async fetchPages({ name }: { name: string }) {
        return this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .findObjects({ name })
    }

    async addTag({ name, url }: { name: string; url: string }) {
        return this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .createObject({ name, url })
    }

    async delTag({ name, url }: { name: string; url: string }) {
        return this.storageManager
            .collection(TagStorage.TAGS_COLL)
            .deleteObjects({ name, url })
    }

    async addTagsToOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls: Array<string>
    }) {
        await Promise.all(urls.map(url => this.addTag({ name, url })))
    }

    async delTagsFromOpenTabs({
        name,
        urls,
    }: {
        name: string
        urls: Array<string>
    }) {
        await Promise.all(urls.map(url => this.delTag({ name, url })))
    }
}
