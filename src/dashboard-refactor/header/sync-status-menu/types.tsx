export type SyncState = 'disabled' | 'enabled' | 'running' | 'success' | 'error'

export type BackupState =
    | 'disabled'
    | 'enabled'
    | 'running'
    | 'success'
    | 'error'

export interface UnSyncedItemState {
    showUnSyncedItemCount: boolean
    unSyncedItemCount: number
    onShowUnSyncedItemCount: () => void
    onHideUnSyncedItemCount: () => void
}
