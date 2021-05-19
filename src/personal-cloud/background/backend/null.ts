import {
    PersonalCloudBackend,
    PersonalCloudObjectBatch,
    PersonalCloudObject,
} from './types'

export class NullPersonalCloudBackend implements PersonalCloudBackend {
    constructor() {}

    async pushObject(
        params: {
            schemaVersion: Date
        } & PersonalCloudObject,
    ): Promise<void> {}

    async *streamObjects(): AsyncIterableIterator<PersonalCloudObjectBatch> {
        await new Promise(() => {})
    }
}
