import { UIEvent } from 'ui-logic-core'

export interface RootState {
    isDisplayed: boolean
    lastSuccessfulSyncDate: Date | null
    pendingLocalChangeCount: number
    pendingRemoteChangeCount: number
}

export type Events = UIEvent<{
    setSyncStatusMenuDisplayState: { isShown: boolean }
    setPendingChangeCounts: { remote?: number; local?: number }
}>
