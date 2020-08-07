export interface BacklogEntry {
    url: string
    timesRetried: number
    lastRetry: Date
}

export interface BacklogEntryCreateArgs {
    url: string
    timesRetried?: number
    lastRetry?: Date
    createdAt?: Date
}
