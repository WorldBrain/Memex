import Dexie from 'dexie'

const db = new Dexie('webmemex')
db.version(1).stores({
    eventLog: `++id, timestamp, type, data`,
})

export default db
