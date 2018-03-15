import Dexie from 'dexie'

const db = new Dexie('webmemex')
db.version(1).stores({
    eventLog: `timestamp, type, data`,
    eventAggregator: `type, data`,
})

export default db
