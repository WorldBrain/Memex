import Dexie from 'dexie'

const db = new Dexie('webmemex')
db.version(1).stores({
    eventLog: `timestamp, action, category`,
    eventLink: `timestamp, linkType, url`,
    eventPage: `timestamp, action_name`,
})

export default db
