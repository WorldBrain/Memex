import StorageManager from '@worldbrain/storex'
import { getObjectPk } from '@worldbrain/storex/lib/utils'
import { FastSyncPreSendProcessor } from '@worldbrain/storex-sync/lib/fast-sync'
import {
    InitialSync,
    InitialSyncDependencies,
    InitialSyncInfo,
} from '@worldbrain/storex-sync/lib/integration/initial-sync'
import { createPassiveDataChecker } from 'src/storage/utils'
import { SyncSecretStore } from './secrets'

export {
    SignalTransportFactory,
} from '@worldbrain/storex-sync/lib/integration/initial-sync'

export default class MemexInitialSync extends InitialSync {
    public filterPassiveData = false

    constructor(
        private options: InitialSyncDependencies & {
            secrectStore: SyncSecretStore
        },
    ) {
        super(options)
    }

    protected getPreSendProcessor() {
        return (
            this.filterPassiveData &&
            _createExcludePassivePreSendFilter({
                storageManager: this.dependencies.storageManager,
            })
        )
    }

    protected async preSync(options: InitialSyncInfo) {
        const { secrectStore } = this.options
        if (options.role === 'sender') {
            let key = await secrectStore.getSyncEncryptionKey()
            if (!key) {
                await secrectStore.generateSyncEncryptionKey()
                key = await secrectStore.getSyncEncryptionKey()
            }
            await options.senderFastSyncChannel.sendUserPackage({
                type: 'encryption-key',
                key,
            })
        } else {
            const userPackage = await options.receiverFastSyncChannel.receiveUserPackage()
            if (userPackage.type !== 'encryption-key') {
                throw new Error(
                    'Expected to receive encryption key in inital sync, but got ' +
                        userPackage.type,
                )
            }
            await secrectStore.setSyncEncryptionKey(userPackage.key)
        }
    }
}

export function _createExcludePassivePreSendFilter(dependencies: {
    storageManager: StorageManager
}): FastSyncPreSendProcessor {
    const isPassiveData = createPassiveDataChecker(dependencies)
    return async params => {
        return (await isPassiveData({
            collection: params.collection,
            pk: getObjectPk(
                params.object,
                params.collection,
                dependencies.storageManager.registry,
            ),
        }))
            ? { object: null }
            : params
    }
}
