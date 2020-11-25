export type SyncState = 'disabled' | 'enabled' | 'running' | 'success' | 'error'

export type BackupState =
    | 'disabled'
    | 'enabled'
    | 'running'
    | 'success'
    | 'error'

export interface UnSyncedItemState {
    showUnSyncedItemCount: boolean
    unSyncedItemCount: Number
    onShowUnSyncedItemCount: () => void
    onHideUnSyncedItemCount: () => void
}
