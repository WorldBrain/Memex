export interface PersonalCloudBackend {
    pushObject(
        params: {
            schemaVersion: Date
        } & PersonalCloudObject,
    ): Promise<void>
    streamObjects(): AsyncIterableIterator<PersonalCloudObjectBatch>
}

export interface PersonalCloudObject {
    collection: string
    object: any
}

export interface PersonalCloudObjectBatch {
    objects: Array<PersonalCloudObject>
}
