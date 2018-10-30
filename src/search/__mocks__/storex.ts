import Storex from 'storex'
import { DexieStorageBackend } from 'storex-backend-dexie'
import stemmer from 'memex-stemmer'

import schemaPatcher from '../storage/dexie-schema'
import { suggestObjects } from '../search/suggest'
import { StorageManager } from '../types'

const indexedDB: IDBFactory = require('fake-indexeddb')
const iDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

const backend = new DexieStorageBackend({
    stemmer,
    schemaPatcher,
    dbName: 'test',
    idbImplementation: {
        factory: indexedDB,
        range: iDBKeyRange,
    },
}) as any

// Extend storex instance with Memex-specific methods
const instance = new Storex({ backend }) as StorageManager
const oldMethod = instance.collection.bind(instance)
instance.collection = (name: string) => ({
    ...oldMethod(name),
    suggestObjects: (query, opts) => suggestObjects(name, query, opts),
})

instance.deleteDB = indexedDB.deleteDatabase

export default instance
