export interface FollowedList {
    name: string
    creator: string
    lastSync?: number
    sharedList: string
}

export interface FollowedListEntry {
    creator: string
    entryTitle: string
    followedList: string
    hasAnnotations: boolean
    normalizedPageUrl: string
    createdWhen: number
    updatedWhen: number
}
