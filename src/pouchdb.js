import PouchDB from 'pouchdb-browser'
import PouchDBQuickSearch from 'pouchdb-quick-search'
import docuri from 'docuri'

PouchDB.plugin(PouchDBQuickSearch);
const db = new PouchDB('webmemex')

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

// Creates an _id string given the variables, or vice versa parses such strings
export const convertLogEntryId = docuri.route('logEntry/:timestamp(/:nonce)')
