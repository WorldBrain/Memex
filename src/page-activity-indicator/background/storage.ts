import { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { FollowedList, FollowedListEntry } from './types'

export default class PageActivityIndicatorStorage extends StorageModule {
    getConfig(): StorageModuleConfig {
        return {
            collections: {
                followedList: {
                    version: STORAGE_VERSIONS[27].version,
                    fields: {
                        name: { type: 'string' },
                        creator: { type: 'string' },
                        sharedList: { type: 'string' },
                        lastSync: { type: 'timestamp', optional: true },
                    },
                    indices: [
                        {
                            pk: true,
                            field: 'sharedList',
                        },
                    ],
                },
                followedListEntry: {
                    version: STORAGE_VERSIONS[27].version,
                    fields: {
                        creator: { type: 'string' },
                        entryTitle: { type: 'text' },
                        normalizedPageUrl: { type: 'string' },
                        hasAnnotations: { type: 'boolean' },
                        createdWhen: { type: 'timestamp' },
                        updatedWhen: { type: 'timestamp' },
                    },
                    indices: [
                        { field: 'normalizedPageUrl' },
                        { field: 'followedList' },
                    ],
                    relationships: [{ childOf: 'followedList' }],
                },
            },
            operations: {
                createFollowedList: {
                    collection: 'followedList',
                    operation: 'createObject',
                },
                createFollowedListEntry: {
                    collection: 'followedListEntry',
                    operation: 'createObject',
                },
                findAllFollowedLists: {
                    collection: 'followedList',
                    operation: 'findObjects',
                    args: {},
                },
                updateFollowedListEntryHasAnnotations: {
                    collection: 'followedListEntry',
                    operation: 'updateObjects',
                    args: [
                        {
                            followedList: '$followedList:string',
                            normalizedPageUrl: '$normalizedPageUrl:string',
                        },
                        {
                            hasAnnotations: '$hasAnnotations:boolean',
                            updatedWhen: '$updatedWhen:number',
                        },
                    ],
                },
                deleteFollowedList: {
                    collection: 'followedList',
                    operation: 'deleteObject',
                    args: {
                        sharedList: '$sharedList:string',
                    },
                },
                deleteFollowedListEntry: {
                    collection: 'followedListEntry',
                    operation: 'deleteObjects',
                    args: {
                        followedList: '$followedList:string',
                        normalizedPageUrl: '$normalizedPageUrl:string',
                    },
                },
                deleteFollowedListEntries: {
                    collection: 'followedListEntry',
                    operation: 'deleteObjects',
                    args: {
                        followedList: '$followedList:string',
                    },
                },
            },
        }
    }

    async createFollowedList(data: FollowedList): Promise<AutoPk> {
        const { object } = await this.operation('createFollowedList', {
            name: data.name,
            creator: data.creator,
            lastSync: data.lastSync,
            sharedList: data.sharedList,
        })
        return object.id
    }

    async createFollowedListEntry(
        data: Omit<
            FollowedListEntry,
            'updatedWhen' | 'createdWhen' | 'hasAnnotations'
        > &
            Partial<
                Pick<
                    FollowedListEntry,
                    'updatedWhen' | 'createdWhen' | 'hasAnnotations'
                >
            >,
    ): Promise<AutoPk> {
        const { object } = await this.operation('createFollowedListEntry', {
            creator: data.creator,
            entryTitle: data.entryTitle,
            followedList: data.followedList,
            hasAnnotations: data.hasAnnotations ?? false,
            normalizedPageUrl: data.normalizedPageUrl,
            createdWhen: data.createdWhen ?? Date.now(),
            updatedWhen: data.updatedWhen ?? Date.now(),
        })
        return object.id
    }

    async updateFollowedListEntryHasAnnotations(
        data: Pick<
            FollowedListEntry,
            'followedList' | 'normalizedPageUrl' | 'hasAnnotations'
        > &
            Partial<Pick<FollowedListEntry, 'updatedWhen'>>,
    ): Promise<void> {
        await this.operation('updateFollowedListEntryHasAnnotations', {
            followedList: data.followedList,
            normalizedPageUrl: data.normalizedPageUrl,
            hasAnnotations: data.hasAnnotations,
            updatedWhen: data.updatedWhen ?? Date.now(),
        })
    }

    async deleteFollowedListEntry(
        data: Pick<FollowedListEntry, 'followedList' | 'normalizedPageUrl'>,
    ): Promise<void> {
        await this.operation('deleteFollowedListEntry', {
            followedList: data.followedList,
            normalizedPageUrl: data.normalizedPageUrl,
        })
    }

    async deleteFollowedListAndAllEntries(
        data: Pick<FollowedList, 'sharedList'>,
    ): Promise<void> {
        await this.operation('deleteFollowedList', {
            sharedList: data.sharedList,
        })
        await this.operation('deleteFollowedListEntries', {
            followedList: data.sharedList,
        })
    }
}
