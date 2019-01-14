import Storex, { CollectionDefinitionMap } from 'storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
} from 'storex-backend-dexie'
import stemmerFn from 'memex-stemmer'

import schemaPatcherFn from './storage/dexie-schema'

export interface CustomField {
    key: string
    field: any // TODO: type properly after storex exports
}

export default <T extends Storex = Storex>({
    dbName,
    stemmer,
    schemaPatcher,
    idbImplementation,
    collections,
    customFields = [],
    modifyInstance = f => f as any,
}: {
    stemmer: typeof stemmerFn
    schemaPatcher: typeof schemaPatcherFn
    dbName: string
    idbImplementation: IndexedDbImplementation
    collections: CollectionDefinitionMap
    customFields?: CustomField[]
    modifyInstance?: (instance: Storex) => T
}): T => {
    const backend = new DexieStorageBackend({
        stemmer,
        schemaPatcher,
        dbName,
        idbImplementation,
    })
    const storex = new Storex({ backend })

    // Override default storex fields with Memex-specific ones
    for (const { key, field } of customFields) {
        storex.registry.fieldTypes.registerType(key, field)
    }

    storex.registry.registerCollections(collections)

    return modifyInstance(storex)
}
