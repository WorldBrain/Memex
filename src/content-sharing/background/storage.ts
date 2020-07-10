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
                        serverId: { type: 'string' },
                        pushedUntil: { type: 'timestamp' },
                    },
                    indices: [{ field: 'localId', pk: true }],
                },
            },
        }
    }
}
