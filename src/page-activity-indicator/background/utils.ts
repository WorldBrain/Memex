import type {
    SharedList,
    SharedListEntry,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { FollowedList, FollowedListEntry } from './types'

export const sharedListToFollowedList = (
    sharedList: SharedList & { creator: AutoPk; id: AutoPk },
): FollowedList => ({
    name: sharedList.title,
    sharedList: sharedList.id,
    creator: sharedList.creator,
})

export const sharedListEntryToFollowedListEntry = (
    entry: SharedListEntry & { creator: AutoPk; sharedList: AutoPk },
): FollowedListEntry => ({
    followedList: entry.sharedList,
    createdWhen: entry.createdWhen,
    updatedWhen: entry.updatedWhen,
    entryTitle: entry.entryTitle ?? '',
    normalizedPageUrl: entry.normalizedUrl,
    creator: entry.creator,
    hasAnnotations: false,
})
