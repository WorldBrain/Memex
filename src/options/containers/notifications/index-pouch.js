import PouchDB from 'pouchdb'

const db = new PouchDB('sample')

db.put({
    "_id": "mittens1",
    "name": "Mittens1",
    "occupation": "kitten1",
    "age": 31,
})

db.put({
    "_id": "mittens2",
    "name": "Mittens2",
    "occupation": "kitten2",
    "age": 32,
})

export default db
