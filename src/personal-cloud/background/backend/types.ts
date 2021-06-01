import StorageManager from '@worldbrain/storex'

export interface PersonalCloudBackend {
    pushUpdates(updates: PersonalCloudUpdatePushBatch): Promise<void>
    streamUpdates(): AsyncIterableIterator<PersonalCloudUpdateBatch>
}

export type PersonalCloudUpdate =
    | PersonalCloudOverwriteUpdate
    | PersonalCloudDeleteUpdate
export enum PersonalCloudUpdateType {
    Overwrite = 'overwrite',
    Delete = 'delete',
}
export interface PersonalCloudOverwriteUpdate extends PersonalCloudObjectInfo {
    // Overwrite means that it should be created if not exists
    // and all fields of existing objects replaced if it exists
    type: PersonalCloudUpdateType.Overwrite
}
export interface PersonalCloudDeleteUpdate {
    type: PersonalCloudUpdateType.Delete
    collection: string
    where: { [key: string]: number | string }
}

export interface PersonalCloudObjectInfo {
    collection: string
    object: any
}

export type PersonalCloudUpdateBatch = Array<PersonalCloudUpdate>
export type PersonalCloudUpdatePushBatch = Array<PersonalCloudUpdatePush>
export type PersonalCloudUpdatePush = {
    schemaVersion: Date
    deviceId: number | string
} & PersonalCloudUpdate

export interface TranslationLayerDependencies {
    storageManager: StorageManager
    userId: number | string
    getNow(): number
}
