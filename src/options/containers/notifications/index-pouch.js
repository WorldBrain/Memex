import PouchDB from 'pouchdb'

const db = new PouchDB('sample')

db.put({
    "_id": "notif_1",
    "title": "New feature",
    "body": "This is a notification, let's hope it works.",
    "viewed": false,
})

db.put({
    "_id": "notif_2",
    "title": "Privacy settings changed",
    "body": "This is another notification.",
    "viewed": false,
})

export default db
