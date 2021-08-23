import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import { PERSISTENT_STORAGE_VERSIONS } from 'src/storage/constants'
import { StoredContentType } from './types'

export default class PersistentPageStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            docContent: {
                version: PERSISTENT_STORAGE_VERSIONS[0].version,
                fields: {
                    normalizedUrl: { type: 'string' },
                    storedContentType: { type: 'string' },
                    content: { type: 'json' },
                },
                indices: [{ field: 'normalizedUrl' }],
            },
        },
        operations: {
            createDocContent: {
                operation: 'createObject',
                collection: 'docContent',
            },
            findDocContentByUrl: {
                operation: 'findObject',
                collection: 'docContent',
                args: {
                    normalizedUrl: '$normalizedUrl:string',
                },
            },
            updateDocContent: {
                operation: 'updateObjects',
                collection: 'docContent',
                args: [
                    { normalizedUrl: '$normalizedUrl:string' },
                    { htmlBody: '$htmlBody:string' },
                ],
            },
        },
    })

    async createOrUpdatePage(params: {
        normalizedUrl: string
        storedContentType: StoredContentType
        content: any
    }) {
        const existing = await this.operation('findDocContentByUrl', params)
        if (existing) {
            await this.operation('updateDocContent', params)
        } else {
            await this.operation('createDocContent', params)
        }
    }
}
