import stemmer from 'memex-stemmer'

import UrlField from './storage/url-field'
import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import initStorex from './storex'
import inMemoryDb from 'storex-backend-dexie/lib/in-memory'
import { StorageManager } from './types'

export default () => {
    const idbImplementation = inMemoryDb()
    return initStorex<StorageManager>({
        stemmer,
        collections,
        schemaPatcher,
        dbName: 'test',
        customFields: [{ key: 'url', field: UrlField }],
        idbImplementation,
        modifyInstance(storex: StorageManager) {
            // storex.deleteDB = idbImplementation.factory.deleteDatabase
            return storex
        },
    })
}
