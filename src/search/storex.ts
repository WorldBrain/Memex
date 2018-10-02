import Storex from 'storex'
import { DexieStorageBackend } from 'storex-backend-dexie'
import stemmer from 'memex-stemmer'

import schemaPatcher from './storage/dexie-schema'
import { suggestObjects } from './search/suggest'
import { StorageManager } from './types'

// Create main singleton to interact with DB in the ext
export const backend = new DexieStorageBackend({
    stemmer,
    schemaPatcher,
    dbName: 'memex',
    idbImplementation: {
        factory: window.indexedDB,
        range: window['IDBKeyRange'],
    },
})

const instance = new Storex({ backend })

// Extend storex instance with Memex-specific methods
instance.collection = (name: string) => ({
    suggestObjects,
    ...instance.collection(name),
})

export default instance as StorageManager
