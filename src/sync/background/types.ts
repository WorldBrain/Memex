import { SyncReturnValue } from '@worldbrain/storex-sync/lib/index'
import { SyncDevice } from '../components/types'

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

    listDevices(): Promise<SyncDevice[]>
    removeDevice(deviceId: string): Promise<any>
    removeAllDevices(): Promise<void>
    abortInitialSync(): Promise<void>
}
