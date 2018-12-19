import stemmer from 'memex-stemmer'

import UrlField from './storage/url-field'
import schemaPatcher from './storage/dexie-schema'
import collections from './old-schema'
import initStorex from './storex'
import { suggestObjects } from './search/suggest'
import { StorageManager, Dexie } from './types'

export default () =>
    initStorex<StorageManager>({
        stemmer,
        collections,
        schemaPatcher,
        dbName: 'memex',
        customFields: [{ key: 'url', field: UrlField }],
        idbImplementation: {
            factory: window.indexedDB,
            range: IDBKeyRange,
        },
        modifyInstance(storex: StorageManager) {
            // Extend storex instance with Memex-specific methods
            const oldMethod = storex.collection.bind(storex)
            storex.collection = (name: string) => ({
                ...oldMethod(name),
                suggestObjects: (query, opts) =>
                    suggestObjects(
                        async () => storex.backend['dexieInstance'] as Dexie,
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

            return storex
        },
    })
