import UrlField from './storage/url-field'
import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import initStorex from './storex'
import { plugins } from './storex-plugins'
import stemmerSelector from './stemmers'

export default () =>
    initStorex({
        stemmerSelector,
        collections,
        schemaPatcher,
        dbName: 'memex',
        customFields: [{ key: 'url', field: UrlField }],
        backendPlugins: plugins,
        idbImplementation: {
            factory: window.indexedDB,
            range: IDBKeyRange,
        },
    })
