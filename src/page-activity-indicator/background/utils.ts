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
    sharedList: sharedList.id,
    creator: sharedList.creator,
    lastSync: extra?.lastSync,
})

export const sharedListEntryToFollowedListEntry = (
    entry: SharedListEntry & { creator: AutoPk; sharedList: AutoPk },
    extra?: { id: AutoPk },
): FollowedListEntry & { id?: AutoPk } => ({
    id: extra?.id,
    followedList: entry.sharedList,
    createdWhen: entry.createdWhen,
    updatedWhen: entry.updatedWhen,
    entryTitle: entry.entryTitle ?? '',
    normalizedPageUrl: entry.normalizedUrl,
    creator: entry.creator,
    hasAnnotations: false,
})

/** Should be used when dealing with identifying followedListEntries without using the PK field. e.g., relating them back to sharedListEntries */
export const getFollowedListEntryIdentifier = (
    entry: FollowedListEntry | (SharedListEntry & { sharedList: AutoPk }),
): string =>
    'sharedList' in entry
        ? `${entry.sharedList}-${entry.normalizedUrl}`
        : `${entry.followedList}-${entry.normalizedPageUrl}`
