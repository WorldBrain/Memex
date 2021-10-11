import {
    PersonalCloudUpdatePushBatch,
    PersonalCloudClientInstruction,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'

export interface PersonalCloudBackgroundEvents {
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
    deviceId?: PersonalCloudDeviceID
    lastSeen?: number
    isSetUp?: boolean
}

export type PersonalCloudDeviceID = number | string

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
