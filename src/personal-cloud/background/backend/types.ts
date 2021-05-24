export interface PersonalCloudBackend {
    pushUpdates(
        updates: Array<
            {
                schemaVersion: Date
            } & PersonalCloudUpdate
        >,
    ): Promise<void>
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
