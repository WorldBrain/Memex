import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'


PouchDB.plugin(PouchDBFind)

const pouchdbOptions = {
    name: 'webmemex',
    auto_compaction: true,
}

function initDB() {
    return PouchDB(pouchdbOptions)
}

function initTestDB() {
    const PouchDB = require('pouchdb-node')
    const PouchDBMemory = require('pouchdb-adapter-memory')
    PouchDB.plugin(PouchDBMemory)

    return PouchDB({
        ...pouchdbOptions,
        name: 'testdb',
        adapter: 'memory',
    })
}

const db = (process.env.NODE_ENV === 'test')
    ? initTestDB()
    : initDB()

export default db
// Expose db for debugging
if (process.env.NODE_ENV !== 'production') {
    window.db = db
}

// The couch/pouch way to match keys with a given prefix (e.g. one type of docs).
export const keyRangeForPrefix = prefix => ({
    startkey: `${prefix}`,
    endkey: `${prefix}\uffff`,
})

// Present db.find results in the same structure as other PouchDB results.
export const normaliseFindResult = result => ({
    rows: result.docs.map(doc => ({
        doc,
        id: doc._id,
        key: doc._id,
        value: {rev: doc._rev},
    })),
})

// Get rows of a query result indexed by doc id, as an {id: row} object.
export const resultRowsById = result =>
    fromPairs(result.rows.map(row => [row.id, row]))
