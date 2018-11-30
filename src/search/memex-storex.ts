import stemmer from 'memex-stemmer'

import UrlField from './storage/url-field'
import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import initStorex from './storex'

export default () =>
    initStorex({
        stemmer,
        collections,
        schemaPatcher,
        dbName: 'memex',
        customFields: [{ key: 'url', field: UrlField }],
        idbImplementation: {
            factory: window.indexedDB,
            range: IDBKeyRange,
        },
    })
