import Storex from '@worldbrain/storex'
import {
    DexieStorageBackend,
    IndexedDbImplementation,
} from '@worldbrain/storex-backend-dexie'

import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import stemmerSelector from './stemmers'
import { createStorexPlugins } from './storex-plugins'

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

    for (const plugin of createStorexPlugins()) {
        backend.use(plugin)
    }

    const storex = new Storex({ backend })

    storex.registry.registerCollections(collections)

    return storex
}
