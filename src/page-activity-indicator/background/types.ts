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
