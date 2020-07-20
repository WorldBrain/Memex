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
                {
                    moduleVersion: new Date('2020-07-15'),
                    applicationVersion: STORAGE_VERSIONS[20].version,
                },
            ],
        })
        for (const collectionDefinition of [
            config.collections!.clientSyncLogEntry,
            ...config.collections!.clientSyncLogEntry.history,
        ]) {
            collectionDefinition.backup = false
            collectionDefinition.watch = false
        }
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
        for (const collectionDefinition of [
            config.collections!.syncDeviceInfo,
            ...(config.collections!.syncDeviceInfo.history ?? []),
        ]) {
            collectionDefinition.backup = false
            collectionDefinition.watch = false
        }
        return config
    }
}
