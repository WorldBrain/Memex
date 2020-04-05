import { ClientSyncLogStorage } from '@worldbrain/storex-sync/lib/client-sync-log'
import { StorageModuleConfig } from '@worldbrain/storex-pattern-modules'
import { mapCollectionVersions } from '@worldbrain/storex-pattern-modules/lib/utils'
import { SyncInfoStorage } from '@worldbrain/memex-common/lib/sync/storage'
import { STORAGE_VERSIONS } from 'src/storage/constants'

export class MemexExtClientSyncLogStorage extends ClientSyncLogStorage {
    getConfig(): StorageModuleConfig {
        const config = super.getConfig()
        config.collections = mapCollectionVersions({
            collectionDefinitions: config.collections!,
            mappings: [
                {
                    moduleVersion: new Date('2019-02-05'),
                    applicationVersion: STORAGE_VERSIONS[18].version,
                },
            ],
        })
        config.collections!.clientSyncLogEntry.backup = false
        config.collections!.clientSyncLogEntry.watch = false
        return config
    }
}

export class MemexExtSyncInfoStorage extends SyncInfoStorage {
    getConfig(): StorageModuleConfig {
        const config = super.getConfig()
        config.collections = mapCollectionVersions({
            collectionDefinitions: config.collections!,
            mappings: [
                {
                    moduleVersion: new Date('2019-11-20'),
                    applicationVersion: STORAGE_VERSIONS[18].version,
                },
            ],
        })
        config.collections!.syncDeviceInfo.backup = false
        config.collections!.syncDeviceInfo.watch = false
        return config
    }
}
