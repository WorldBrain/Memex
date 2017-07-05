import get from 'lodash/fp/get'
import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'
import { blobToBase64String } from 'blob-util'


PouchDB.plugin(PouchDBFind)

const pouchdbOptions = {
    name: 'webmemex',
    auto_compaction: true,
}

let db_
if (process.env.NODE_ENV !== 'test') {
    db_ = PouchDB(pouchdbOptions)
} else {
    // Export a non-persistent version of PouchDB for running tests.
    const PouchDB = require('pouchdb-node')
    const PouchDBMemory = require('pouchdb-adapter-memory')
    PouchDB.plugin(PouchDBMemory)

    db_ = PouchDB({
        ...pouchdbOptions,
        name: 'testdb',
        adapter: 'memory',
    })
}
const db = db_
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

// Get an attachment from a doc as a data URI string.
// Pass either a docId or a doc itself, and the attachmentId.
// Returns undefined if non-existent.
export async function getAttachmentAsDataUri({doc, docId=doc._id, attachmentId}) {
    if (!docId
        || !attachmentId
        // If we got passed the doc itself, we can check whether the attachment exists.
        || (doc && !get(['_attachments', attachmentId, 'digest'])(doc))
    ) {
        return undefined
    }
    let blob
    try {
        blob = await db.getAttachment(docId, attachmentId)
    } catch (err) {
        return undefined
    }
    const base64 = await blobToBase64String(blob)
    const dataUri = `data:${blob.type};base64,${base64}`
    return dataUri
}
