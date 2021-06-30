import {
    PersonalCloudUpdatePushBatch,
    PersonalCloudClientInstruction,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'

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

export interface PersonalCloudSettings {
    deviceId?: PersonalCloudDeviceID
    lastSeen?: number
}
export type PersonalCloudDeviceID = number | string
