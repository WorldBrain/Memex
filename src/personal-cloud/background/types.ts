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
    lastSyncUpload?: number
    /** Note we're also using this value as the last sync *download* time. */
    lastSeen?: number
    isSetUp?: boolean
}

export interface PersonalCloudRemoteInterface {
    enableCloudSyncForNewInstall: () => Promise<void>
    isCloudSyncEnabled: () => Promise<boolean>
    runPassiveDataClean: () => Promise<void>
    isPassiveDataRemovalNeeded: () => Promise<boolean>
    runDataMigration: () => Promise<void>
    invokeSyncDownload: () => Promise<void>
    countPendingSyncDownloads: () => Promise<number>
}
export interface PersonalCloudStats {
    // countingDownloads: boolean
    // countingUploads: boolean
    pendingDownloads: number
    pendingUploads: number
}
