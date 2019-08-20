import Storex, {
    CollectionDefinitionMap,
    StorageBackendPlugin,
} from '@worldbrain/storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
} from '@worldbrain/storex-backend-dexie'

import UrlField from './storage/url-field'
import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import stemmerSelector from './stemmers'
import { plugins as backendPlugins } from './storex-plugins'

export default function initStorex(options: {
    dbName: string
    idbImplementation?: IndexedDbImplementation
}): Storex {
    const backend = new DexieStorageBackend({
        stemmerSelector,
        schemaPatcher,
        dbName: options.dbName,
        idbImplementation: options.idbImplementation,
    })

    for (const plugin of backendPlugins) {
        backend.use(plugin)
    }

    const storex = new Storex({ backend })

    // Override default storex fields with Memex-specific ones
    const customFields = [{ key: 'url', field: UrlField }]
    for (const { key, field } of customFields) {
        storex.registry.fieldTypes.registerType(key, field)
    }

    storex.registry.registerCollections(collections)

    return storex
}
