import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import type { FollowedList, FollowedListEntry } from './types'
import { getFollowedListEntryIdentifier } from './utils'

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
                        platform: { type: 'string', optional: true },
                        lastSync: { type: 'timestamp', optional: true },
                    },
                    indices: [
                        {
                            pk: true,
                            field: 'sharedList',
                        },
                    ],
                    backup: false,
                    watch: false,
                },
                followedListEntry: {
                    version: STORAGE_VERSIONS[27].version,
                    fields: {
                        creator: { type: 'string' },
                        entryTitle: { type: 'text' },
                        followedList: { type: 'string' },
                        normalizedPageUrl: { type: 'string' },
                        hasAnnotationsFromOthers: { type: 'boolean' },
                        createdWhen: { type: 'timestamp' },
                        updatedWhen: { type: 'timestamp' },
                    },
                    indices: [
                        { field: 'normalizedPageUrl' },
                        { field: 'followedList' },
                    ],
                    watch: false,
                    backup: false,
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
                findFollowedListsByIds: {
                    collection: 'followedList',
                    operation: 'findObjects',
                    args: { sharedList: { $in: '$followedListIds:string[]' } },
                },
                findAllFollowedLists: {
                    collection: 'followedList',
                    operation: 'findObjects',
                    args: {},
                },
                findFollowedListEntries: {
                    collection: 'followedListEntry',
                    operation: 'findObjects',
                    args: { followedList: '$followedList:string' },
                },
                findFollowedListEntriesByPage: {
                    collection: 'followedListEntry',
                    operation: 'findObjects',
                    args: { normalizedPageUrl: '$normalizedPageUrl:string' },
                },
                updateFollowedListLastSyncTime: {
                    collection: 'followedList',
                    operation: 'updateObject',
                    args: [
                        { sharedList: '$sharedList:pk' },
                        { lastSync: '$lastSync:number' },
                    ],
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
                            hasAnnotationsFromOthers:
                                '$hasAnnotationsFromOthers:boolean',
                            updatedWhen: '$updatedWhen:number',
                        },
                    ],
                },
                deleteAllFollowedLists: {
                    collection: 'followedList',
                    operation: 'deleteObjects',
                    args: {},
                },
                deleteAllFollowedListEntries: {
                    collection: 'followedListEntry',
                    operation: 'deleteObjects',
                    args: {},
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
            platform: data.platform,
            sharedList: data.sharedList,
        })
        return object.id
    }

    async createFollowedListEntry(
        data: Omit<
            FollowedListEntry,
            'updatedWhen' | 'createdWhen' | 'hasAnnotationsFromOthers'
        > &
            Partial<
                Pick<
                    FollowedListEntry,
                    'updatedWhen' | 'createdWhen' | 'hasAnnotationsFromOthers'
                >
            >,
    ): Promise<AutoPk> {
        const { object } = await this.operation('createFollowedListEntry', {
            creator: data.creator,
            entryTitle: data.entryTitle,
            followedList: data.followedList,
            hasAnnotationsFromOthers: data.hasAnnotationsFromOthers ?? false,
            normalizedPageUrl: data.normalizedPageUrl,
            createdWhen: data.createdWhen ?? Date.now(),
            updatedWhen: data.updatedWhen ?? Date.now(),
        })
        return object.id
    }

    async findFollowedListsByIds(
        followedListIds: AutoPk[],
    ): Promise<Map<AutoPk, FollowedList>> {
        const followedLists: FollowedList[] = await this.operation(
            'findFollowedListsByIds',
            { followedListIds },
        )
        return new Map(followedLists.map((list) => [list.sharedList, list]))
    }

    async findAllFollowedLists(): Promise<Map<AutoPk, FollowedList>> {
        const followedLists: FollowedList[] = await this.operation(
            'findAllFollowedLists',
            {},
        )
        return new Map(followedLists.map((list) => [list.sharedList, list]))
    }

    async findAllFollowedListEntries(
        data: Pick<FollowedList, 'sharedList'>,
    ): Promise<Map<AutoPk, FollowedListEntry>> {
        const followedListEntries: FollowedListEntry[] = await this.operation(
            'findFollowedListEntries',
            { followedList: data.sharedList },
        )
        return new Map(
            followedListEntries.map((entry) => [
                getFollowedListEntryIdentifier(entry),
                entry,
            ]),
        )
    }

    async findFollowedListEntriesByPage(
        data: Pick<FollowedListEntry, 'normalizedPageUrl'>,
    ): Promise<FollowedListEntry[]> {
        const followedListEntries: FollowedListEntry[] = await this.operation(
            'findFollowedListEntriesByPage',
            { normalizedPageUrl: data.normalizedPageUrl },
        )

        return followedListEntries
    }

    async updateFollowedListLastSync(
        data: Pick<FollowedList, 'sharedList' | 'lastSync'>,
    ): Promise<void> {
        await this.operation('updateFollowedListLastSyncTime', {
            sharedList: data.sharedList,
            lastSync: data.lastSync,
        })
    }

    async updateFollowedListEntryHasAnnotations(
        data: Pick<
            FollowedListEntry,
            'followedList' | 'normalizedPageUrl' | 'hasAnnotationsFromOthers'
        > &
            Partial<Pick<FollowedListEntry, 'updatedWhen'>>,
    ): Promise<void> {
        await this.operation('updateFollowedListEntryHasAnnotations', {
            followedList: data.followedList,
            normalizedPageUrl: data.normalizedPageUrl,
            hasAnnotationsFromOthers: data.hasAnnotationsFromOthers,
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

    async deleteAllFollowedListsData(): Promise<void> {
        await this.operation('deleteAllFollowedLists', {})
        await this.operation('deleteAllFollowedListEntries', {})
    }
}
