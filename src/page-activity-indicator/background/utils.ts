import type { SharedCollectionType } from '@worldbrain/memex-common/lib/content-sharing/storage/types'
import type {
    SharedList,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { FollowedList, FollowedListEntry } from './types'

export const sharedListToFollowedList = (
    sharedList: SharedList & { creator: AutoPk; id: AutoPk },
    extra?: { lastSync?: number },
): FollowedList => ({
    name: sharedList.title,
    type: sharedList.type as SharedCollectionType,
    sharedList: sharedList.id,
    creator: sharedList.creator,
    platform: sharedList.platform,
    lastSync: extra?.lastSync,
})

export const sharedListEntryToFollowedListEntry = (
    entry: SharedListEntry & { creator: AutoPk; sharedList: AutoPk },
    extra?: { id?: AutoPk; hasAnnotationsFromOthers?: boolean },
): FollowedListEntry & { id?: AutoPk } => ({
    id: extra?.id,
    followedList: entry.sharedList,
    createdWhen: entry.createdWhen,
    updatedWhen: entry.updatedWhen,
    entryTitle: entry.entryTitle ?? '',
    normalizedPageUrl: entry.normalizedUrl,
    creator: entry.creator,
    hasAnnotationsFromOthers: extra?.hasAnnotationsFromOthers ?? false,
})

/** Should be used when dealing with identifying followedListEntries without using the PK field. e.g., relating them back to sharedListEntries */
export const getFollowedListEntryIdentifier = (
    entry:
        | Pick<FollowedListEntry, 'followedList' | 'normalizedPageUrl'>
        | (Pick<SharedListEntry, 'normalizedUrl'> & { sharedList: AutoPk }),
): string =>
    'sharedList' in entry
        ? `${entry.sharedList}-${entry.normalizedUrl}`
        : `${entry.followedList}-${entry.normalizedPageUrl}`
