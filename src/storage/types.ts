import StorageManager from '@worldbrain/storex'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import type { FunctionsBackendStorageModules } from '@worldbrain/memex-common/lib/firebase-backend/types'

export type ServerStorageModules = Omit<
    FunctionsBackendStorageModules,
    'analytics'
>

export type ServerStorage = {
    manager: StorageManager
    modules: ServerStorageModules & {
        sharedSyncLog: SharedSyncLogStorage
    }
}
