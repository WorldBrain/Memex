import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'


PouchDB.plugin(PouchDBFind)

const pouchdbOptions = {
    name: 'webmemex',
    auto_compaction: true,
}

<<<<<<< HEAD
let db_
if (process.env.NODE_ENV !== 'test') {
    db_ = PouchDB(pouchdbOptions)
} else {
    // Export a non-persistent version of PouchDB for running tests.
=======
function initDB() {
    return PouchDB(pouchdbOptions)
}

function initTestDB() {
>>>>>>> 16fdf5561a81dd253e18dead1cf4e67f991d5237
    const PouchDB = require('pouchdb-node')
    const PouchDBMemory = require('pouchdb-adapter-memory')
    PouchDB.plugin(PouchDBMemory)

<<<<<<< HEAD
    db_ = PouchDB({
=======
    return PouchDB({
>>>>>>> 16fdf5561a81dd253e18dead1cf4e67f991d5237
        ...pouchdbOptions,
        name: 'testdb',
        adapter: 'memory',
    })
}
<<<<<<< HEAD
const db = db_
=======

const db = (process.env.NODE_ENV === 'test')
    ? initTestDB()
    : initDB()

>>>>>>> 16fdf5561a81dd253e18dead1cf4e67f991d5237
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
