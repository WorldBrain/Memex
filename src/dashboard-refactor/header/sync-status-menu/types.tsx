import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-react/lib/types'

export type DisableableState = TaskState | 'disabled' | 'enabled'

export interface RootState {
    isDisplayed: boolean
    showUnsyncedItemCount: boolean
    unsyncedItemCount: number
    syncState: DisableableState
    backupState: DisableableState
    lastSuccessfulSyncDateTime: Date
    lastSuccessfulBackupDateTime: Date
}

export type Events = UIEvent<{
    initiateSync: null
    initiateBackup: null
    setUnsyncedItemCountShown: { isShown: boolean }
    setSyncStatusMenuDisplayState: { isShown: boolean }
}>
