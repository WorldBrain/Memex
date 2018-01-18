import PouchDB from 'pouchdb-core'

import PouchDBMemory from 'pouchdb-adapter-memory'
import mapreduce from 'pouchdb-mapreduce'
import replication from 'pouchdb-replication'

PouchDB.plugin(PouchDBMemory)
    .plugin(mapreduce)
    .plugin(replication)

const pouchdbOptions = {
    name: 'testdb',
    auto_compaction: true,
    adapter: 'memory',
}

const db = PouchDB(pouchdbOptions)
export default db
