import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface FollowedList {
    name: string
    creator: AutoPk
    platform?: string
    lastSync?: number
    sharedList: AutoPk
}

export interface FollowedListEntry {
    creator: AutoPk
    entryTitle: string
    followedList: AutoPk
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
            'sharedList' | 'creator' | 'name'
        > &
            Pick<FollowedListEntry, 'hasAnnotationsFromOthers'>
    }>
    getPageActivityStatus: (
        fullPageUrl: string,
    ) => Promise<PageActivityStatus | false>
}
