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

db.put({
    "_id": "notif_3",
    "title": "Jess is fabulous",
    "body": "And she is 2 legit 2 quit.",
    "viewed": false,
})

db.put({
    "_id": "notif_4",
    "title": "Vanessa is a badass",
    "body": "Canadians rule.",
    "viewed": false,
})

db.put({
    "_id": "notif_5",
    "title": "Stefaaaaaan is the bomb",
    "body": "Dutch guys rule.",
    "viewed": false,
})

db.put({
    "_id": "notif_6",
    "title": "Something else",
    "body": "blagh blah.",
    "viewed": false,
})

db.put({
    "_id": "notif_7",
    "title": "unnnread",
    "body": "Dutch guys rule.",
    "viewed": false,
})

db.put({
    "_id": "notif_8",
    "title": "unnnread",
    "body": "blagh blah.",
    "viewed": false,
})

export default db
