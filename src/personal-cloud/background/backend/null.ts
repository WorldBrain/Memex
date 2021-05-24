import {
    PersonalCloudBackend,
    PersonalCloudUpdateBatch,
    PersonalCloudObjectInfo,
} from './types'

export class NullPersonalCloudBackend implements PersonalCloudBackend {
    constructor() {}

    pushUpdates: PersonalCloudBackend['pushUpdates'] = async (updates) => {}

    async *streamUpdates(): AsyncIterableIterator<PersonalCloudUpdateBatch> {
        await new Promise(() => {})
    }
}
