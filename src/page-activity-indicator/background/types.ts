import type { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface FollowedList {
    name: string
    type?: SharedCollectionType
    creator: AutoPk
    platform?: string
    lastSync?: number
    sharedList: AutoPk
}

export interface FollowedListEntry {
    creator: AutoPk
    entryTitle: string
    followedList: AutoPk
    sharedListEntry: AutoPk
    hasAnnotationsFromOthers: boolean
    normalizedPageUrl: string
    createdWhen: number
    updatedWhen: number
}

export type PageActivityStatus =
    | 'has-annotations'
    | 'no-annotations'
    | 'no-activity'

export interface RemotePageActivityIndicatorInterface {
    getAllFollowedLists: () => Promise<{
        [remoteListId: string]: Pick<
            FollowedList,
            'sharedList' | 'creator' | 'name'
        >
    }>
    getPageFollowedLists: (
        fullPageUrl: string,
        extraFollowedListIds?: string[],
    ) => Promise<{
        [remoteListId: string]: Pick<
            FollowedList,
            'sharedList' | 'creator' | 'name' | 'type'
        > &
            Pick<FollowedListEntry, 'hasAnnotationsFromOthers'>
    }>
    getEntriesForFollowedLists: (
        followedListIds: string[],
        opts?: { sortAscByCreationTime?: boolean },
    ) => Promise<{
        [followedListId: string]: FollowedListEntry[]
    }>
    getPageActivityStatus: (
        fullPageUrl: string,
    ) => Promise<{
        status: PageActivityStatus
        remoteListIds: AutoPk[]
    }>
}
