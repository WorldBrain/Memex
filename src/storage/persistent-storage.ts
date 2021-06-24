import StorageManager from '@worldbrain/storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
} from '@worldbrain/storex-backend-dexie'

export function createPersistentStorageManager(options?: {
    idbImplementation?: IndexedDbImplementation
}) {
    const backend = new DexieStorageBackend({
        dbName: 'memexPersistent',
        idbImplementation: options?.idbImplementation,
    })

    return new StorageManager({ backend })
}
