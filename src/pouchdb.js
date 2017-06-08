import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'


PouchDB.plugin(PouchDBFind)

const db = new PouchDB({
    name: 'webmemex',
    auto_compaction: true,
})

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
