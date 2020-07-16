import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from 'src/storage/constants'

export { default as ContentSharingStorage } from '@worldbrain/memex-common/lib/content-sharing/storage'

export class ContentSharingClientStorage extends StorageModule {
    getConfig(): StorageModuleConfig {
        return {
            collections: {
                sharedListMetadata: {
                    version: STORAGE_VERSIONS[20].version,
                    fields: {
                        localId: { type: 'int' },
                        remoteId: { type: 'string' },
                    },
                    indices: [{ field: 'localId', pk: true }],
                },
                sharedListAction: {
                    version: STORAGE_VERSIONS[20].version,
                    fields: {
                        action: { type: 'json' },
                    },
                },
            },
            operations: {
                createMetadata: {
                    operation: 'createObject',
                    collection: 'sharedListMetadata',
                },
                getMetadata: {
                    operation: 'findObject',
                    collection: 'sharedListMetadata',
                    args: { localId: '$localId:number' },
                },
                getMetadataForLists: {
                    operation: 'findObjects',
                    collection: 'sharedListMetadata',
                    args: { localId: { $in: '$localIds' } },
                },
                getPages: {
                    // TODO: Probably doesn't belong here
                    operation: 'findObjects',
                    collection: 'pages',
                    args: { url: { $in: '$normalizedPageUrls' } },
                },
            },
        }
    }

    async storeListId(params: { localId: number; remoteId: string }) {
        const existing = await this.operation('getMetadata', params)
        if (existing) {
            throw new Error(`List #${params.localId} already has server ID`)
        }
        await this.operation('createMetadata', {
            ...params,
        })
    }

    async getRemoteListId(params: { localId: number }): Promise<string | null> {
        const existing = await this.operation('getMetadata', params)
        return existing?.remoteId ?? null
    }

    async getPageTitles(params: { normalizedPageUrls: string[] }) {
        // TODO: Probably doesn't belong here
        const titles: { [pageUrl: string]: string } = {}
        for (const page of await this.operation('getPages', params)) {
            titles[page.url] = page.fullTitle
        }
        return titles
    }

    async areListsShared(options: { localIds: number[] }) {
        const allMetadata = await this.operation('getMetadataForLists', options)
        const shared: { [listId: number]: boolean } = {}
        for (const listMetadata of allMetadata) {
            shared[listMetadata.localId] = true
        }
        for (const localId of options.localIds) {
            if (!shared[localId]) {
                shared[localId] = false
            }
        }
        return shared
    }
}
