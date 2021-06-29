import { PersonalCloudUpdatePushBatch } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'

export type PersonalCloudAction = PushObjectAction
export enum PersonalCloudActionType {
    PushObject = 'push-object',
    UploadToStorage = 'upload-to-storage',
}
export interface PushObjectAction {
    type: PersonalCloudActionType.PushObject
    updates: PersonalCloudUpdatePushBatch
}
export interface UploadToStorageAction {
    type: PersonalCloudActionType.UploadToStorage
}

export interface PersonalCloudSettings {
    deviceId?: PersonalCloudDeviceID
    lastSeen?: number
}
export type PersonalCloudDeviceID = number | string
