import { SharedSyncLogEntry } from '@worldbrain/storex-sync/lib/shared-sync-log/types'

export interface BacklogEntry {
    url: string
    timesRetried: number
}

export interface BacklogEntryCreateArgs {
    url: string
    timesRetried?: number
    createdAt?: Date
}
