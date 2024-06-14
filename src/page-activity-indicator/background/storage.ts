import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { COLLECTION_DEFINITIONS } from '@worldbrain/memex-common/lib/storage/modules/followed-lists/constants'
import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import type { FollowedList, FollowedListEntry } from './types'
import { getFollowedListEntryIdentifier } from './utils'

interface InvokeCloudSyncFlag {
    /**
     * NOTE: In most cases you don't want to be invoking cloud sync for the followedList and followedListEntry collections,
     *  as they're not fully supported in the translation layer and there is a separate sync handled via logic in
     *  the PageActivityIndicatorBackground class.
     */
    invokeCloudSync?: boolean
}

export default class PageActivityIndicatorStorage extends StorageModule {
    constructor(private options: StorageModuleConstructorArgs) {
        super(options)
    }

    getConfig(): StorageModuleConfig {
        return {
            collections: COLLECTION_DEFINITIONS,
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
                findFollowedListEntriesForLists: {
                    collection: 'followedListEntry',
                    operation: 'findObjects',
                    args: [
                        { followedList: { $in: '$followedLists:string[]' } },
                        { order: [['createdWhen', 'asc']] },
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
            },
        }
    }

    async createFollowedList(
        data: FollowedList,
        opts?: InvokeCloudSyncFlag,
    ): Promise<AutoPk> {
        const doc = {
            name: data.name,
            type: data.type,
            creator: data.creator,
            lastSync: data.lastSync,
            platform: data.platform,
            sharedList: data.sharedList,
        }

        if (opts?.invokeCloudSync) {
            const { object } = await this.operation('createFollowedList', doc)
            return object.id
        }

        const { object } = await this.options.storageManager.backend.operation(
            'createObject',
            'followedList',
            doc,
        )
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
        opts?: InvokeCloudSyncFlag,
    ): Promise<AutoPk> {
        const doc = {
            creator: data.creator,
            entryTitle: data.entryTitle,
            followedList: data.followedList,
            sharedListEntry: data.sharedListEntry,
            normalizedPageUrl: data.normalizedPageUrl,
            hasAnnotationsFromOthers: data.hasAnnotationsFromOthers ?? false,
            createdWhen: data.createdWhen ?? Date.now(),
            updatedWhen: data.updatedWhen ?? Date.now(),
        }

        if (opts?.invokeCloudSync) {
            const { object } = await this.operation(
                'createFollowedListEntry',
                doc,
            )
            return object.id
        }

        const { object } = await this.options.storageManager.backend.operation(
            'createObject',
            'followedListEntry',
            doc,
        )

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

    async findFollowedListEntriesForLists(
        followedLists: string[],
    ): Promise<{
        [followedListId: string]: FollowedListEntry[]
    }> {
        let listEntries: FollowedListEntry[] = await this.operation(
            'findFollowedListEntriesForLists',
            {
                followedLists,
            },
        )
        // Sort in ascending order by created time
        listEntries = listEntries.sort((a, b) => a.createdWhen - b.createdWhen)

        const entriesLookup: {
            [followedListId: string]: FollowedListEntry[]
        } = {}
        for (const entry of listEntries) {
            const entries = entriesLookup[entry.followedList] ?? []
            entries.push(entry)
            entriesLookup[entry.followedList] = entries
        }
        return entriesLookup
    }

    async updateFollowedListLastSync(
        data: Pick<FollowedList, 'sharedList' | 'lastSync'>,
    ): Promise<void> {
        await this.options.storageManager.backend.operation(
            'updateObject',
            'followedList',
            {
                sharedList: data.sharedList,
            },
            { lastSync: data.lastSync },
        )
    }

    async updateFollowedListEntryHasAnnotations(
        data: Pick<
            FollowedListEntry,
            'followedList' | 'normalizedPageUrl' | 'hasAnnotationsFromOthers'
        > &
            Partial<Pick<FollowedListEntry, 'updatedWhen'>>,
    ): Promise<void> {
        await this.options.storageManager.backend.operation(
            'updateObjects',
            'followedListEntry',
            {
                followedList: data.followedList,
                normalizedPageUrl: data.normalizedPageUrl,
            },
            {
                hasAnnotationsFromOthers: data.hasAnnotationsFromOthers,
                updatedWhen: data.updatedWhen ?? Date.now(),
            },
        )
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
        // No personal cloud analog collection exists for followedListEntry, though there is for page-link followedLists.
        //  Hence why we're bypassing the storex middleware for followedListEntry here but not for followedList
        await this.options.storageManager.backend.operation(
            'deleteObjects',
            'followedListEntry',
            {
                followedList: data.sharedList,
            },
        )
        await this.operation('deleteFollowedList', {
            sharedList: data.sharedList,
        })
    }

    async deleteAllFollowedListsData(): Promise<void> {
        await this.operation('deleteAllFollowedLists', {})
        await this.operation('deleteAllFollowedListEntries', {})
    }
}
