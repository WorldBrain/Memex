import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type Storex from '@worldbrain/storex'
import type { ServerStorageModules } from 'src/storage/types'
import type {
    FollowedList,
    RemotePageActivityIndicatorInterface,
} from './types'
import type {
    SharedList,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import PageActivityIndicatorStorage from './storage'
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
    remoteFunctions: RemotePageActivityIndicatorInterface

    constructor(private deps: PageActivityIndicatorDependencies) {
        this.storage = new PageActivityIndicatorStorage({
            storageManager: deps.storageManager,
        })

        this.remoteFunctions = {
            getPageActivityStatus: this.getPageActivityStatus,
        }
    }

    private getPageActivityStatus: RemotePageActivityIndicatorInterface['getPageActivityStatus'] = async (
        fullPageUrl,
    ) => {
        const normalizedPageUrl = normalizeUrl(fullPageUrl)
        const followedListEntries = await this.storage.findFollowedListEntriesByPage(
            { normalizedPageUrl },
        )
        if (!followedListEntries.length) {
            return 'no-activity'
        }
        return followedListEntries.reduce(
            (acc, curr) => acc || curr.hasAnnotations,
            false,
        )
            ? 'has-annotations'
            : 'no-annotations'
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
    deleteAllFollowedListsData: PageActivityIndicatorStorage['deleteAllFollowedListsData'] = () =>
        this.storage.deleteAllFollowedListsData()

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

    async syncFollowedLists(): Promise<void> {
        const userId = await this.deps.getCurrentUserId()
        if (userId == null) {
            return
        }
        const sharedLists = await this.getAllUserFollowedSharedListsFromServer({
            id: userId,
            type: 'user-reference',
        })
        const existingFollowedListsLookup = await this.storage.findAllFollowedLists()

        // Remove any local followedLists that don't have an associated remote sharedList (carry over from old implementation, b)
        for (const followedList of existingFollowedListsLookup.values()) {
            if (
                !sharedLists.find((list) => list.id === followedList.sharedList)
            ) {
                await this.storage.deleteFollowedListAndAllEntries({
                    sharedList: followedList.sharedList,
                })
            }
        }

        for (const sharedList of sharedLists) {
            if (!existingFollowedListsLookup.get(sharedList.id)) {
                await this.storage.createFollowedList(
                    sharedListToFollowedList(sharedList),
                )
            }
        }
    }

    async syncFollowedListEntries(opts?: { now?: number }): Promise<void> {
        const userId = await this.deps.getCurrentUserId()
        if (userId == null) {
            return
        }
        const now = opts?.now ?? Date.now()
        const { contentSharing } = await this.deps.getServerStorage()

        const existingFollowedListsLookup = await this.storage.findAllFollowedLists()

        for (const followedList of existingFollowedListsLookup.values()) {
            const listReference: SharedListReference = {
                type: 'shared-list-reference',
                id: followedList.sharedList,
            }
            const existingFollowedListEntryLookup = await this.storage.findAllFollowedListEntries(
                {
                    sharedList: followedList.sharedList,
                },
            )
            const sharedListEntries = await contentSharing.getListEntriesByList(
                {
                    listReference,
                    from: followedList.lastSync,
                },
            )
            const sharedAnnotationListEntries = await contentSharing.getAnnotationListEntries(
                {
                    listReference,
                    // NOTE: We have to always get all the annotation entries as there's way to determine the true->false case for `followedListEntry.hasAnnotations` if you only have partial results
                    // from: localFollowedList?.lastSync,
                },
            )

            for (const entry of sharedListEntries) {
                const hasAnnotations = !!sharedAnnotationListEntries[
                    entry.normalizedUrl
                ]?.length
                const localFollowedListEntry = existingFollowedListEntryLookup.get(
                    getFollowedListEntryIdentifier({
                        ...entry,
                        sharedList: entry.sharedList.id,
                    }),
                )

                if (!localFollowedListEntry) {
                    await this.storage.createFollowedListEntry(
                        sharedListEntryToFollowedListEntry(
                            {
                                ...entry,
                                creator: entry.creator.id,
                                sharedList: entry.sharedList.id,
                            },
                            { hasAnnotations },
                        ),
                    )
                } else if (
                    localFollowedListEntry.hasAnnotations !== hasAnnotations
                ) {
                    await this.storage.updateFollowedListEntryHasAnnotations({
                        normalizedPageUrl: entry.normalizedUrl,
                        followedList: entry.sharedList.id,
                        updatedWhen: now,
                        hasAnnotations,
                    })
                }
            }

            // This handles the case where a new annotation was created, but the assoc. sharedListEntry didn't get their updatedWhen timestamp updated
            const recentAnnotationEntries = Object.values(
                sharedAnnotationListEntries,
            )
                .flat()
                .filter(
                    (annotationEntry) =>
                        !sharedListEntries.find(
                            (entry) =>
                                entry.normalizedUrl ===
                                annotationEntry.normalizedPageUrl,
                        ),
                )
            for (const entry of recentAnnotationEntries) {
                const localFollowedListEntry = existingFollowedListEntryLookup.get(
                    getFollowedListEntryIdentifier({
                        normalizedUrl: entry.normalizedPageUrl,
                        sharedList: entry.sharedList.id,
                    }),
                )
                if (localFollowedListEntry?.hasAnnotations) {
                    continue
                }

                await this.storage.updateFollowedListEntryHasAnnotations({
                    normalizedPageUrl: entry.normalizedPageUrl,
                    followedList: entry.sharedList.id,
                    updatedWhen: now,
                    hasAnnotations: true,
                })
            }

            // This handles the case where the last annotation for an entry was deleted
            for (const localEntry of existingFollowedListEntryLookup.values()) {
                if (
                    localEntry.hasAnnotations &&
                    !sharedAnnotationListEntries[localEntry.normalizedPageUrl]
                        ?.length
                ) {
                    await this.storage.updateFollowedListEntryHasAnnotations({
                        normalizedPageUrl: localEntry.normalizedPageUrl,
                        followedList: localEntry.followedList,
                        updatedWhen: now,
                        hasAnnotations: false,
                    })
                }
            }

            await this.storage.updateFollowedListLastSync({
                sharedList: followedList.sharedList,
                lastSync: now,
            })
        }
    }
}
