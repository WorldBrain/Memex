import { SyncReturnValue } from '@worldbrain/storex-sync/lib/index'

export interface PublicSyncInterface {
    requestInitialSync(options?: {
        preserveChannel?: boolean
        excludePassiveData?: boolean
    }): Promise<{ initialMessage: string }>
    answerInitialSync(options: { initialMessage: string }): Promise<void>
    waitForInitialSyncConnected(): Promise<void>
    waitForInitialSync(): Promise<void>

    enableContinuousSync(): Promise<void>
    forceIncrementalSync(): Promise<void | SyncReturnValue>

    listDevices(): Promise<any>
    removeDevice(deviceId: string): Promise<any>
    abortInitialSync(): Promise<void>
}
