import Storex from '@worldbrain/storex'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from 'src/storage/constants'

export default class PageActivityIndicator extends StorageModule {
    getConfig(): StorageModuleConfig {
        return {
            collections: {
                followedList: {
                    version: STORAGE_VERSIONS[27].version,
                    fields: {
                        name: { type: 'string' },
                        lastSync: { type: 'timestamp' },
                        sharedList: { type: 'string' },
                    },
                    indices: [
                        {
                            field: 'sharedList',
                            unique: true,
                        },
                    ],
                },
                followedListEntry: {
                    version: STORAGE_VERSIONS[27].version,
                    fields: {
                        creator: { type: 'string' },
                        sharedList: { type: 'string' },
                        entryTitle: { type: 'string' },
                        normalizedPageUrl: { type: 'string' },
                        hasAnnotations: { type: 'boolean' },
                        createdWhen: { type: 'timestamp' },
                        updatedWhen: { type: 'timestamp' },
                    },
                    indices: [
                        { field: 'normalizedPageUrl' },
                        { field: 'sharedList' },
                    ],
                    relationships: [{ childOf: 'followedList' }],
                },
            },
            operations: {},
        }
    }
}
