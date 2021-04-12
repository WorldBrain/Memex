import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-react/lib/types'

export type DisableableState = TaskState | 'disabled' | 'enabled'

export interface RootState {
    isDisplayed: boolean
    showUnsyncedItemCount: boolean
    isAutoBackupEnabled: boolean
    unsyncedItemCount: number
    syncState: DisableableState
    backupState: DisableableState
    lastSuccessfulSyncDate: Date | null
    lastSuccessfulBackupDate: Date | null
}

export type Events = UIEvent<{
    initiateSync: null
    initiateBackup: null
    toggleAutoBackup: null
    setUnsyncedItemCountShown: { isShown: boolean }
    setSyncStatusMenuDisplayState: { isShown: boolean }
}>
