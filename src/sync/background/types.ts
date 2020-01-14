import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { Claims } from '@worldbrain/memex-common/lib/subscriptions/types'

export interface PublicSyncInterface {
    requestInitialSync(options?: {
        preserveChannel?: boolean
        excludePassiveData?: boolean
    }): Promise<{ initialMessage: string }>
    answerInitialSync(options: { initialMessage: string }): Promise<void>
    waitForInitialSyncConnected(): Promise<void>
    waitForInitialSync(): Promise<void>

    enableContinuousSync(): Promise<void>
    forceIncrementalSync(): Promise<void>

    listDevices(): Promise<any>
    removeDevice(deviceId: string): Promise<any>
}
