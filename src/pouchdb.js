import PouchDB from 'pouchdb-browser'
import PouchDBQuickSearch from 'pouchdb-quick-search'
import PouchDBFind from 'pouchdb-find'
import PouchDBUpsert from 'pouchdb-upsert'

PouchDB.plugin(PouchDBQuickSearch)
PouchDB.plugin(PouchDBFind)
PouchDB.plugin(PouchDBUpsert)

const db = new PouchDB({
    name: 'webmemex',
    auto_compaction: true,
})

export default db

// Expose db for debugging
if (process.env.NODE_ENV !== 'production') {
    window.db = db
}

// Calls the callback on any change to the database
export function onDatabaseChange(callback) {
    return db.changes({
        live: true,
        since: 'now',
    }).on('change', callback)
}

// The couch/pouch way to match keys with a given prefix (e.g. one type of docs).
export const keyRangeForPrefix = prefix => ({
    startkey: `${prefix}`,
    endkey: `${prefix}\uffff`
})

// Present db.find results in the same structure as other PouchDB results.
export const normaliseFindResult = result => ({
    rows: result.docs.map(doc => ({
        doc,
        id: doc._id,
        key: doc._id,
        value: {rev: doc._rev},
    }))
})
