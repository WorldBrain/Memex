import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export interface FollowedList {
    name: string
    creator: AutoPk
    lastSync?: number
    sharedList: AutoPk
}

export interface FollowedListEntry {
    creator: AutoPk
    entryTitle: string
    followedList: AutoPk
    hasAnnotations: boolean
    normalizedPageUrl: string
    createdWhen: number
    updatedWhen: number
}

export type PageActivityStatus =
    | 'has-annotations'
    | 'no-annotations'
    | 'no-activity'

export interface RemotePageActivityIndicatorInterface {
    getPageFollowedLists: (
        fullPageUrl: string,
        extraFollowedListIds?: string[],
    ) => Promise<{
        [remoteListId: string]: Pick<
            FollowedList,
            'sharedList' | 'creator' | 'name'
        > &
            Pick<FollowedListEntry, 'hasAnnotations'>
    }>
    getPageActivityStatus: (
        fullPageUrl: string,
    ) => Promise<PageActivityStatus | false>
}
