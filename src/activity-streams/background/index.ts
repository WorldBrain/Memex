import StorageManager from '@worldbrain/storex'
import StorexActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import { ActivityStreamsStorage } from '@worldbrain/memex-common/lib/activity-streams/storage/types'

export default class ActivityStreamsBackground {
    backend: ActivityStreamsService
    storage: {
        remote: ActivityStreamsStorage
    }

    constructor(
        public options: {
            storageManager: StorageManager
            callFirebaseFunction(name: string, params: any): Promise<any>
        },
    ) {
        this.storage = {
            remote: new StorexActivityStreamsStorage({
                storageManager: options.storageManager,
            }),
        }
        this.backend = new FirebaseFunctionsActivityStreamsService({
            executeCall: options.callFirebaseFunction,
        })
    }
}
