import get from 'lodash/fp/get'
import fromPairs from 'lodash/fp/fromPairs'
import PouchDB from 'pouchdb-browser'
import PouchDBFind from 'pouchdb-find'
import { blobToDataURL } from 'blob-util'


PouchDB.plugin(PouchDBFind)

const pouchdbOptions = {
    name: 'webmemex',
    auto_compaction: true,
}

const db = PouchDB(pouchdbOptions)
export default db

// DEBUG Expose db for debugging or direct user access.
window.db = db

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

// Get an attachment from a doc as a data URL string.
// Pass either a docId or a doc itself, and the attachmentId.
// Returns undefined if non-existent.
export async function getAttachmentAsDataUrl({doc, docId=doc._id, attachmentId}) {
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
    const dataUrl = await blobToDataURL(blob)
    return dataUrl
}
