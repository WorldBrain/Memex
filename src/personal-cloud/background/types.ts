import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type {
    PersonalCloudUpdatePushBatch,
    PersonalCloudClientInstruction,
    PersonalCloudDeviceId,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'

export interface PersonalCloudBackgroundEvents {
    downloadStarted(): void
    downloadStopped(): void
    cloudStatsUpdated(event: { stats: PersonalCloudStats }): void
}
export type PersonalCloudAction =
    | PushObjectAction
    | ExecuteClientInstructionsAction
export enum PersonalCloudActionType {
    PushObject = 'push-object',
    ExecuteClientInstructions = 'execute-client-instruction',
}
export interface PushObjectAction {
    type: PersonalCloudActionType.PushObject
    updates: PersonalCloudUpdatePushBatch
}
export interface ExecuteClientInstructionsAction {
    type: PersonalCloudActionType.ExecuteClientInstructions
    clientInstructions: PersonalCloudClientInstruction[]
}

export interface LocalPersonalCloudSettings {
    deviceId?: PersonalCloudDeviceId
    lastSeen?: number
    isSetUp?: boolean
}

export interface PersonalCloudRemoteInterface {
    enableCloudSyncForNewInstall: () => Promise<void>
    isCloudSyncEnabled: () => Promise<boolean>
    runPassiveDataClean: () => Promise<void>
    isPassiveDataRemovalNeeded: () => Promise<boolean>
    runDataMigrationPreparation: () => Promise<void>
    runDataMigration: () => Promise<void>
}
export interface PersonalCloudStats {
    // countingDownloads: boolean
    // countingUploads: boolean
    pendingDownloads: number
    pendingUploads: number
}

export type AuthChanges =
    | {
          nextUser: AuthenticatedUser
          deviceId: PersonalCloudDeviceId
      }
    | {
          nextUser: null
          deviceId: null
      }
