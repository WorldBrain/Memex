import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type Storex from '@worldbrain/storex'
import type { ServerStorageModules } from 'src/storage/types'
import type { FollowedList } from './types'
import PageActivityIndicatorStorage from './storage'
import { SharedList } from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    getFollowedListEntryIdentifier,
    sharedListEntryToFollowedListEntry,
    sharedListToFollowedList,
} from './utils'

export interface PageActivityIndicatorDependencies {
    storageManager: Storex
    getCurrentUserId: () => Promise<AutoPk | null>
    getServerStorage: () => Promise<
        Pick<ServerStorageModules, 'activityFollows' | 'contentSharing'>
    >
}

export class PageActivityIndicatorBackground {
    storage: PageActivityIndicatorStorage

    constructor(private deps: PageActivityIndicatorDependencies) {
        this.storage = new PageActivityIndicatorStorage({
            storageManager: deps.storageManager,
        })
    }

    createFollowedList: PageActivityIndicatorStorage['createFollowedList'] = (
        data,
    ) => this.storage.createFollowedList(data)
    createFollowedListEntry: PageActivityIndicatorStorage['createFollowedListEntry'] = (
        data,
    ) => this.storage.createFollowedListEntry(data)
    updateFollowedListEntryHasAnnotations: PageActivityIndicatorStorage['updateFollowedListEntryHasAnnotations'] = (
        data,
    ) => this.storage.updateFollowedListEntryHasAnnotations(data)
    deleteFollowedListEntry: PageActivityIndicatorStorage['deleteFollowedListEntry'] = (
        data,
    ) => this.storage.deleteFollowedListEntry(data)
    deleteFollowedListAndAllEntries: PageActivityIndicatorStorage['deleteFollowedListAndAllEntries'] = (
        data,
    ) => this.storage.deleteFollowedListAndAllEntries(data)

    private async getAllUserFollowedSharedListsFromServer(
        userReference: UserReference,
    ): Promise<Array<SharedList & { id: AutoPk; creator: AutoPk }>> {
        const {
            activityFollows,
            contentSharing,
        } = await this.deps.getServerStorage()

        const [sharedListFollows, ownedSharedLists] = await Promise.all([
            activityFollows.getAllFollowsByCollection({
                collection: 'sharedList',
                userReference,
            }),
            contentSharing.getListsByCreator(userReference),
        ])

        // A user can follow their own shared lists, so filter them out to reduce reads
        const ownedSharedListIds = new Set(
            ownedSharedLists.map((list) => list.id),
        )
        const followedSharedLists = await contentSharing.getListsByReferences(
            sharedListFollows
                .filter((follow) => !ownedSharedListIds.has(follow.objectId))
                .map((follow) => ({
                    type: 'shared-list-reference',
                    id: follow.objectId,
                })),
        )

        return [
            ...ownedSharedLists,
            ...followedSharedLists.map((list) => ({
                ...list,
                id: list.reference.id,
                creator: list.creator.id,
            })),
        ]
    }

    async syncFollowedListsAndEntries(opts?: { now?: number }): Promise<void> {
        const userId = await this.deps.getCurrentUserId()
        if (userId == null) {
            return
        }
        const { contentSharing } = await this.deps.getServerStorage()

        const sharedLists = await this.getAllUserFollowedSharedListsFromServer({
            id: userId,
            type: 'user-reference',
        })
        const existingFollowedListsLookup = await this.storage.findAllFollowedLists()

        // Do a run over the existing followedLists, to remove any that no longer have assoc. sharedLists existing
        for (const followedList of existingFollowedListsLookup.values()) {
            if (
                !sharedLists.find((list) => list.id === followedList.sharedList)
            ) {
                await this.storage.deleteFollowedListAndAllEntries({
                    sharedList: followedList.sharedList,
                })
            }
        }

        // TODO: reduce N list entry server reads to 1
        for (const sharedList of sharedLists) {
            const existingFollowedListEntryLookup = await this.storage.findAllFollowedListEntries(
                {
                    sharedList: sharedList.id,
                },
            )
            const localFollowedList = existingFollowedListsLookup.get(
                sharedList.id,
            )
            const sharedListEntries = await contentSharing.getListEntriesByList(
                {
                    listReference: {
                        type: 'shared-list-reference',
                        id: sharedList.id,
                    },
                    from: localFollowedList?.lastSync,
                },
            )
            for (const entry of sharedListEntries) {
                if (
                    existingFollowedListEntryLookup.has(
                        getFollowedListEntryIdentifier({
                            ...entry,
                            sharedList: entry.sharedList.id,
                        }),
                    )
                ) {
                    continue
                }
                await this.storage.createFollowedListEntry(
                    sharedListEntryToFollowedListEntry({
                        ...entry,
                        creator: entry.creator.id,
                        sharedList: entry.sharedList.id,
                    }),
                )
            }

            if (localFollowedList == null) {
                await this.storage.createFollowedList(
                    sharedListToFollowedList(sharedList),
                )
            } else {
                await this.storage.updateFollowedListLastSync({
                    sharedList: sharedList.id,
                    lastSync: opts?.now ?? Date.now(),
                })
            }
        }
    }
}
