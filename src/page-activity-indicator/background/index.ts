import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type Storex from '@worldbrain/storex'
import type { ServerStorageModules } from 'src/storage/types'
import type { FollowedList } from './types'
import PageActivityIndicatorStorage from './storage'

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

    async syncFollowedListsAndEntries(opts?: { from?: number }): Promise<void> {
        const userId = await this.deps.getCurrentUserId()
        if (userId == null) {
            return
        }
        const userReference: UserReference = {
            id: userId,
            type: 'user-reference',
        }
        const {
            activityFollows,
            contentSharing,
        } = await this.deps.getServerStorage()
    }
}
