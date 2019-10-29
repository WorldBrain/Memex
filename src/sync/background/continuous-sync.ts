import {
    ContinuousSync,
    ContinuousSyncDependencies,
} from '@worldbrain/storex-sync/lib/integration/continuous-sync'
import { SyncPreSendProcessor, SyncSerializer } from '@worldbrain/storex-sync'
import { isTermsField } from 'src/storage/utils'
import { SyncSecretStore } from './secrets'
import { EncryptedSyncSerializer } from './sync-serializer'

export default class MemexContinuousSync extends ContinuousSync {
    public useEncryption = true
    private syncSerializer: SyncSerializer

    constructor(
        options: ContinuousSyncDependencies & { secretStore: SyncSecretStore },
    ) {
        super(options)

        this.syncSerializer = new EncryptedSyncSerializer({
            secretStore: options.secretStore,
        })
    }

    getPreSendProcessor(): SyncPreSendProcessor | void {
        return _preSendProcessor
    }

    getSerializer(): SyncSerializer | void {
        return this.useEncryption ? this.syncSerializer : undefined
    }
}

export const _preSendProcessor: SyncPreSendProcessor = async ({
    entry,
    ...params
}) => {
    if (entry.operation === 'create') {
        for (const field of Object.keys(entry.value)) {
            if (isTermsField({ field, collection: entry.collection })) {
                delete entry.value[field]
            }
        }
        if (!Object.keys(entry.value).length) {
            return { entry: null }
        } else {
            return { entry }
        }
    } else if (entry.operation === 'modify') {
        if (isTermsField(entry)) {
            return { entry: null }
        } else {
            return { entry }
        }
    } else {
        return { entry, ...params }
    }
}
