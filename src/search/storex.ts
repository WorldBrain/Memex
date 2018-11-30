import Storex, { CollectionDefinitionMap } from 'storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
} from 'storex-backend-dexie'
import stemmerFn from 'memex-stemmer'

import schemaPatcherFn from './storage/dexie-schema'
import { suggestObjects } from './search/suggest'
import { StorageManager, Dexie } from './types'

export interface CustomField {
    key: string
    field: any // TODO: type properly after storex exports
}

export default ({
    dbName,
    stemmer,
    schemaPatcher,
    customFields,
    idbImplementation,
    collections,
}: {
    stemmer: typeof stemmerFn
    schemaPatcher: typeof schemaPatcherFn
    dbName: string
    customFields: CustomField[]
    idbImplementation: IndexedDbImplementation
    collections: CollectionDefinitionMap
}) => {
    const backend = new DexieStorageBackend({
        stemmer,
        schemaPatcher,
        dbName,
        idbImplementation,
    })
    const storex = new Storex({ backend }) as StorageManager

    // Override default storex fields with Memex-specific ones
    for (const { key, field } of customFields) {
        storex.registry.fieldTypes.registerType(key, field)
    }

    // Extend storex instance with Memex-specific methods
    const oldMethod = storex.collection.bind(storex)
    storex.collection = (name: string) => ({
        ...oldMethod(name),
        suggestObjects: (query, opts) =>
            suggestObjects(
                new Promise(res => res(backend.dexieInstance as Dexie)),
            )(name, query, opts),
        findByPk: function(pk) {
            return this.backend.dexie[name].get(pk)
        }.bind(storex),
        streamPks: async function*() {
            const table = this.backend.dexie[name]
            const pks = await table.toCollection().primaryKeys()
            for (const pk of pks) {
                yield pk
            }
        }.bind(storex),
        streamCollection: async function*() {
            const table = this.backend.dexie[name]
            for await (const pk of this.streamPks(name)) {
                yield await { pk, object: await table.get(pk) }
            }
        }.bind(storex),
    })

    storex.deleteDB = window.indexedDB.deleteDatabase
    storex.registry.registerCollections(collections)

    return storex
}
