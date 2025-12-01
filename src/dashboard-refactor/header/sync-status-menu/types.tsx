import { UIEvent } from 'ui-logic-core/ts'

export interface RootState {
    isDisplayed: boolean
    lastSuccessfulSyncDate: Date
    pendingLocalChangeCount: number
    pendingRemoteChangeCount: number
}

export type Events = UIEvent<{
    setSyncStatusMenuDisplayState: { isShown: boolean }
    setPendingChangeCounts: { remote?: number; local?: number }
}>
