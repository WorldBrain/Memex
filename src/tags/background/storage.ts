import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    tagCollectionDefinition,
    tagCollectionName,
} from '@worldbrain/memex-storage/lib/tags/constants'

export default class TagStorage extends StorageModule {
    static TAGS_COLL = tagCollectionName

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...tagCollectionDefinition,
        },
        operations: {
            findAllTagsOfPage: {
                collection: TagStorage.TAGS_COLL,
                operation: 'findObjects',
                args: { url: '$url:string' },
            },
            createTag: {
                collection: TagStorage.TAGS_COLL,
                operation: 'createObject',
            },
            deleteTag: {
                collection: TagStorage.TAGS_COLL,
                operation: 'deleteObjects',
                args: { name: '$name:string', url: '$url:string' },
            },
        },
    })

    async fetchPageTags({ url }: { url: string }) {
        const tags = await this.operation('findAllTagsOfPage', { url })
        return tags.map(({ name }) => name)
    }

    async addTag({ name, url }: { name: string; url: string }) {
        return this.operation('createTag', { name, url })
    }

    async delTag({ name, url }: { name: string; url: string }) {
        return this.operation('deleteTag', { name, url })
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
