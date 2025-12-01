import StorageManager from '@worldbrain/storex/ts'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/ts/shared-sync-log/storex'
import type { FunctionsBackendStorageModules } from '@worldbrain/memex-common/ts/firebase-backend/types'

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
