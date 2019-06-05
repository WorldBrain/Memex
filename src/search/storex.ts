import Storex, {
    CollectionDefinitionMap,
    StorageBackendPlugin,
} from '@worldbrain/storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
    StemmerSelector,
} from '@worldbrain/storex-backend-dexie'

import schemaPatcherFn from './storage/dexie-schema'

export interface CustomField {
    key: string
    field: any // TODO: type properly after storex exports
}

export default <T extends Storex = Storex>({
    dbName,
    stemmerSelector,
    schemaPatcher,
    idbImplementation,
    collections,
    backendPlugins = [],
    customFields = [],
    modifyInstance = f => f as any,
}: {
    stemmerSelector: StemmerSelector
    schemaPatcher: typeof schemaPatcherFn
    dbName: string
    idbImplementation: IndexedDbImplementation
    collections: CollectionDefinitionMap
    backendPlugins?: StorageBackendPlugin<DexieStorageBackend>[]
    customFields?: CustomField[]
    modifyInstance?: (instance: Storex) => T
}): T => {
    const backend = new DexieStorageBackend({
        stemmerSelector,
        schemaPatcher,
        dbName,
        idbImplementation,
    })

    for (const plugin of backendPlugins) {
        backend.use(plugin)
    }

    const storex = new Storex({ backend })

    // Override default storex fields with Memex-specific ones
    for (const { key, field } of customFields) {
        storex.registry.fieldTypes.registerType(key, field)
    }

    storex.registry.registerCollections(collections)

    return modifyInstance(storex)
}
